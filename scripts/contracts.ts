import { getDeployedContract, contractExists } from "./store";

enum Contracts {
  WTAO = "WTAO",
  DEPOSIT_TRACKER = "DepositTracker",
  WEIGHTS = "WeightsV2",
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
