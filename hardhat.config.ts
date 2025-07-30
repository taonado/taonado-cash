import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import { HardhatUserConfig } from "hardhat/config";
import { config } from "./config";

const hardhatConfig: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "mainnet",
  networks: {
    mainnet: {
      url: "https://lite.chain.opentensor.ai",
      accounts: [config.ethPrivateKey],
    },
    subevm: {
      url: "https://test.chain.opentensor.ai",
      accounts: [config.ethPrivateKey],
    },
    local: {
      url: "http://127.0.0.1:9944",
      accounts: [config.ethPrivateKey],
    },
    "substrate-local": {
      url: "http://127.0.0.1:9944",
      chainId: 964,
      accounts: [config.ethPrivateKey],
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
