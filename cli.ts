#!/usr/bin/env -S pnpm tsx
import { Command } from 'commander';
import { ethers } from 'hardhat';
import { deposit } from './scripts/deposit';
import { getBalance } from './scripts/get-balance';
import { withdraw } from './scripts/withdrawal';
import { transferTao } from './scripts/transfer';
import { config } from './config';

const program = new Command('tnd');

program
  .command('deposit')
  .description('Deposit TAO to WTAO contract')
  .requiredOption('--amount <amount>', 'Amount of TAO to deposit (e.g., 1.0)')
  .action(async (options) => {
    const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
    const amountToDeposit = ethers.parseEther(options.amount);
    await deposit(wallet, amountToDeposit);
    console.log(`Deposited ${options.amount} TAO successfully.`);
  });

program
  .command('balance')
  .description('Get TAO and WTAO balances for EVM wallet')
  .action(async () => {
    await getBalance();
  });

program
  .command('withdraw')
  .description('Withdraw TAO from WTAO contract')
  .requiredOption('--amount <amount>', 'Amount of TAO to withdraw (e.g., 1.0)')
  .action(async (options) => {
    const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
    const amountToWithdraw = ethers.parseEther(options.amount);
    await withdraw(wallet, amountToWithdraw);
    console.log(`Withdrew ${options.amount} TAO successfully.`);
  });

program
  .command('transfer')
  .description('Transfer TAO from EVM wallet to ss58 address')
  .requiredOption('--amount <amount>', 'Amount of TAO to transfer (e.g., 1.0)')
  .requiredOption('--destination <address>', 'Destination ss58 wallet address')
  .action(async (options) => {
    const wallet = new ethers.Wallet(config.ethPrivateKey, ethers.provider);
    const amountToTransfer = ethers.parseEther(options.amount);
    await transferTao(wallet, options.destination, amountToTransfer);
    console.log(`Transferred ${options.amount} TAO to ${options.destination} successfully.`);
  });

//console.log('Commands:', program.commands.map(c => c.name())); // debug

program.parse(process.argv);