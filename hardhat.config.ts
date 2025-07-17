import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";

let ethPrivateKey = process.env.ETH_PRIVATE_KEY || "";

if (process.env.CI) {
  // Only import config-example.ts in CI
  ethPrivateKey = require("./config-example").config.ethPrivateKey || ethPrivateKey;
} else {
  try {
    ethPrivateKey = require("./config").config.ethPrivateKey || ethPrivateKey;
  } catch (e) {
    // fallback to env or empty
  }
}

const hardhatConfig: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "mainnet",
  networks: {
    mainnet: {
      url: "https://lite.chain.opentensor.ai",
      accounts: [ethPrivateKey],
    },
    subevm: {
      url: "https://test.chain.opentensor.ai",
      accounts: [ethPrivateKey],
    },
    local: {
      url: "http://127.0.0.1:9944",
      accounts: [ethPrivateKey],
    },
    // for contract verification
    taostats: {
      url: "https://evm.taostats.io/api/eth-rpc",
    },
  },
  etherscan: {
    apiKey: {
      taostats: "empty",
    },
    customChains: [
      {
        network: "taostats",
        chainId: 964,
        urls: {
          apiURL: "https://evm.taostats.io/api",
          browserURL: "https://evm.taostats.io",
        },
      },
    ],
  },
  mocha: {
    timeout: 300000,
  },
};

export default hardhatConfig;
