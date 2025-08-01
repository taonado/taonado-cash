import { ethers } from "hardhat";
import { getWTAOContract } from "./contracts";
import { config } from "../config";
import { WTAO__factory } from "../typechain-types";

async function main() {
  let instance = await getWTAOContract();
  if (!instance) {
    console.log("WTAO contract not found, please check env");
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

  // Withdraw 1 WTAO from the contract
  const amountToWithdraw = ethers.parseEther("1.0");
  console.log(`Withdrawing ${ethers.formatEther(amountToWithdraw)} TAO...`);

  // Make the withdrawal
  const tx = await contract.withdraw(amountToWithdraw);
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
