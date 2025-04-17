import { ethers } from "hardhat";
import { Contracts } from "./contracts";
import { config } from "../config";
import { WTAO__factory, WTAO } from "../typechain-types";
import { getDeployedContract, contractExists } from "./store";

async function main() {
  // Get deployed address
  if (!(await contractExists(Contracts.WTAO))) {
    console.log("WTAO contract not found, please check env");
    return;
  }
  let instance = await getDeployedContract(Contracts.WTAO);
  if (!instance) {
    console.log("WTAO contract not found");
    return;
  }
  const address = instance.target;
  console.log(`WTAO address: ${address}`);

  // Get the wallet with provider
  const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);

  // Create contract instance with proper typing
  const contract = WTAO__factory.connect(address.toString(), wallet);

  // Get token name
  const name = await contract.name();
  console.log("Contract name:", name);

  // Get token symbol
  const symbol = await contract.symbol();
  console.log("Token symbol:", symbol);

  // Deposit 1 TAO to the contract
  const amountToDeposit = ethers.parseEther("1.0");
  console.log(`Depositing ${ethers.formatEther(amountToDeposit)} TAO...`);

  // Make the deposit
  const tx = await contract.deposit({ value: amountToDeposit });
  console.log(`Transaction hash: ${tx.hash}`);

  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  if (receipt) {
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
  }

  // Get the updated balance
  const balance = await contract.balanceOf(wallet.address);
  console.log(`New WTAO balance: ${ethers.formatEther(balance)} WTAO`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
