const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying Incentive Layer Contracts to Polygon Mumbai...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

    // 1. Deploy StorageToken
    console.log("1️⃣  Deploying StorageToken...");
    const StorageToken = await hre.ethers.getContractFactory("StorageToken");
    const token = await StorageToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ StorageToken deployed to:", tokenAddress);
    console.log("   Initial supply:", hre.ethers.formatEther(await token.totalSupply()), "STK\n");

    // 2. Deploy ProviderRegistry
    console.log("2️⃣  Deploying ProviderRegistry...");
    const ProviderRegistry = await hre.ethers.getContractFactory("ProviderRegistry");
    const registry = await ProviderRegistry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ ProviderRegistry deployed to:", registryAddress, "\n");

    // 3. Deploy CapacityPledge
    console.log("3️⃣  Deploying CapacityPledge...");
    const CapacityPledge = await hre.ethers.getContractFactory("CapacityPledge");
    const pledges = await CapacityPledge.deploy(tokenAddress);
    await pledges.waitForDeployment();
    const pledgesAddress = await pledges.getAddress();
    console.log("✅ CapacityPledge deployed to:", pledgesAddress, "\n");

    // 4. Deploy ProofVerifier
    console.log("4️⃣  Deploying ProofVerifier...");
    const ProofVerifier = await hre.ethers.getContractFactory("ProofVerifier");
    const prover = await ProofVerifier.deploy();
    await prover.waitForDeployment();
    const proverAddress = await prover.getAddress();
    console.log("✅ ProofVerifier deployed to:", proverAddress, "\n");

    // 5. Deploy SlashingManager
    console.log("5️⃣  Deploying SlashingManager...");
    const SlashingManager = await hre.ethers.getContractFactory("SlashingManager");
    const slashing = await SlashingManager.deploy(tokenAddress, registryAddress);
    await slashing.waitForDeployment();
    const slashingAddress = await slashing.getAddress();
    console.log("✅ SlashingManager deployed to:", slashingAddress, "\n");

    // 6. Deploy StorageMarketplace
    console.log("6️⃣  Deploying StorageMarketplace...");
    const StorageMarketplace = await hre.ethers.getContractFactory("StorageMarketplace");
    const marketplace = await StorageMarketplace.deploy(tokenAddress, registryAddress, pledgesAddress);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("✅ StorageMarketplace deployed to:", marketplaceAddress, "\n");

    // 7. Deploy PaymentDistributor
    console.log("7️⃣  Deploying PaymentDistributor...");
    const PaymentDistributor = await hre.ethers.getContractFactory("PaymentDistributor");
    const payments = await PaymentDistributor.deploy(
        tokenAddress,
        marketplaceAddress,
        pledgesAddress,
        registryAddress
    );
    await payments.waitForDeployment();
    const paymentsAddress = await payments.getAddress();
    console.log("✅ PaymentDistributor deployed to:", paymentsAddress, "\n");

    // 8. Configure contracts - Authorize minters
    console.log("8️⃣  Configuring contract permissions...");

    // Authorize PaymentDistributor to mint tokens
    console.log("   Authorizing PaymentDistributor as minter...");
    await token.authorizeMinter(paymentsAddress);

    // Authorize SlashingManager to burn tokens
    console.log("   Authorizing SlashingManager as minter (for burning)...");
    await token.authorizeMinter(slashingAddress);

    // Set CapacityPledge as owner of ProviderRegistry for updates
    console.log("   Transferring ProviderRegistry ownership to deployer...");
    // Keep deployer as owner for now, backend services will use it

    console.log("✅ Permissions configured\n");

    // Print summary
    console.log("═══════════════════════════════════════════════════════");
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("═══════════════════════════════════════════════════════");
    console.log("Network:", hre.network.name);
    console.log("Deployer:", deployer.address);
    console.log("\n📜 Contract Addresses:");
    console.log("─────────────────────────────────────────────────────");
    console.log("StorageToken:        ", tokenAddress);
    console.log("ProviderRegistry:    ", registryAddress);
    console.log("CapacityPledge:      ", pledgesAddress);
    console.log("ProofVerifier:       ", proverAddress);
    console.log("SlashingManager:     ", slashingAddress);
    console.log("StorageMarketplace:  ", marketplaceAddress);
    console.log("PaymentDistributor:  ", paymentsAddress);
    console.log("═══════════════════════════════════════════════════════\n");

    // Save addresses to file
    const fs = require('fs');
    const addresses = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
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
        deployedAt: new Date().toISOString()
    };

    const addressesPath = `./deployed-addresses-${hre.network.name}.json`;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log("💾 Addresses saved to:", addressesPath);

    // Instructions for verification
    console.log("\n📝 To verify contracts on PolygonScan, run:");
    console.log("─────────────────────────────────────────────────────");
    console.log(`npx hardhat verify --network ${hre.network.name} ${tokenAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${registryAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${pledgesAddress} "${tokenAddress}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${proverAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${slashingAddress} "${tokenAddress}" "${registryAddress}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${marketplaceAddress} "${tokenAddress}" "${registryAddress}" "${pledgesAddress}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${paymentsAddress} "${tokenAddress}" "${marketplaceAddress}" "${pledgesAddress}" "${registryAddress}"`);
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("✅ Deployment complete!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
