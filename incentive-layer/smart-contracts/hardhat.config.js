require("@nomicfoundation/hardhat-toolbox");

// Load environment variables (create .env file)
// PRIVATE_KEY=your_private_key
// POLYGONSCAN_API_KEY=your_api_key
// POLYGON_RPC=https://polygon-rpc.com
// MUMBAI_RPC=https://rpc-mumbai.maticvigil.com

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const POLYGON_RPC = process.env.POLYGON_RPC || "https://polygon-rpc.com";
const MUMBAI_RPC = process.env.MUMBAI_RPC || "https://rpc-mumbai.maticvigil.com";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200 // Optimize for deployment cost vs execution cost
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    mumbai: {
      url: MUMBAI_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      gasPrice: 20000000000, // 20 gwei
      gas: 6000000
    },
    polygon: {
      url: POLYGON_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 137,
      gasPrice: 50000000000, // 50 gwei
      gas: 6000000
    }
  },
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    token: "MATIC"
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
