import { ethers } from "hardhat";
import { config } from "../config";
import { getTAOBalance, getWTAOBalance } from "../scripts/balance";
import { withdrawQuiet } from "../scripts/withdrawal";
import { depositQuiet } from "../scripts/deposit";
import { Wallet } from "ethers";

export async function balances(wallet: Wallet) {
  const taoBalance = await getTAOBalance(wallet.address);
  const wtaoBalance = await getWTAOBalance(wallet);

  return { taoBalance, wtaoBalance };
}

export async function wrapTAO(wallet: Wallet, amount: string) {
  return await depositQuiet(wallet, ethers.parseEther(amount));
}

export async function unwrapTAO(wallet: Wallet, amount: string) {
  return await withdrawQuiet(wallet, ethers.parseEther(amount));
}
