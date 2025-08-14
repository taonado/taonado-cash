import * as fs from "fs";
import * as path from "path";
import { getVerifierVariant } from "./compile-variants";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const CONFIG_FILE = "contracts/core/VerifierConfig.sol";

export function configureVerifierForNetwork(
  hre: HardhatRuntimeEnvironment
): void {
  const variant = getVerifierVariant(hre);
  const configPath = path.join(process.cwd(), CONFIG_FILE);

  const configContent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Auto-generated configuration for ${variant.description}
// Target chains: ${variant.targetChains.join(", ")}
// Generated at: ${new Date().toISOString()}
library VerifierConfig {
    // Compile-time constant - optimized for ${variant.name} networks
    // Note: This gets inlined by the optimizer, resulting in zero runtime overhead
    uint256 constant BN128_ADD_PRECOMPILE_ADDRESS = ${variant.precompileAddr};
}`;

  fs.writeFileSync(configPath, configContent);
  console.log(
    `✅ Configured verifier for ${variant.name} networks (precompile: ${variant.precompileAddr})`
  );
}

export function restoreDefaultConfig(): void {
  const configPath = path.join(process.cwd(), CONFIG_FILE);

  const defaultContent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Default configuration - gets replaced during build
library VerifierConfig {
    // Default to Ethereum precompile address
    uint256 constant BN128_ADD_PRECOMPILE_ADDRESS = 0x6;
}`;

  fs.writeFileSync(configPath, defaultContent);
  console.log("✅ Restored default verifier configuration");
}
