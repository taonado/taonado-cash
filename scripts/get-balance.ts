import { ethers } from "hardhat";
import { config } from "../config";
import { getTAOBalance, getWTAOBalance } from "./balance";
import { convertH160ToSS58 } from "./address-utils";

export async function getBalance() {
  // Get the wallet with provider
  const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
  console.log("EVM Wallet:", wallet.address);
  const ss58_address = convertH160ToSS58(wallet.address);
  console.log("ss58 equivalent:", ss58_address);

  const tao_balance = await getTAOBalance(wallet.address);
  console.log("TAO Balance:", tao_balance ? ethers.formatEther(tao_balance) : "0", "TAO");

  const wtao_balance = await getWTAOBalance(wallet);
  console.log("WTAO Balance:", wtao_balance ? ethers.formatEther(wtao_balance) : "0", "WTAO");
}