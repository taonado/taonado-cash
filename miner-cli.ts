#!/usr/bin/env -S pnpm tsx
import { Command } from 'commander';
import { ethers } from 'hardhat';
import { deposit } from './scripts/deposit';
import { getBalance } from './scripts/get-balance';
import { withdraw } from './scripts/withdrawal';
import { transferTao } from './scripts/transfer';
import { config } from './config';
//import { runMiner } from './scripts/miner'

const program = new Command('miner');

program
  .command('deposit')
  .description('💰 Deposit TAO to WTAO contract (Mirror TAO -> Contract WTAO)')
  .requiredOption('--amount <amount>', 'TAO amount to deposit (e.g. 1.0)')
  .action(async (options) => {
    const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
    const amountToDeposit = ethers.parseEther(options.amount);
    await deposit(wallet, amountToDeposit);
    console.log(`✅ Deposited ${options.amount} TAO`);
  });

program
  .command('balance')
  .description('👁️ Get TAO and WTAO balances')
  .action(async () => {
    await getBalance();
  });

program
  .command('withdraw')
  .description('📤 Withdraw WTAO from contract to TAO Mirror Wallet')
  .requiredOption('--amount <amount>', 'TAO amount to withdraw (e.g. 1.0)')
  .action(async (options) => {
    const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
    const amountToWithdraw = ethers.parseEther(options.amount);
    await withdraw(wallet, amountToWithdraw);
    console.log(`✅ Withdrew ${options.amount} TAO`);
  });

program
  .command('transfer')
  .description('📤 Transfer TAO from Mirror wallet to TAO wallet')
  .requiredOption('--amount <amount>', 'TAO amount to transfer (e.g. 1.0)')
  .requiredOption('--destination <address>', 'Destination TAO wallet coldkey')
  .action(async (options) => {
    const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
    const amountToTransfer = ethers.parseEther(options.amount);
    await transferTao(wallet, options.destination, amountToTransfer);
    console.log(`✅ Transferred ${options.amount} TAO to ${options.destination}`);
  });

// Coming later.
/*program
  .command('miner')
  .description('Run miner.ts, deposit TAO')
  .requiredOption('--amount <amount>', 'TAO amount to deposit (e.g. 1.0)')
  .requiredOption('--validator <yes/no>', 'Validator loop on or off')
  .action(async (options) => {
    const enableValidator = options.validator.toLowerCase() === 'yes';
    const depositAmount = ethers.parseEther(options.amount); // Convert to bigint
    const { runMiner } = await import('./scripts/miner2');
    await runMiner(depositAmount, enableValidator);
    console.log(`✅ Success! Deposited ${options.amount} TAO. Validator set to ${enableValidator ? 'on' : 'off'}`);
  });*/

console.log('Commands:', program.commands.map(c => c.name())); // debug
program.parse(process.argv);