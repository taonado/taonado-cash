import { ethers } from "hardhat";
import { getWTAOContract } from "./contracts";
import { WTAO__factory } from "../typechain-types";
import { Wallet } from "ethers";

async function deposit(wallet: Wallet, amountToDeposit: bigint) {
  let instance = await getWTAOContract();
  if (!instance) {
    console.log("WTAO contract not found, please check env");
    return;
  }

  const address = instance.target;
  console.log(`WTAO address: ${address}`);

  // Create contract instance with proper typing
  const contract = WTAO__factory.connect(address.toString(), wallet);

  // Get token name
  const name = await contract.name();
  console.log("Contract name:", name);

  // Get token symbol
  const symbol = await contract.symbol();
  console.log("Token symbol:", symbol);

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

  return receipt;
}

export async function depositQuiet(wallet: Wallet, amountToDeposit: bigint) {
  let instance = await getWTAOContract();
  if (!instance) {
    console.warn("WTAO contract not found, please check env");
    return {};
  }
  try {
    const address = instance.target;
    const contract = WTAO__factory.connect(address.toString(), wallet);
    const tx = await contract.deposit({ value: amountToDeposit });
    const receipt = await tx.wait();
    const balance = await contract.balanceOf(wallet.address);
    return { balance, tx, contract, receipt };
  } catch (error) {
    console.error("Error depositing TAO:", error);
    return {};
  }
}

export { deposit };
