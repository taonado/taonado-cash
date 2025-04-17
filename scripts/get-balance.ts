import { ethers } from "hardhat";
import { getWTAOContract } from "./contracts";
import { config } from "../config";
import { WTAO__factory } from "../typechain-types";
import { AddressLike, Wallet } from "ethers";

async function getWTAOBalance(wallet: Wallet) {
  let instance = await getWTAOContract();
  if (!instance) {
    console.log("WTAO contract not found, please check env");
    return;
  }

  const address = instance.target;
  console.log(`WTAO address: ${address}`);

  // Create contract instance with proper typing
  const contract = WTAO__factory.connect(address.toString(), wallet);

  // Get the owner's address balance
  const balance = await contract.balanceOf(wallet.address);
  return balance;
}

async function getTAOBalance(address: AddressLike): Promise<bigint> {
  const tao_balanace = await ethers.provider.getBalance(address);
  return tao_balanace;
}

async function main() {
  // Get the wallet with provider
  const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);

  const wtao_balance = await getWTAOBalance(wallet);
  console.log("WTAO Balance:", wtao_balance);

  const tao_balance = await getTAOBalance(wallet.address);
  console.log("TAO Balance:", tao_balance);
}

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

export { getWTAOBalance, getTAOBalance };
