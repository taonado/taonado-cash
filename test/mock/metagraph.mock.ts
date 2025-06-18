import { setCode } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { IMetagraph_ADDRESS } from "../../const";

export async function mockMetagraph() {
  const Metagraph = await ethers.getContractFactory("MockMetagraph");

  // Deploy the contract normally first to ensure it's compiled and get the bytecode
  const mockMetagraph = await Metagraph.deploy();
  await mockMetagraph.waitForDeployment();

  // overwrite the code at the pre-compile address
  await setCode(
    IMetagraph_ADDRESS,
    (await mockMetagraph.getDeployedCode()) || "0xdead"
  );

  // Get the contract instance at the target address
  const metagraph = await ethers.getContractAt(
    "MockMetagraph",
    IMetagraph_ADDRESS
  );

  // Confirm contract is working by calling a simple function
  try {
    const uidCount = await metagraph.getUidCount(0);
  } catch (error) {
    console.error("Failed to call getUidCount:", error);
    throw new Error(
      "MockMetagraph contract not properly deployed at target address"
    );
  }

  return metagraph;
}
