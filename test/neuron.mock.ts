import { setCode } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { INeuron_ADDRESS } from "../const";

export async function mockNeuron() {
  const Neuron = await ethers.getContractFactory("MockNeuron");

  const mockNeuron = await Neuron.deploy();
  await mockNeuron.waitForDeployment();

  await setCode(
    INeuron_ADDRESS,
    (await mockNeuron.getDeployedCode()) || "0xdead"
  );

  const neuron = await ethers.getContractAt("MockNeuron", INeuron_ADDRESS);

  try {
    await neuron.setWeights(0, [0], [0], 0);
  } catch (error) {
    console.error("Failed to call setWeights:", error);
    throw new Error(
      "MockNeuron contract not properly deployed at target address"
    );
  }

  return neuron;
}
