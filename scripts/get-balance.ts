import { ethers } from "hardhat";
import { config } from "../config";
import { getTAOBalance, getWTAOBalance } from "./balance";
import { convertH160ToSS58 } from "./address-utils";

async function main() {
  // Get the wallet with provider
  const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
  console.log("EVM Wallet:", wallet.address);

  const ss58_address = convertH160ToSS58(wallet.address);
  console.log("ss58 equivalent:", ss58_address);

  const tao_balance = await getTAOBalance(wallet.address);
  console.log("TAO Balance:", tao_balance);

  const wtao_balance = await getWTAOBalance(wallet);
  console.log("WTAO Balance:", wtao_balance);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
