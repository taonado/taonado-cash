/*
--------------------------------
          🌪️ README 🌪️          
--------------------------------

Uses an EVM address as the validator hotkey.
This requires no TAO on the EVM side, it works the same way as a trad vali once associated with your coldkey.

It's pretty light weight, just a script to set weights based on the contract state.

I'll let vali's decide how to persist this script, since everyone has preferences.

The python equivalent is actually a lot more complex, and requires more code to handle weights.

Steps to configure:

1. Generate a new EVM wallet, set the private key in config.ts
2. Set the ss58 mirror address as your vali hotkey, you can get this address from the output of this script.
3. Run this script to set weights

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
      await getTAOBalance(evm_wallet.address) // you don't need any TAO in your EVM wallet, this is just for visibility
    )}t`
  );

  const neuron = INeuron__factory.connect(INeuron_ADDRESS, evm_wallet);

  const weights_contract = WeightsV1__factory.connect(
    "0xf2094228337f3041887932972c57152429dAb82A", //testnet WeightsV1
    evm_wallet
  );

  // grab weights from the contract based on current chain state
  // apply directly using EVM 😎
  const setWeights_loop = async () => {
    const weights = await weights_contract.getNormalizedWeights();
    console.log("Setting weights...");
    console.log(`weights: ${weights}`);
    await neuron.setWeights(config.netuid, [...weights[0]], [...weights[1]], 0);
  };

  await setWeights_loop();
  setInterval(setWeights_loop, 101 * 12 * 1000); // every 101 blocks or so
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
