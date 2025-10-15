import { ethers } from "hardhat";
import { deployHasher } from "../../tools/hasher";
import { Contracts } from "../../scripts/contracts";
import { config } from "../../config";

const pool_token_amount = ethers.parseEther("1");
const { MERKLE_TREE_HEIGHT } = config;

export async function deployERC20Taonado() {
  const [deployer] = await ethers.getSigners();
  const hasher = await deployHasher(deployer);

  const verifier_factory = await ethers.getContractFactory(Contracts.VERIFIER);
  const verifier = await verifier_factory.deploy();

  const wtao_factory = await ethers.getContractFactory(Contracts.WTAO);
  const wtao = await wtao_factory.deploy();

  const taonado_factory = await ethers.getContractFactory(
    Contracts.ERC20TAONADO
  );
  const taonado_erc20 = await taonado_factory.deploy(
    verifier.getAddress(),
    hasher.getAddress(),
    pool_token_amount,
    MERKLE_TREE_HEIGHT,
    wtao.getAddress()
  );

  return { hasher, verifier, wtao, taonado_erc20 };
}
