import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  try {
    console.log("Starting deployment...");

    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log(
      `Deploying to network: ${network.name} (chain ID: ${network.chainId})`
    );

    // Check account balance
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} TAO`);

    console.log("Deploying WTAO contract...");
    const factory = await ethers.getContractFactory("WTAO");
    const token = await factory.deploy();

    await token.waitForDeployment();
    console.log(`WTAO deployed to ${token.target}`);

    // Save deployment address and ABI
    const deployedContract = {
      address: token.target,
      abi: JSON.parse(token.interface.formatJson()),
    };
    fs.writeFileSync(
      "./deployed-contract.json",
      JSON.stringify(deployedContract)
    );
  } catch (error) {
    console.error("Detailed error information:");
    console.error(error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
