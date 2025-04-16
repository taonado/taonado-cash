import { ethers } from "hardhat";
import { storeContract, contractExists, getDeployedContract } from "./store";
import { WTAO__factory, DepositTracker__factory } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

enum Contracts {
  WTAO = "WTAO",
  DEPOSIT_TRACKER = "DepositTracker",
}

let deployer: HardhatEthersSigner | undefined;

async function main() {
  try {
    console.log("Starting deployment...");

    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log(
      `Deploying to network: ${network.name} (chain ID: ${network.chainId})`
    );

    // Check account balance
    [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} TAO`);

    const wtao = await deployWTAO();
    const depositTracker = await deployDepositTracker();

    console.log("------ ENV VARS ------");
    console.log(`PUBLIC_WTAO_ADDRESS=${wtao.target}`);
    console.log("----------------------");
  } catch (error) {
    console.error("Detailed error information:");
    console.error(error);
  }
}

async function deployWTAO() {
  if (await contractExists(Contracts.WTAO)) {
    console.log("WTAO contract already exists");
    const wtao = await getDeployedContract<typeof token>(Contracts.WTAO);

    const contract = WTAO__factory.connect(wtao.target.toString(), deployer);
    return contract;
  }

  console.log("Deploying WTAO contract...");
  const factory = await ethers.getContractFactory(Contracts.WTAO);
  const token = await factory.deploy();

  await token.waitForDeployment();
  console.log(`WTAO deployed to ${token.target}`);

  await storeContract<typeof token>(Contracts.WTAO, token);
  return token;
}

async function deployDepositTracker() {
  if (await contractExists(Contracts.DEPOSIT_TRACKER)) {
    console.log("DepositTracker already exists");
    const depositTracker = await getDeployedContract<typeof tracker>(
      Contracts.DEPOSIT_TRACKER
    );
    const contract = DepositTracker__factory.connect(
      depositTracker.target.toString(),
      deployer
    );
    return contract;
  }

  console.log("Deploying DepositTracker contract...");
  const factory = await ethers.getContractFactory(Contracts.DEPOSIT_TRACKER);
  const tracker = await factory.deploy();

  await tracker.waitForDeployment();
  console.log(`DepositTracker deployed to ${tracker.target}`);

  await storeContract<typeof tracker>(Contracts.DEPOSIT_TRACKER, tracker);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
