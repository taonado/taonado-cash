import { getDeployedContract, contractExists } from "./store";

enum Contracts {
  EVM_VALIDATOR = "EvmValidator",
  WTAO = "WTAO",
  DEPOSIT_TRACKER = "DepositTracker",
  WEIGHTS = "WeightsV2",
  ERC20TAONAO = "ERC20Taonado",
  HASHER = "Hasher",
  VERIFIER = "Verifier",
}

async function getWTAOContract() {
  // Get deployed address
  if (!(await contractExists(Contracts.WTAO))) {
    console.log("WTAO contract not found, please check env");
    return;
  }
  let instance = await getDeployedContract(Contracts.WTAO);
  return instance;
}

export { Contracts, getWTAOContract };
