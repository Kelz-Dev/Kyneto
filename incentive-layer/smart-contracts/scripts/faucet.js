const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const targetAddress = process.env.TARGET_ADDRESS;
    const amount = process.env.AMOUNT || "10000";
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.AMOY_RPC || "https://rpc-amoy.polygon.technology";

    if (!targetAddress) {
        console.error("❌ Error: TARGET_ADDRESS environment variable is required.");
        console.log("Usage: $env:TARGET_ADDRESS=\"0x...\"; node scripts/faucet.js");
        process.exit(1);
    }

    if (!privateKey) {
        console.error("❌ Error: PRIVATE_KEY environment variable is required (check your .env file).");
        process.exit(1);
    }

    console.log(`🚀 Sending ${amount} KYN to ${targetAddress} on Amoy...`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // KYN Token Address from app.js
    const KYN_TOKEN_ADDRESS = "0x943a1F4583dB1aC8B03FD58f753133d29B510B17";

    const abi = [
        "function transfer(address to, uint256 amount) public returns (bool)",
        "function balanceOf(address account) public view returns (uint256)",
        "function symbol() public view returns (string)"
    ];

    const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, abi, wallet);

    try {
        const symbol = await tokenContract.symbol();
        const balance = await tokenContract.balanceOf(wallet.address);
        console.log(`📊 Deployer Balance: ${ethers.formatUnits(balance, 18)} ${symbol}`);

        const amountWei = ethers.parseUnits(amount, 18);
        if (balance < amountWei) {
            console.error("❌ Error: Insufficient balance in deployer account.");
            process.exit(1);
        }

        const tx = await tokenContract.transfer(targetAddress, amountWei);
        console.log("⏳ Transaction submitted. Hash:", tx.hash);
        await tx.wait();
        console.log(`✅ Successfully sent ${amount} KYN to ${targetAddress}`);
    } catch (error) {
        console.error("❌ Transfer failed:", error.message);
    }
}

main().catch(console.error);
