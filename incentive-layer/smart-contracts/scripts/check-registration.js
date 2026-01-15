const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const rpcUrl = process.env.AMOY_RPC || "https://rpc-amoy.polygon.technology";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const walletAddress = process.env.WALLET_ADDRESS || process.argv[2];

    if (!walletAddress) {
        console.error("❌ Usage: node scripts/check-registration.js <YOUR_WALLET_ADDRESS>");
        process.exit(1);
    }

    console.log("🔍 Checking registration status for:", walletAddress);
    console.log("=".repeat(60));

    const REGISTRY_ADDRESS = "0xad47e6E5cc48526aF2cA26E0BE40c5fE0B4a8027";

    const registryAbi = [
        "function providers(address) public view returns (bool, uint256, uint256, uint256, string, string, string, uint256, uint256, uint256, bool, uint256)",
        "function isProviderActive(address provider) public view returns (bool)"
    ];

    const registry = new ethers.Contract(REGISTRY_ADDRESS, registryAbi, provider);

    try {
        const providerData = await registry.providers(walletAddress);
        const isActive = await registry.isProviderActive(walletAddress);

        console.log("\n📊 Registration Status:");
        console.log("   Registered:", providerData[0]);
        console.log("   Active:", isActive);
        console.log("   Total Capacity:", providerData[1].toString(), "GB");
        console.log("   Available Capacity:", providerData[2].toString(), "GB");
        console.log("   Peer ID:", providerData[4]);
        console.log("   Endpoint:", providerData[5]);
        console.log("   Region:", providerData[6]);

        if (providerData[0]) {
            console.log("\n⚠️  THIS WALLET IS ALREADY REGISTERED!");
            console.log("   You cannot register the same wallet twice.");
            console.log("   Either:");
            console.log("   1. Use a different wallet address");
            console.log("   2. Skip registration and proceed to create deals");
        } else {
            console.log("\n✅ This wallet is NOT registered. You can proceed with registration.");
        }

    } catch (error) {
        console.error("❌ Error checking registration:", error.message);
    }
}

main().catch(console.error);
