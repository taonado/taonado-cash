import { getDeployedContract, contractExists } from "./store";

enum Contracts {
  EVM_VALIDATOR = "EvmValidator",
  WTAO = "WTAO",
  DEPOSIT_TRACKER = "DepositTracker",
  WEIGHTS = "WeightsV3",
  ERC20TAONADO = "ERC20Taonado",
  HASHER = "Hasher",
  VERIFIER = "Verifier",
}

async function getWTAOContract() {
  // Get deployed address
  if (!(await contractExists(Contracts.WTAO))) {
    console.warn("WTAO contract not found, please check env");
    return;
  }
  let instance = await getDeployedContract(Contracts.WTAO);
  return instance;
}

export { Contracts, getWTAOContract };
