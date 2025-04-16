import { ethers } from "hardhat";
import fs from "fs";
import { config } from "../config";
import { WTAO__factory } from "../typechain-types";

async function main() {
  // Get deployed address
  let deployedInfo;
  try {
    deployedInfo = fs.readFileSync("./deployed-contract.json").toString();
  } catch (e) {
    console.log(
      "ERROR: Can't read the deployed contract info. The contract needs to be deployed first."
    );
    return;
  }
  const { address, abi } = JSON.parse(deployedInfo);
  console.log(`WTAO address: ${address}`);

  // Get the wallet with provider
  const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);

  // Create contract instance with proper typing
  const contract = WTAO__factory.connect(address, wallet);

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
