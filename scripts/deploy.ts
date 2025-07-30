import { ethers } from "hardhat";
import { storeContract, contractExists, getDeployedContract } from "./store";
import {
  WTAO__factory,
  DepositTracker__factory,
  WeightsV2__factory,
  EvmValidator__factory,
  ERC20Taonado__factory,
  Verifier__factory,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AddressLike, BigNumberish } from "ethers";
import { Contracts } from "./contracts";
import { IMetagraph_ADDRESS } from "../const";
import { config } from "../config";
import { deployHasher as _deployHasher } from "../tools/hasher";

let deployer: HardhatEthersSigner;
const pool_token_amount = ethers.parseEther("1");

async function main() {
  try {
    console.log("Starting deployment...");

    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log(
      `Deploying to network: ${network.name} (chain ID: ${network.chainId})`
    );

    // Check account balance
    [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} TAO`);

    const wtao = await deployWTAO();
    const depositTracker = await deployDepositTracker();
    const weights = await deployWeights(
      config.netuid,
      depositTracker.target,
      wtao.target
    );

    // set initial deposit goal to 1000 TAO
    await weights.setDepositGoal(ethers.parseEther("1000"));

    const evmValidator = await deployEvmValidator(
      config.netuid,
      weights.target
    );

    await evmValidator.setSetWeightsBounty(ethers.parseEther("0.01"));
    await evmValidator.setSetWeightsBlockInterval(339);
    await evmValidator.setMetagraphBoostValue(256);

    const hasher = await deployHasher();
    const verifier = await deployVerifier();
    const erc20taonado = await deployPrivacyPool(
      verifier.getAddress(),
      hasher.getAddress(),
      pool_token_amount,
      config.MERKLE_TREE_HEIGHT,
      wtao.getAddress()
    );

    console.log("Contracts deployed and configured successfully! 🌀");

    console.log("------ ENV VARS ------");
    console.log(`PUBLIC_WTAO_ADDRESS=${wtao.target}`);
    console.log("----------------------");
  } catch (error) {
    console.error("Detailed error information:");
    console.error(error);
  }
}

async function deployPrivacyPool(
  _verifier: AddressLike,
  _hasher: AddressLike,
  pool_token_amount: BigNumberish,
  merkle_tree_height: BigNumberish,
  _wtao: AddressLike
) {
  if (await contractExists(Contracts.ERC20TAONADO)) {
    console.log("ERC20Taonado contract already exists");
    const _erc20taonado = await getDeployedContract<typeof erc20taonado>(
      Contracts.ERC20TAONADO
    );
    const contract = ERC20Taonado__factory.connect(
      _erc20taonado.target.toString(),
      deployer
    );
    return contract;
  }

  console.log("Deploying ERC20Taonado contract...");
  const factory = await ethers.getContractFactory(Contracts.ERC20TAONADO);
  const erc20taonado = await factory.deploy(
    _verifier,
    _hasher,
    pool_token_amount,
    merkle_tree_height,
    _wtao
  );
  await erc20taonado.waitForDeployment();
  console.log(`ERC20Taonado deployed to ${erc20taonado.target}`);

  await storeContract<typeof erc20taonado>(
    Contracts.ERC20TAONADO,
    erc20taonado
  );
  return erc20taonado;
}

async function deployHasher() {
  if (await contractExists(Contracts.HASHER)) {
    console.log("Hasher contract already exists");
    const _hasher = await getDeployedContract<typeof hasher>(Contracts.HASHER);
    return _hasher;
  }
  console.log("Deploying Hasher contract...");
  const hasher = await _deployHasher(deployer);
  await hasher.waitForDeployment();
  console.log(`Hasher deployed to ${hasher.target}`);

  await storeContract<typeof hasher>(Contracts.HASHER, hasher);
  return hasher;
}

async function deployVerifier() {
  if (await contractExists(Contracts.VERIFIER)) {
    console.log("Verifier contract already exists");
    const _verifier = await getDeployedContract<typeof verifier>(
      Contracts.VERIFIER
    );
    return _verifier;
  }
  console.log("Deploying Verifier contract...");
  const factory = await ethers.getContractFactory(Contracts.VERIFIER);
  const verifier = await factory.deploy();
  await verifier.waitForDeployment();
  console.log(`Verifier deployed to ${verifier.target}`);

  await storeContract<typeof verifier>(Contracts.VERIFIER, verifier);
  return verifier;
}

async function deployEvmValidator(netuid: BigNumberish, _weights: AddressLike) {
  if (await contractExists(Contracts.EVM_VALIDATOR)) {
    console.log("EVMValidator contract already exists");
    const validator = await getDeployedContract<typeof evmValidator>(
      Contracts.EVM_VALIDATOR
    );
    const contract = EvmValidator__factory.connect(
      validator.target.toString(),
      deployer
    );
    return contract;
  }

  console.log("Deploying EVMValidator contract...");
  const factory = await ethers.getContractFactory(Contracts.EVM_VALIDATOR);
  const evmValidator = await factory.deploy(netuid, _weights);

  await evmValidator.waitForDeployment();
  console.log(`EVMValidator deployed to ${evmValidator.target}`);

  await storeContract<typeof evmValidator>(
    Contracts.EVM_VALIDATOR,
    evmValidator
  );

  return evmValidator;
}

async function deployWTAO() {
  if (await contractExists(Contracts.WTAO)) {
    console.log("WTAO contract already exists");
    const wtao = await getDeployedContract<typeof token>(Contracts.WTAO);

    const contract = WTAO__factory.connect(wtao.target.toString(), deployer);
    return contract;
  }

  console.log("Deploying WTAO contract...");
  const factory = await ethers.getContractFactory(Contracts.WTAO);
  const token = await factory.deploy();

  await token.waitForDeployment();
  console.log(`WTAO deployed to ${token.target}`);

  await storeContract<typeof token>(Contracts.WTAO, token);
  return token;
}

async function deployDepositTracker() {
  if (await contractExists(Contracts.DEPOSIT_TRACKER)) {
    console.log("DepositTracker already exists");
    const depositTracker = await getDeployedContract<typeof tracker>(
      Contracts.DEPOSIT_TRACKER
    );
    const contract = DepositTracker__factory.connect(
      depositTracker.target.toString(),
      deployer
    );
    return contract;
  }

  console.log("Deploying DepositTracker contract...");
  const factory = await ethers.getContractFactory(Contracts.DEPOSIT_TRACKER);
  const tracker = await factory.deploy();

  await tracker.waitForDeployment();
  console.log(`DepositTracker deployed to ${tracker.target}`);

  await storeContract<typeof tracker>(Contracts.DEPOSIT_TRACKER, tracker);
  return tracker;
}

async function deployWeights(
  netuid: BigNumberish,
  _depositTracker: AddressLike,
  _wtao: AddressLike
) {
  if (await contractExists(Contracts.WEIGHTS)) {
    console.log("Weights contract already exists");
    const weights = await getDeployedContract<typeof weightsv2>(
      Contracts.WEIGHTS
    );
    const contract = WeightsV2__factory.connect(
      weights.target.toString(),
      deployer
    );
    return contract;
  }

  console.log("Deploying Weights contract...");
  const factory = await ethers.getContractFactory(Contracts.WEIGHTS);
  const weightsv2 = await factory.deploy(
    netuid,
    _depositTracker,
    IMetagraph_ADDRESS,
    _wtao
  );

  await weightsv2.waitForDeployment();
  console.log(`WeightsV2 deployed to ${weightsv2.target}`);

  await storeContract<typeof weightsv2>(Contracts.WEIGHTS, weightsv2);
  return weightsv2;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
