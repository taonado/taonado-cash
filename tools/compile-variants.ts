import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

interface CompileVariant {
  name: string;
  precompileAddr: string;
  targetChains: number[];
  description: string;
}

const COMPILE_VARIANTS: CompileVariant[] = [
  {
    name: "substrate",
    precompileAddr: "0x9",
    targetChains: [945, 964],
    description: "TAO Substrate-compatible EVM chains (testnet, mainnet)",
  },
  {
    name: "ethereum",
    precompileAddr: "0x6",
    targetChains: [1, 5, 11155111, 1337], // mainnet, goerli, sepolia, hardhat
    description: "Standard Ethereum chains",
  },
];

export function getVerifierVariant(
  hre: HardhatRuntimeEnvironment
): CompileVariant {
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;
  const envVariant = process.env.VERIFIER_TYPE;

  // Priority: Environment variable > Chain ID detection > Network name
  if (envVariant) {
    const variant = COMPILE_VARIANTS.find((v) => v.name === envVariant);
    if (variant) {
      console.log(`Using ${variant.name} verifier variant (env override)`);
      return variant;
    }
  }

  // Auto-detect based on chain ID
  if (chainId) {
    for (const variant of COMPILE_VARIANTS) {
      if (variant.targetChains.includes(chainId)) {
        console.log(
          `Auto-detected ${variant.name} verifier variant for chain ${chainId}`
        );
        return variant;
      }
    }
  }

  // Auto-detect based on network name
  if (network.includes("substrate") || network.includes("tao")) {
    console.log(
      `Auto-detected substrate verifier variant for network ${network}`
    );
    return COMPILE_VARIANTS[0]; // substrate
  }

  // Default to ethereum
  console.log(`Using default ethereum verifier variant for network ${network}`);
  return COMPILE_VARIANTS[1]; // ethereum
}

export function getVerifierContractName(variant: CompileVariant): string {
  return variant.name === "substrate"
    ? "VerifierSubstrate"
    : "VerifierEthereum";
}

export { COMPILE_VARIANTS };
