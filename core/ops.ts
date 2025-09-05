import { ethers } from "hardhat";
import { getTAOBalance, getWTAOBalance } from "../scripts/balance";
import { Contracts, getWTAOContract } from "../scripts/contracts";
import { getDeployedContract } from "../scripts/store";
import { withdrawQuiet } from "../scripts/withdrawal";
import { WTAO__factory, ERC20Taonado__factory } from "../typechain-types";
import { depositQuiet } from "../scripts/deposit";
import { AddressLike, BigNumberish, Wallet } from "ethers";
import { Deposit } from "./Deposit";
import { createDeposit, parseNote, toHex, generateSnarkProof } from "./taonado";

export async function balances(wallet: Wallet) {
  const taoBalance = await getTAOBalance(wallet.address);
  const wtaoBalance = await getWTAOBalance(wallet);

  return { taoBalance, wtaoBalance };
}

export async function wrapTAO(wallet: Wallet, amount: string) {
  return await depositQuiet(wallet, ethers.parseEther(amount));
}

export async function unwrapTAO(wallet: Wallet, amount: string) {
  return await withdrawQuiet(wallet, ethers.parseEther(amount));
}

async function getERC20TaonadoContract(wallet: Wallet) {
  const erc20taonado = await getDeployedContract(Contracts.ERC20TAONADO);
  console.log("ERC20Taonado contract address:", erc20taonado.target);
  const taonado = ERC20Taonado__factory.connect(
    erc20taonado.target.toString(),
    wallet
  );
  return taonado;
}

async function approveWTAO(
  wallet: Wallet,
  guy: AddressLike,
  amount: BigNumberish
) {
  const wtao = await getWTAOContract();
  if (!wtao) {
    throw new Error("WTAO contract not found! Please check env");
  }
  const contract = WTAO__factory.connect(wtao.target.toString(), wallet);
  return await contract.approve(guy, amount);
}

export async function depositTAO(
  wallet: Wallet,
  amount: string,
  address: string
) {
  const amount_wei = ethers.parseEther(amount);
  const wtaoBalance = await getWTAOBalance(wallet);
  if (!wtaoBalance || wtaoBalance < amount_wei) {
    throw new Error("Insufficient WTAO balance! Please wrap more TAO first.");
  }

  const taonado = await getERC20TaonadoContract(wallet);

  if (address != (await taonado.getAddress())) {
    throw new Error(
      "Address does not match the local Taonado contract address, are you sure you are running the latest version of the CLI?"
    );
  }

  const approval = await approveWTAO(wallet, taonado.getAddress(), amount_wei);
  const receipt = await approval.wait();

  const { deposit, note } = await createDeposit();

  console.log("Depositing TAO...");

  const tx = await taonado.deposit(toHex(deposit.commitment));
  await tx.wait();

  return { note, tx };
}

export async function claimNote(
  wallet: Wallet,
  note: string,
  recipient: AddressLike
) {
  const taonado = await getERC20TaonadoContract(wallet);

  const deposit = parseNote(note);

  const { proof, args } = await generateSnarkProof(deposit, recipient, taonado);

  // @ts-ignore
  const tx = await taonado.withdraw(proof, ...args);
  await tx.wait();

  return tx;
}
