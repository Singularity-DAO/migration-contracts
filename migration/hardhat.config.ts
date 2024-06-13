import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import {resolve} from "path";

dotenvConfig({ path: resolve(__dirname, "../.env") });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      evmVersion: "paris", // need this, because solidity 0.8.20 introduced an opcode PUSH0 which is not yet supported by all L2
    },
  },
  networks: {
    mainnet: {
      url: process.env.RPC,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    sepolia: {
      url: process.env.RPC,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    "bsc-testnet": {
      url: process.env.RPC,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    "polygon-amoy": {
      url: process.env.RPC,
      accounts: [process.env.PRIVATE_KEY || ""],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  }
};

export default config;
