const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const rpcUrl = process.env.AMOY_RPC || "https://rpc-amoy.polygon.technology";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get wallet address from MetaMask or user input
    const walletAddress = process.env.WALLET_ADDRESS || process.argv[2];

    if (!walletAddress) {
        console.error("❌ Usage: node scripts/check-wallet.js <YOUR_WALLET_ADDRESS>");
        process.exit(1);
    }

    console.log("🔍 Checking wallet:", walletAddress);
    console.log("=".repeat(60));

    // 1. Check POL Balance
    const polBalance = await provider.getBalance(walletAddress);
    console.log("💰 POL Balance:", ethers.formatEther(polBalance), "POL");

    if (polBalance < ethers.parseEther("0.1")) {
        console.log("⚠️  WARNING: Low POL balance! You need POL for gas fees.");
        console.log("   Get testnet POL from: https://faucet.polygon.technology");
    }

    // 2. Check KYN Balance
    const KYN_TOKEN_ADDRESS = "0xC33eA878fC9819Fa2d60fD60EF6A89EbA871930A";
    const tokenAbi = [
        "function balanceOf(address account) public view returns (uint256)",
        "function allowance(address owner, address spender) public view returns (uint256)"
    ];
    const token = new ethers.Contract(KYN_TOKEN_ADDRESS, tokenAbi, provider);

    const kynBalance = await token.balanceOf(walletAddress);
    console.log("📊 KYN Balance:", ethers.formatUnits(kynBalance, 18), "KYN");

    if (kynBalance === 0n) {
        console.log("⚠️  WARNING: No KYN tokens! You need KYN to stake or create deals.");
    }

    // 3. Check Allowances
    const CAPACITY_PLEDGE_ADDRESS = "0x16Af84FA7117152a48F49d2eACab961cbae0818b";
    const MARKETPLACE_ADDRESS = "0xc19c805eAfeAe35839D4b27113ec2ca91E8dCa61";

    const pledgeAllowance = await token.allowance(walletAddress, CAPACITY_PLEDGE_ADDRESS);
    const marketAllowance = await token.allowance(walletAddress, MARKETPLACE_ADDRESS);

    console.log("\n🔐 Token Allowances:");
    console.log("   CapacityPledge:", ethers.formatUnits(pledgeAllowance, 18), "KYN");
    console.log("   Marketplace:", ethers.formatUnits(marketAllowance, 18), "KYN");

    if (pledgeAllowance === 0n) {
        console.log("⚠️  NOTE: No approval for CapacityPledge (needed for staking)");
    }
    if (marketAllowance === 0n) {
        console.log("⚠️  NOTE: No approval for Marketplace (needed for deals)");
    }

    console.log("\n✅ Diagnosis complete!");
}

main().catch(console.error);
