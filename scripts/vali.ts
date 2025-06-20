/*
--------------------------------
          🌪️ README 🌪️          
--------------------------------

Uses an EVM address as the validator hotkey.
This uses a small amount of TAO on the EVM for gas, otherwise it works the same way as a trad vali once associated with your coldkey.

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
import { getDeployedContract } from "./store";
import { config } from "../config";
import { getTAOBalance } from "./balance";
import {
  WeightsV2__factory,
  EvmValidator__factory,
  EvmValidator,
} from "../typechain-types";
import { Contracts } from "./contracts";

async function main() {
  // EVM wallet - validator hotkey
  const evm_wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
  const evm_mirror_ss58 = convertH160ToSS58(evm_wallet.address);
  console.log(`vali EVM wallet:      ${evm_wallet.address}`);
  console.log(`vali EVM mirror ss58: ${evm_mirror_ss58}`); // you must use this address as your vali hotkey
  console.log(
    `vali EVM balance: ${ethers.formatUnits(
      await getTAOBalance(evm_wallet.address) // You will need a small amount of TAO on your EVM wallet for gas
    )}t`
  );

  const deployedContract = await getDeployedContract<EvmValidator>(
    Contracts.EVM_VALIDATOR
  );

  const evmValidator = EvmValidator__factory.connect(
    deployedContract.target.toString(),
    evm_wallet
  );

  const balance = await ethers.provider.getBalance(evmValidator.getAddress());
  console.log(`evmValidator balance: ${balance}`);

  const weights_contract = WeightsV2__factory.connect(
    "0xc6Bc37B421Bc7943B4F815bc30fB5792dcFe6251", //mainnet WeightsV2
    evm_wallet
  );

  // apply weights directly using EVM 😎
  const setWeights_loop = async () => {
    const weights = await weights_contract.getNormalizedWeights();
    console.log("Setting weights...");
    console.log(`weights: ${weights}`);
    try {
      const response = await evmValidator
        .operatorSetWeights()
        .then((resp) => resp.wait());
      console.log("Weights set successfully");
      console.log("Setting again in 113 blocks...");
    } catch (e) {
      console.log("Error setting weights:", e);
      console.log("Retrying in 113 blocks...");
    }
  };

  await setWeights_loop();
  setInterval(setWeights_loop, 113 * 12 * 1000); // every 113 blocks or so
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
