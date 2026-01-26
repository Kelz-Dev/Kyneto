const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.AMOY_RPC || "https://rpc-amoy.polygon.technology";

    if (!privateKey) {
        console.error("❌ Error: PRIVATE_KEY not found in .env file");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("🔐 Approving KYN token allowances for wallet:", wallet.address);
    console.log("=".repeat(60));

    const KYN_TOKEN_ADDRESS = "0xC33eA878fC9819Fa2d60fD60EF6A89EbA871930A";
    const CAPACITY_PLEDGE_ADDRESS = "0x16Af84FA7117152a48F49d2eACab961cbae0818b";
    const MARKETPLACE_ADDRESS = "0xc19c805eAfeAe35839D4b27113ec2ca91E8dCa61";

    const tokenAbi = [
        "function approve(address spender, uint256 amount) public returns (bool)"
    ];

    const token = new ethers.Contract(KYN_TOKEN_ADDRESS, tokenAbi, wallet);

    // Approve a large amount (effectively unlimited)
    const MAX_APPROVAL = ethers.parseUnits("1000000000", 18); // 1 billion KYN

    try {
        // 1. Approve CapacityPledge
        console.log("\n1️⃣  Approving CapacityPledge contract...");
        const tx1 = await token.approve(CAPACITY_PLEDGE_ADDRESS, MAX_APPROVAL);
        console.log("   Transaction hash:", tx1.hash);
        await tx1.wait();
        console.log("   ✅ CapacityPledge approved!");

        // 2. Approve Marketplace
        console.log("\n2️⃣  Approving StorageMarketplace contract...");
        const tx2 = await token.approve(MARKETPLACE_ADDRESS, MAX_APPROVAL);
        console.log("   Transaction hash:", tx2.hash);
        await tx2.wait();
        console.log("   ✅ Marketplace approved!");

        console.log("\n🎉 All approvals complete! You can now stake and create deals.");

    } catch (error) {
        console.error("\n❌ Approval failed:", error.message);
    }
}

main().catch(console.error);
