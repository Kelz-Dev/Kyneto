const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.AMOY_RPC || "https://rpc-amoy.polygon.technology";

    if (!privateKey) {
        console.error("❌ Error: PRIVATE_KEY not found.");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("📝 Wallet Address:", wallet.address);

    const ethBalance = await provider.getBalance(wallet.address);
    console.log("💰 POL Balance:", ethers.formatEther(ethBalance));

    const KYN_TOKEN_ADDRESS = "0xC33eA878fC9819Fa2d60fD60EF6A89EbA871930A";
    const abi = ["function balanceOf(address account) public view returns (uint256)"];
    const token = new ethers.Contract(KYN_TOKEN_ADDRESS, abi, provider);

    const kynBalance = await token.balanceOf(wallet.address);
    console.log("📊 KYN Balance:", ethers.formatUnits(kynBalance, 18));
}

main().catch(console.error);
