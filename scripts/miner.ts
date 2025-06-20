/*
--------------------------------
          🌪️ README 🌪️          
--------------------------------

Miners earn emissions by depositing TAO into the WTAO contract.
Miners can remove TAO at any time. The scoring logic and funds are 100% isolated by design.
(we use WTAO as Phase 1 will allow WTAO deposits/withdrawals into the mixer)

Miners must associate the H160 address they make the deposit with registered ss58-hk (DepositTracker)
Once an H160 is associated to a ss58-hk, the H160 cannot be reassigned. To change the HK or H160, you must withdraw and make a new deposit + association. (hopefully this changes in the EVM in the future)

Weights are calculated entirely on-chain (a bittensor first?)

It's recommended to familiarize yourself with a local evm instance (making deposits/withdrawals between H160/ss58 addresses) before using real funds.

You only need to run this script once per miner HK. Afterwards you can use deposit/withdrawal scripts to manage funds.

p.s. please read the above before mining. 🌪️
*/

import { ethers } from "hardhat";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160, publicKeyToHex, convertH160ToSS58 } from "./address-utils";
import { config } from "../config";
import { deposit } from "./deposit";
import { getTAOBalance } from "./balance";
import { Contracts } from "./contracts";
import { getDeployedContract } from "./store";
import {
  DepositTracker,
  DepositTracker__factory,
  EvmValidator,
  EvmValidator__factory,
} from "../typechain-types";

async function main() {
  await cryptoWaitReady();

  const ss58hotkey = new Keyring({ type: "sr25519" }).addFromUri(
    config.subSeed
  );

  // these will match contents of your hotkey file generated with btcli
  console.log(`Miner HK ss58:         ${ss58hotkey.address}`);
  console.log(`Miner HK pubkey:       ${publicKeyToHex(ss58hotkey.publicKey)}`);
  console.log(`Miner HK H160:         ${ss58ToH160(ss58hotkey.address)}`);

  // EVM wallet
  const evm_wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
  const evm_mirror_ss58 = convertH160ToSS58(evm_wallet.address);
  console.log(`Miner EVM wallet:      ${evm_wallet.address}`);
  console.log(`Miner EVM mirror ss58: ${evm_mirror_ss58}`); // you must send TAO to this address before proceeding (for gas + deposits + association tx)
  console.log(
    `Miner EVM balance: ${ethers.formatUnits(
      await getTAOBalance(evm_wallet.address)
    )}t`
  );

  // Deposit 1 TAO to the contract
  const amountToDeposit = ethers.parseEther("1.0");
  await deposit(evm_wallet, amountToDeposit);

  const depositTracker = await getDeployedContract<DepositTracker>(
    Contracts.DEPOSIT_TRACKER
  );
  const contract = DepositTracker__factory.connect(
    depositTracker.target.toString(),
    evm_wallet
  );

  // associate the evm wallet with the ss58 address
  const associationExists = await contract.uniqueDepositors(evm_wallet.address);
  if (associationExists) {
    const association = await contract.associationSet(
      ss58hotkey.publicKey,
      evm_wallet.address
    );
    if (association) {
      console.log("EVM is correctly associated with ss58 address");
    } else {
      console.log("EVM wallet is associated with another ss58 address");
    }
  } else {
    await contract.associate(ss58hotkey.publicKey);
    console.log("Associated EVM wallet with ss58 address");
  }

  const deployedContract = await getDeployedContract<EvmValidator>(
    Contracts.EVM_VALIDATOR
  );

  const evmValidator = EvmValidator__factory.connect(
    deployedContract.target.toString(),
    evm_wallet
  );

  /*
   * ⚡ THE ONCHAIN VALIDATOR ⚡
   *
   * This miner loop transforms your node into a decentralized validator that:
   *
   * 🔥 TAKES OVER: Handles validation & weight setting to smart contracts
   * 🌐 UNIVERSAL ACCESS: Any EVM wallet can call it (not just miners!)
   * ⚡ MINER BOOST: Miners get extra rewards when they run it themselves
   * 💰 TAO BOUNTY: Earns TAO to cover gas costs for validation work
   *
   * ⚠️  IMPORTANT: You don't need every miner running this loop!
   *    Validation work is distributed across the network.
   *    Running this script = contributing to network validation + getting rewarded
   */

  const miner_loop = async () => {
    try {
      const response = await evmValidator
        .setWeights(ss58hotkey.publicKey, {
          gasLimit: 30000000,
        })
        .then((resp) => resp.wait());
      console.log("Weights set successfully");
      console.log("Setting again in 113 blocks...");
    } catch (e) {
      console.log("Error setting weights:", e);
      console.log("Retrying in 113 blocks...");
    }
  };

  // UNCOMMENT TO MAKE VALIDATION GREAT AGAIN ⚡

  // await miner_loop();
  // setInterval(miner_loop, 113 * 12 * 1000); // every 113 blocks or so
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
