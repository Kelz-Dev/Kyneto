const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Kyneto Protocol — End-to-End Integration", function () {
    // Accounts
    let owner, client, provider1, provider2, provider3, treasury, newProvider;
    
    // Contracts
    let token, registry, pledges, marketplace, proofVerifier, paymentDistributor, slashingManager;
    
    // Constants
    const ONE_DAY = 24 * 60 * 60;
    const SHARDS_PER_FILE = 15;
    
    beforeEach(async function () {
        [owner, client, provider1, provider2, provider3, treasury, newProvider] = await ethers.getSigners();
        
        // 1. Deploy StorageToken
        const StorageToken = await ethers.getContractFactory("StorageToken");
        token = await StorageToken.deploy();
        await token.waitForDeployment();
        
        // 2. Deploy ProviderRegistry
        const ProviderRegistry = await ethers.getContractFactory("ProviderRegistry");
        registry = await ProviderRegistry.deploy();
        await registry.waitForDeployment();
        
        // 3. Deploy CapacityPledge
        const CapacityPledge = await ethers.getContractFactory("CapacityPledge");
        pledges = await CapacityPledge.deploy(await token.getAddress());
        await pledges.waitForDeployment();
        
        // 4. Deploy StorageMarketplace
        const StorageMarketplace = await ethers.getContractFactory("StorageMarketplace");
        marketplace = await StorageMarketplace.deploy(
            await token.getAddress(),
            await registry.getAddress(),
            await pledges.getAddress(),
            treasury.address
        );
        await marketplace.waitForDeployment();
        
        // 5. Deploy ProofVerifier
        const ProofVerifier = await ethers.getContractFactory("ProofVerifier");
        proofVerifier = await ProofVerifier.deploy();
        await proofVerifier.waitForDeployment();
        
        // 6. Deploy PaymentDistributor
        const PaymentDistributor = await ethers.getContractFactory("PaymentDistributor");
        paymentDistributor = await PaymentDistributor.deploy(
            await token.getAddress(),
            await marketplace.getAddress(),
            await pledges.getAddress(),
            await registry.getAddress()
        );
        await paymentDistributor.waitForDeployment();
        
        // 7. Deploy SlashingManager
        const SlashingManager = await ethers.getContractFactory("SlashingManager");
        slashingManager = await SlashingManager.deploy(
            await token.getAddress(),
            await registry.getAddress()
        );
        await slashingManager.waitForDeployment();
        
        // Wire permissions
        await token.authorizeMinter(await paymentDistributor.getAddress());
        await token.authorizeBurner(await slashingManager.getAddress());
        await marketplace.setPaymentDistributor(await paymentDistributor.getAddress());
        await registry.authorizeRecordKeeper(await slashingManager.getAddress());
        await registry.authorizeRecordKeeper(await marketplace.getAddress());
        
        // Fund client with tokens for deals
        await token.transfer(client.address, ethers.parseEther("10000"));
        await token.connect(client).approve(await marketplace.getAddress(), ethers.parseEther("10000"));
        
        // Fund providers with tokens for pledges
        for (const provider of [provider1, provider2, provider3]) {
            await token.transfer(provider.address, ethers.parseEther("1000"));
            await token.connect(provider).approve(await pledges.getAddress(), ethers.parseEther("1000"));
        }
    });
    
    describe("Provider Lifecycle", function () {
        it("Should register a provider, create a pledge, and be eligible for deals", async function () {
            await registry.connect(provider1).registerProvider(
                "QmPeerId123",
                "https://provider1.kyneto.io",
                "na",
                5000 // $0.005 min price
            );
            
            const p = await registry.getProvider(provider1.address);
            expect(p.registered).to.equal(true);
            expect(p.reputationScore).to.equal(50);
            
            await pledges.connect(provider1).createPledge(100, 30 * ONE_DAY, ethers.parseEther("100"));
            const pledge = await pledges.getPledge(provider1.address, 0);
            expect(pledge.capacityGB).to.equal(100);
            expect(pledge.active).to.equal(true);
        });
        
        it("Should reject duplicate providers in a deal", async function () {
            // Register providers
            for (const p of [provider1, provider2]) {
                await registry.connect(p).registerProvider("peer", "endpoint", "na", 5000);
                await token.connect(p).approve(await pledges.getAddress(), ethers.parseEther("100"));
                await pledges.connect(p).createPledge(100, 30 * ONE_DAY, ethers.parseEther("100"));
            }
            
            const providers = Array(15).fill(provider1.address); // all duplicates
            await expect(
                marketplace.connect(client).createDeal({
                    fileCID: "QmTest",
                    fileSizeGB: 1,
                    durationDays: 30,
                    pricePerGBMonthUSD: 5000,
                    selectedProviders: providers,
                    shardCIDs: Array(15).fill("QmShard"),
                    shardSizes: Array(15).fill(1),
                    alertDays: 3
                })
            ).to.be.revertedWith("Duplicate provider");
        });
    });
    
    describe("Deal Lifecycle", function () {
        beforeEach(async function () {
            // We need 15 unique providers for deal creation.
            // Hardhat provides 20 default signers; we use the first 15 distinct ones.
            const signers = await ethers.getSigners();
            this.dealProviders = signers.slice(0, 15);
            
            for (const p of this.dealProviders) {
                await registry.connect(p).registerProvider("peer", "ep", "na", 5000);
                await token.transfer(p.address, ethers.parseEther("200"));
                await token.connect(p).approve(await pledges.getAddress(), ethers.parseEther("200"));
                await pledges.connect(p).createPledge(100, 30 * ONE_DAY, ethers.parseEther("100"));
            }
        });
        
        it("Should create a deal, complete it, and release provider payments", async function () {
            const selectedProviders = this.dealProviders.map(p => p.address);
            
            const tx = await marketplace.connect(client).createDeal({
                fileCID: "QmTestFile",
                fileSizeGB: 10,
                durationDays: 30,
                pricePerGBMonthUSD: 10000, // $0.01
                selectedProviders: selectedProviders,
                shardCIDs: Array(15).fill("QmShard").map((s, i) => `${s}${i}`),
                shardSizes: Array(15).fill(1),
                alertDays: 3
            });
            await tx.wait();
            
            const dealId = 0;
            const deal = await marketplace.getDeal(dealId);
            expect(deal.client).to.equal(client.address);
            expect(deal.fileSizeGB).to.equal(10);
            
            // Fast forward 31 days
            await ethers.provider.send("evm_increaseTime", [31 * ONE_DAY]);
            await ethers.provider.send("evm_mine", []);
            
            // Record deal completions for active shards
            for (const p of this.dealProviders) {
                await marketplace.connect(owner).completeDeal(dealId);
                break; // completeDeal can only be called once per deal
            }
            
            // Verify deal completed
            const dealAfter = await marketplace.getDeal(dealId);
            expect(dealAfter.status).to.equal(1); // Completed enum value
            expect(dealAfter.activeShards).to.equal(0);
            
            // Verify provider payment was transferred to distributor
            const distributorBalance = await token.balanceOf(await paymentDistributor.getAddress());
            expect(distributorBalance).to.be.gt(0);
        });
        
        it("Should allow client to cancel and receive pro-rata refund", async function () {
            const selectedProviders = this.dealProviders.map(p => p.address);
            
            await marketplace.connect(client).createDeal({
                fileCID: "QmTestFile",
                fileSizeGB: 10,
                durationDays: 30,
                pricePerGBMonthUSD: 10000,
                selectedProviders: selectedProviders,
                shardCIDs: Array(15).fill("QmShard").map((s, i) => `${s}${i}`),
                shardSizes: Array(15).fill(1),
                alertDays: 3
            });
            
            const dealId = 0;
            const balanceBefore = await token.balanceOf(client.address);
            
            // Fast forward 15 days (halfway)
            await ethers.provider.send("evm_increaseTime", [15 * ONE_DAY]);
            await ethers.provider.send("evm_mine", []);
            
            await marketplace.connect(client).cancelDeal(dealId);
            
            const deal = await marketplace.getDeal(dealId);
            expect(deal.status).to.equal(3); // Cancelled
            
            const balanceAfter = await token.balanceOf(client.address);
            expect(balanceAfter).to.be.gt(balanceBefore); // Refund received
        });
    });
    
    describe("Pledge Penalties", function () {
        it("Should enforce minimum 1% penalty on early exit", async function () {
            await registry.connect(provider1).registerProvider("peer", "ep", "na", 5000);
            await token.connect(provider1).approve(await pledges.getAddress(), ethers.parseEther("100"));
            await pledges.connect(provider1).createPledge(100, 30 * ONE_DAY, ethers.parseEther("100"));
            
            const balanceBefore = await token.balanceOf(provider1.address);
            
            // Exit 1 day before expiration
            await ethers.provider.send("evm_increaseTime", [29 * ONE_DAY]);
            await ethers.provider.send("evm_mine", []);
            
            await pledges.connect(provider1).exitPledgeEarly(0);
            
            const balanceAfter = await token.balanceOf(provider1.address);
            const returned = balanceAfter - balanceBefore;
            
            // Should receive less than 100% due to penalty floor
            expect(returned).to.be.lt(ethers.parseEther("100"));
            // Minimum penalty is 1% = 1 ETH
            expect(ethers.parseEther("100") - returned).to.be.gte(ethers.parseEther("1"));
        });
    });
    
    describe("PoSt Challenge System", function () {
        it("Should create and submit a PoSt challenge", async function () {
            const dealId = 0;
            const leafIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            const providerSeed = ethers.id("my-secret-seed");
            const seedCommitment = ethers.keccak256(ethers.solidityPacked(["bytes32"], [providerSeed]));

            // Lower difficulty for test so PoW mining finishes quickly
            await proofVerifier.connect(owner).setPoRepDifficulty(8);

            await proofVerifier.connect(owner).createPoStChallenge(dealId, provider1.address, leafIndices, seedCommitment);

            const challenge = await proofVerifier.getPoStChallenge(0);
            expect(challenge.provider).to.equal(provider1.address);
            expect(challenge.submitted).to.equal(false);

            // Build a real Merkle tree for the PoSt proof
            const rawLeaves = [];
            for (let i = 0; i < 16; i++) {
                rawLeaves.push(ethers.encodeBytes32String(`leaf_${i}`));
            }

            // Compute challenge entropy (same as contract)
            const challengeEntropy = ethers.keccak256(
                ethers.solidityPacked(
                    ["bytes32", "uint256", "uint256", "address"],
                    [providerSeed, 0, dealId, provider1.address]
                )
            );

            // Leaf hashing matches contract: keccak256(abi.encodePacked(leafData[i], challengeEntropy, i))
            const treeLeaves = rawLeaves.map((r, idx) =>
                ethers.keccak256(
                    ethers.solidityPacked(["bytes32", "bytes32", "uint256"], [r, challengeEntropy, idx])
                )
            );

            function hashPair(a, b) {
                return a < b
                    ? ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [a, b]))
                    : ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [b, a]));
            }

            function getProof(leaves, index) {
                let proof = [];
                let currentIndex = index;
                let currentLevel = [...leaves];
                while (currentLevel.length > 1) {
                    const nextLevel = [];
                    for (let i = 0; i < currentLevel.length; i += 2) {
                        const left = currentLevel[i];
                        const right = currentLevel[i + 1] || left;
                        if (i === currentIndex) proof.push(right);
                        else if (i + 1 === currentIndex) proof.push(left);
                        nextLevel.push(hashPair(left, right));
                    }
                    currentIndex = Math.floor(currentIndex / 2);
                    currentLevel = nextLevel;
                }
                return proof;
            }

            let currentLevel = [...treeLeaves];
            while (currentLevel.length > 1) {
                const nextLevel = [];
                for (let i = 0; i < currentLevel.length; i += 2) {
                    const left = currentLevel[i];
                    const right = currentLevel[i + 1] || left;
                    nextLevel.push(hashPair(left, right));
                }
                currentLevel = nextLevel;
            }
            const merkleRoot = currentLevel[0];

            const leafData = leafIndices.map(i => rawLeaves[i]);
            const proofs = leafIndices.map(i => getProof(treeLeaves, i));

            // PoRep must exist first — mine a valid proof-of-work nonce
            const chainId = (await ethers.provider.getNetwork()).chainId;
            const blockHash = (await ethers.provider.getBlock("latest")).hash;
            const expectedCommitment = ethers.solidityPackedKeccak256(
                ["bytes32", "address", "uint256"],
                [merkleRoot, provider1.address, chainId]
            );

            // Mine nonce: keccak256(nonce, sealedCID, unsealedCID, blockhash) must have 8 leading zero bits
            let nonce = 0n;
            const unsealedCID = ethers.id("unsealed");
            let powHash;
            while (true) {
                powHash = ethers.keccak256(
                    ethers.solidityPacked(
                        ["uint256", "bytes32", "bytes32", "bytes32"],
                        [nonce, merkleRoot, unsealedCID, blockHash]
                    )
                );
                // Check leading zero bits (8 bits = first byte must be 0x00)
                let valid = true;
                for (let b = 0; b < 8; b++) {
                    const byteIdx = Math.floor(b / 8);
                    const bitIdx = 7 - (b % 8);
                    const byteVal = parseInt(powHash.slice(2 + byteIdx * 2, 4 + byteIdx * 2), 16);
                    if ((byteVal >> bitIdx) & 1) {
                        valid = false;
                        break;
                    }
                }
                if (valid) break;
                nonce++;
            }

            const proofData = ethers.solidityPacked(
                ["bytes32", "uint256", "bytes32"],
                [expectedCommitment, nonce, powHash]
            );

            await proofVerifier.connect(provider1).submitPoRep(
                dealId,
                merkleRoot,
                unsealedCID,
                proofData
            );

            await proofVerifier.connect(provider1).submitPoSt(0, leafData, proofs, providerSeed);

            const challengeAfter = await proofVerifier.getPoStChallenge(0);
            expect(challengeAfter.submitted).to.equal(true);
            expect(challengeAfter.verified).to.equal(true);
        });

        it("Should prevent double-checking missed PoSt", async function () {
            const leafIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            const seedCommitment = ethers.keccak256(ethers.solidityPacked(["bytes32"], [ethers.id("seed")]));
            await proofVerifier.connect(owner).createPoStChallenge(0, provider1.address, leafIndices, seedCommitment);

            // Fast forward past deadline
            await ethers.provider.send("evm_increaseTime", [26 * 60 * 60]); // 26 hours
            await ethers.provider.send("evm_mine", []);

            await proofVerifier.connect(owner).checkMissedPoSt(0);

            // Second check should revert
            await expect(
                proofVerifier.connect(owner).checkMissedPoSt(0)
            ).to.be.revertedWith("Already checked");
        });
    });
    
    describe("Slashing & Appeals", function () {
        it("Should slash for missed PoSt and allow appeal", async function () {
            // Setup: authorize slashing manager to burn
            await token.connect(owner).approve(await slashingManager.getAddress(), ethers.parseEther("1000"));
            
            // Register and fund provider
            await registry.connect(provider1).registerProvider("peer", "ep", "na", 5000);
            await token.transfer(provider1.address, ethers.parseEther("100"));
            
            const collateral = ethers.parseEther("50");
            await slashingManager.connect(owner).slashMissedPost(provider1.address, collateral);
            
            const history = await slashingManager.getSlashingHistory(provider1.address);
            expect(history.length).to.equal(1);
            expect(history[0].reason).to.equal("Missed PoSt proof");
            
            // Submit appeal
            await slashingManager.connect(provider1).submitAppeal(0, "I was online, RPC was down");
            
            const record = history[0]; // Note: array is copied, so appealed is false here
            const appealed = await slashingManager.slashingHistory(provider1.address, 0);
            expect(appealed.appealed).to.equal(true);
        });
    });
});
