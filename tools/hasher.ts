import path from "path";
import fs from "fs";
import { ethers } from "hardhat";
import { ContractRunner } from "ethers";
const genContract = require("circomlib/src/mimcsponge_gencontract.js");

const outputPath = path.join(__dirname, "..", "build", "Hasher.json");

export async function compileHasher(writeToFile = true) {
  const contract = {
    contractName: "Hasher",
    abi: genContract.abi,
    bytecode: genContract.createCode("mimcsponge", 220),
  };

  if (writeToFile) {
    fs.writeFileSync(outputPath, JSON.stringify(contract));
  }

  return contract;
}

export async function deployHasher(deployer: ContractRunner) {
  const hasherArtifact = await compileHasher(false);
  const hasherFactory = new ethers.ContractFactory(
    hasherArtifact.abi,
    hasherArtifact.bytecode,
    deployer
  );
  const hasher = await hasherFactory.deploy();
  return hasher;
}
