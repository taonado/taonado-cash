/*
--------------------------------
          🌪️ README 🌪️          
--------------------------------

Uses a EVM address as the validator hotkey.
This requires no TAO on the EVM side, it works the same way once associated with your coldkey.

It's pretty light weight, just a script to set weights based on the contract state.

The python equivalent is actually a lot more complex, and requires a lot more code to handle the weights.
*/

import { ethers } from "hardhat";
import { convertH160ToSS58 } from "./address-utils";
import { config } from "../config";
import { getTAOBalance } from "./balance";
import { INeuron__factory, WeightsV1__factory } from "../typechain-types";
let INeuron_ADDRESS = "0x0000000000000000000000000000000000000804";

async function main() {
  // EVM wallet - validator hotkey
  const evm_wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
  const evm_mirror_ss58 = convertH160ToSS58(evm_wallet.address);
  console.log(`vali EVM wallet:      ${evm_wallet.address}`);
  console.log(`vali EVM mirror ss58: ${evm_mirror_ss58}`); // you must use this address as your vali hotkey
  console.log(
    `vali EVM balance: ${ethers.formatUnits(
      await getTAOBalance(evm_wallet.address)
    )}t`
  );

  const neuron = INeuron__factory.connect(INeuron_ADDRESS, evm_wallet);

  const weights_contract = WeightsV1__factory.connect(
    "0xA6c42d33bc555Da4FC2ade5f90Cc00C6c8CB9CfF",
    evm_wallet
  );

  // grab weights from the contract based on current chain state
  // apply directly using EVM 😎
  const setWeights_loop = async () => {
    const weights = await weights_contract.getNormalizedWeights();
    console.log("Setting weights...");
    console.log(`weights: ${weights}`);
    await neuron.setWeights(2, [...weights[0]], [...weights[1]], 0);
  };

  await setWeights_loop();
  setInterval(setWeights_loop, 101 * 12 * 1000); // every 101 blocks or so
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
