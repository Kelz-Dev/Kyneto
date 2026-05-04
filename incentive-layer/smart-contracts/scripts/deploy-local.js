const hre = require("hardhat");

async function main() {
    console.log("🚀 Local Development Deploy & Seed\n");

    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];
    const client = signers[1];
    const providers = signers.slice(2, 17); // 15 providers for createDeal
    console.log("Deployer:", deployer.address);
    console.log("Client:   ", client.address);
    console.log("Providers:", providers.length, "accounts\n");

    // 1. Deploy contracts
    const StorageToken = await hre.ethers.getContractFactory("StorageToken");
    const token = await StorageToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ StorageToken:", tokenAddress);

    const ProviderRegistry = await hre.ethers.getContractFactory("ProviderRegistry");
    const registry = await ProviderRegistry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ ProviderRegistry:", registryAddress);

    const CapacityPledge = await hre.ethers.getContractFactory("CapacityPledge");
    const pledges = await CapacityPledge.deploy(tokenAddress);
    await pledges.waitForDeployment();
    const pledgesAddress = await pledges.getAddress();
    console.log("✅ CapacityPledge:", pledgesAddress);

    const ProofVerifier = await hre.ethers.getContractFactory("ProofVerifier");
    const prover = await ProofVerifier.deploy();
    await prover.waitForDeployment();
    const proverAddress = await prover.getAddress();
    console.log("✅ ProofVerifier:", proverAddress);

    const SlashingManager = await hre.ethers.getContractFactory("SlashingManager");
    const slashing = await SlashingManager.deploy(tokenAddress, registryAddress);
    await slashing.waitForDeployment();
    const slashingAddress = await slashing.getAddress();
    console.log("✅ SlashingManager:", slashingAddress);

    const StorageMarketplace = await hre.ethers.getContractFactory("StorageMarketplace");
    const marketplace = await StorageMarketplace.deploy(
        tokenAddress,
        registryAddress,
        pledgesAddress,
        deployer.address
    );
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("✅ StorageMarketplace:", marketplaceAddress);

    const PaymentDistributor = await hre.ethers.getContractFactory("PaymentDistributor");
    const payments = await PaymentDistributor.deploy(
        tokenAddress,
        marketplaceAddress,
        pledgesAddress,
        registryAddress
    );
    await payments.waitForDeployment();
    const paymentsAddress = await payments.getAddress();
    console.log("✅ PaymentDistributor:", paymentsAddress);

    // 2. Wire permissions
    await marketplace.setPaymentDistributor(paymentsAddress);
    await token.authorizeMinter(paymentsAddress);
    await token.authorizeBurner(slashingAddress);
    await registry.authorizeRecordKeeper(slashingAddress);
    await registry.authorizeRecordKeeper(marketplaceAddress);
    console.log("✅ Permissions wired\n");

    // 3. Seed test data
    const mintAmount = hre.ethers.parseEther("100000");
    await token.connect(deployer).transfer(client.address, mintAmount);
    for (const p of providers) {
        await token.connect(deployer).transfer(p.address, mintAmount);
    }
    console.log("✅ Seeded 100,000 KYN to client + 15 providers");

    // Register providers
    const duration30 = 30 * 24 * 60 * 60; // 30 days in seconds
    for (let i = 0; i < providers.length; i++) {
        const p = providers[i];
        await registry.connect(p).registerProvider(
            `12D3KooWTestProvider${i}PeerId`,
            `https://provider${i}.local`,
            i % 2 === 0 ? "US-East" : "EU-West",
            1
        );
        await token.connect(p).approve(pledgesAddress, hre.ethers.parseEther("5000"));
        await pledges.connect(p).createPledge(500 + i * 10, duration30, hre.ethers.parseEther("5000"));
    }
    console.log("✅ Registered 15 providers + pledges");

    // Create a deal
    const providerAddrs = providers.map(p => p.address);
    const shardCIDs = Array.from({ length: 15 }, (_, i) => `QmShardCID${i}`);
    const shardSizes = Array.from({ length: 15 }, () => 68); // ~68MB shards
    const dealParams = {
        fileCID: "QmTestFileCID",
        fileSizeGB: 1,
        durationDays: 30,
        pricePerGBMonthUSD: 5000,
        selectedProviders: providerAddrs,
        shardCIDs: shardCIDs,
        shardSizes: shardSizes,
        alertDays: 7
    };

    const dealCost = hre.ethers.parseEther("100");
    await token.connect(client).approve(marketplaceAddress, dealCost);
    const tx = await marketplace.connect(client).createDeal(dealParams);
    await tx.wait();
    console.log("✅ Created test deal\n");

    // Save local addresses
    const fs = require("fs");
    const addresses = {
        network: "hardhat",
        chainId: 31337,
        deployer: deployer.address,
        contracts: {
            token: tokenAddress,
            registry: registryAddress,
            pledges: pledgesAddress,
            prover: proverAddress,
            slashing: slashingAddress,
            marketplace: marketplaceAddress,
            payments: paymentsAddress
        },
        testAccounts: {
            client: client.address,
            providers: providerAddrs
        }
    };
    fs.writeFileSync("./deployed-addresses-local.json", JSON.stringify(addresses, null, 2));
    console.log("💾 Addresses saved to deployed-addresses-local.json\n");
    console.log("🚀 Local dev environment ready!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
