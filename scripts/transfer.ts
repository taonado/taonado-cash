import { ethers } from "hardhat";
import { Wallet } from "ethers";
import { config } from "../config";
import { ISubtensorBalanceTransfer_ADDRESS } from "../const";
import { getTAOBalance } from "./balance";
import {
  convertH160ToSS58,
  ss58ToH160,
  ss58ToPublicKey,
} from "./address-utils";

const ISubtensorBalanceTransfer_ABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "data",
        type: "bytes32",
      },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

async function transfer(
  evm_wallet: Wallet,
  destinationAddressSs58: string,
  value: bigint
) {
  console.log(`Sending balance to ss58 address: ${destinationAddressSs58}`);

  const SubtensorBalanceTransfer = new ethers.Contract(
    ISubtensorBalanceTransfer_ADDRESS,
    ISubtensorBalanceTransfer_ABI,
    evm_wallet
  );

  // Get the substrate address public key
  const publicKey = ss58ToPublicKey(destinationAddressSs58);

  try {
    const tx = await SubtensorBalanceTransfer.transfer(publicKey, { value });
    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    if (receipt) {
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      return receipt;
    }
  } catch (error) {
    console.error("Error transferring balance:", error);
  }
}

// transfers native tao from evm wallet to destination ss58 wallet
async function main() {
  const amountToTransfer = ethers.parseEther("5.0");
  const destinationAddressSs58 = "ss58_address_goes_here";

  // Get the wallet with provider
  const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);

  // EVM wallet
  const evm_wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
  const evm_mirror_ss58 = convertH160ToSS58(evm_wallet.address);
  console.log(`EVM wallet:  ${evm_wallet.address}`);
  console.log(
    `EVM balance: ${ethers.formatUnits(
      await getTAOBalance(evm_wallet.address)
    )}t`
  );

  console.log(`Destination wallet: ${destinationAddressSs58}`);
  console.log("--------------------------------");

  const receipt = await transfer(
    evm_wallet,
    destinationAddressSs58,
    amountToTransfer
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
