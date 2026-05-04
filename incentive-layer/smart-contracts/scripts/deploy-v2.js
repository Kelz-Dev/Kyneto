const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying Kyneto Protocol V2 (Renewals & Matchmaking)...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "POL\n");

    // 1. Deploy StorageToken
    console.log("1️⃣  Deploying StorageToken...");
    const StorageToken = await hre.ethers.getContractFactory("StorageToken");
    const token = await StorageToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ StorageToken deployed to:", tokenAddress);

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
    // Using deployer address as treasury for initial setup
    const marketplace = await StorageMarketplace.deploy(tokenAddress, registryAddress, pledgesAddress, deployer.address);
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

    // 8. Wire PaymentDistributor to Marketplace
    console.log("8️⃣  Wiring PaymentDistributor to StorageMarketplace...");
    await marketplace.setPaymentDistributor(paymentsAddress);
    console.log("   ✅ PaymentDistributor wired");

    // 9. Configure contract permissions
    console.log("9️⃣  Configuring contract permissions...");

    // Authorize PaymentDistributor to mint tokens
    console.log("   Authorizing PaymentDistributor as minter...");
    await token.authorizeMinter(paymentsAddress);

    // Authorize SlashingManager to burn tokens
    console.log("   Authorizing SlashingManager as burner...");
    await token.authorizeBurner(slashingAddress);

    // Authorize SlashingManager and Marketplace as record keepers on ProviderRegistry
    console.log("   Authorizing SlashingManager as record keeper...");
    await registry.authorizeRecordKeeper(slashingAddress);
    console.log("   Authorizing Marketplace as record keeper...");
    await registry.authorizeRecordKeeper(marketplaceAddress);

    console.log("✅ Permissions configured\n");

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
        deployedAt: new Date().toISOString(),
        version: "2.0.0-renewals"
    };

    const addressesPath = `./deployed-addresses-v2-${hre.network.name}.json`;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log("💾 Addresses saved to:", addressesPath);

    console.log("\n🚀 V2 Deployment complete!");
    console.log("--------------------------------------------------");
    console.log("IMPORTANT: Update the addresses in incentive-layer/dashboard/app.js");
    console.log("--------------------------------------------------\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
