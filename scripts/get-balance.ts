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

  // Get the owner's address balance
  const balance = await contract.balanceOf(wallet.address);
  console.log("WTAO Balance:", balance);

  // Get the owner's address balance
  const tao_balanace = await ethers.provider.getBalance(wallet.address);
  console.log("TAO Balance:", tao_balanace);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
