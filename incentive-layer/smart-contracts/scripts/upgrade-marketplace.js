/**
 * Deploy ONLY the updated StorageMarketplace contract
 * Reuses existing token, registry, and pledges contract addresses
 */
const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 Upgrading StorageMarketplace (cancelDeal support)...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "POL\n");

    // Load existing addresses — keep everything except marketplace
    const existingAddresses = JSON.parse(
        fs.readFileSync("./deployed-addresses-v2-amoy.json", "utf8")
    );
    const tokenAddress = existingAddresses.contracts.token;
    const registryAddress = existingAddresses.contracts.registry;
    const pledgesAddress = existingAddresses.contracts.pledges;

    console.log("📦 Reusing existing contracts:");
    console.log("   Token:    ", tokenAddress);
    console.log("   Registry: ", registryAddress);
    console.log("   Pledges:  ", pledgesAddress);
    console.log("");

    // Deploy new StorageMarketplace
    console.log("6️⃣  Deploying new StorageMarketplace...");
    const StorageMarketplace = await hre.ethers.getContractFactory("StorageMarketplace");
    const marketplace = await StorageMarketplace.deploy(
        tokenAddress,
        registryAddress,
        pledgesAddress,
        deployer.address // treasury
    );
    await marketplace.waitForDeployment();
    const newMarketplaceAddress = await marketplace.getAddress();

    console.log("✅ NEW StorageMarketplace deployed to:", newMarketplaceAddress);
    console.log("   (old address was:", existingAddresses.contracts.marketplace, ")\n");

    // Update addresses file
    existingAddresses.contracts.marketplace = newMarketplaceAddress;
    existingAddresses.deployedAt = new Date().toISOString();
    existingAddresses.version = "2.1.0-delete-propagation";

    fs.writeFileSync(
        "./deployed-addresses-v2-amoy.json",
        JSON.stringify(existingAddresses, null, 2)
    );
    console.log("💾 Updated deployed-addresses-v2-amoy.json");

    console.log("\n🚀 Marketplace upgrade complete!");
    console.log("--------------------------------------------------");
    console.log("NEW MARKETPLACE ADDRESS:", newMarketplaceAddress);
    console.log("--------------------------------------------------");
    console.log("\nIMPORTANT: Update this address in:");
    console.log("  - incentive-layer/.env");
    console.log("  - incentive-layer/smart-contracts/.env");
    console.log("  - incentive-layer/dashboard/app.js");
    console.log("  - app_download.js");
    console.log("  - .env (root)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
