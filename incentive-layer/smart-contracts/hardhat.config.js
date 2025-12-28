require("@nomicfoundation/hardhat-toolbox");

// Load environment variables (create .env file)
// PRIVATE_KEY=your_private_key
// POLYGONSCAN_API_KEY=your_api_key
// POLYGON_RPC=https://polygon-rpc.com
// MUMBAI_RPC=https://rpc-mumbai.maticvigil.com

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const POLYGON_RPC = process.env.POLYGON_RPC || "https://polygon-rpc.com";
const AMOY_RPC = process.env.AMOY_RPC || "https://rpc-amoy.polygon.technology";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    amoy: {
      url: AMOY_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
    },
    polygon: {
      url: POLYGON_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 137,
    }
  },
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonAmoy: POLYGONSCAN_API_KEY
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
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
