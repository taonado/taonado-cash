import { ethers } from "hardhat";
import { getWTAOContract } from "./contracts";
import { WTAO__factory } from "../typechain-types";
import { AddressLike, Wallet } from "ethers";

async function getWTAOBalance(wallet: Wallet) {
  let instance = await getWTAOContract();
  if (!instance) {
    console.warn("WTAO contract not found, please check env");
    return;
  }

  const address = instance.target;
  console.debug(`WTAO address: ${address}`);

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

export { getWTAOBalance, getTAOBalance };
