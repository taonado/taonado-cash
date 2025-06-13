import { deposit } from "./deposit";
import { config } from "../config";
import { ethers } from "hardhat";

async function main() {
  // Get the wallet with provider
  const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);

  // Deposit 1 TAO to the contract
  const amountToDeposit = ethers.parseEther("1.0");
  await deposit(wallet, amountToDeposit);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
