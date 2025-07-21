import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { ethers as eth } from "ethers";
import { compileHasher } from "../tools/hasher";
import {
  createDeposit,
  parseNote,
  Deposit,
  toHex,
  generateSnarkProof,
} from "../core/cli";
import {
  DepositEvent,
  ERC20Taonado,
} from "../typechain-types/core/ERC20Taonado";

const pool_token_amount = ethers.parseEther("1");
const MERKLE_TREE_HEIGHT = 20;

describe("ERC20Taonado", function () {
  async function deployERC20Taonado() {
    const hasherArtifact = await compileHasher(false);

    // Deploy the precompiled Hasher contract directly
    const [deployer] = await ethers.getSigners();
    const hasherFactory = new ethers.ContractFactory(
      hasherArtifact.abi,
      hasherArtifact.bytecode,
      deployer
    );
    const hasher = await hasherFactory.deploy();

    const verifier_factory = await ethers.getContractFactory("Verifier");
    const verifier = await verifier_factory.deploy();

    const wtao_factory = await ethers.getContractFactory("WTAO");
    const wtao = await wtao_factory.deploy();

    const taonado_factory = await ethers.getContractFactory("ERC20Taonado");
    const taonado_erc20 = await taonado_factory.deploy(
      verifier.getAddress(),
      hasher.getAddress(),
      pool_token_amount,
      MERKLE_TREE_HEIGHT,
      wtao.getAddress()
    );

    return { hasher, verifier, wtao, taonado_erc20 };
  }

  describe("Deposits", function () {
    it("Should parse deposit note", async function () {
      const { deposit, note } = await createDeposit();

      expect(deposit.commitment).to.not.be.undefined;
      expect(deposit.nullifier).to.not.be.undefined;
      expect(deposit.secret).to.not.be.undefined;

      const parsedDeposit = parseNote(note);
      expect(parsedDeposit.commitment).to.equal(deposit.commitment);
      expect(parsedDeposit.nullifier).to.equal(deposit.nullifier);
      expect(parsedDeposit.secret).to.equal(deposit.secret);
    });

    it("Should allow deposits & withdrawal (singular)", async function () {
      const { wtao, taonado_erc20 } = await loadFixture(deployERC20Taonado);

      const [wallet] = await ethers.getSigners();
      let deposit: Deposit = {},
        note: string;
      const address = wallet.address;

      const numberOfDeposits = 10;
      for (let i = 0; i < numberOfDeposits; i++) {
        // First, deposit some TAO to get WTAO tokens
        await wtao.deposit({ value: pool_token_amount });

        // Approve the taonado contract to spend WTAO tokens
        await wtao.approve(taonado_erc20.getAddress(), pool_token_amount);

        ({ deposit, note } = await createDeposit());

        // Call deposit with the commitment
        await taonado_erc20.deposit(toHex(deposit.commitment));
      }

      const { proof, args } = await generateSnarkProof(
        deposit,
        address,
        taonado_erc20
      );

      expect(await wtao.balanceOf(address)).to.equal(0);
      expect(await wtao.balanceOf(taonado_erc20.getAddress())).to.equal(
        pool_token_amount * BigInt(numberOfDeposits)
      );
      // @ts-ignore
      const response = await taonado_erc20.withdraw(proof, ...args);

      expect(await wtao.balanceOf(taonado_erc20.getAddress())).to.equal(
        pool_token_amount * BigInt(numberOfDeposits - 1)
      );
      expect(await wtao.balanceOf(address)).to.equal(pool_token_amount);
    });

    it("should prevent double commitments", async function () {
      const { wtao, taonado_erc20 } = await loadFixture(deployERC20Taonado);
      const [wallet] = await ethers.getSigners();

      await wtao.deposit({ value: pool_token_amount });

      // Approve the taonado contract to spend WTAO tokens
      await wtao.approve(taonado_erc20.getAddress(), pool_token_amount);

      const { deposit, note } = await createDeposit();

      // Call deposit with the commitment
      await taonado_erc20.deposit(toHex(deposit.commitment));

      await expect(
        taonado_erc20.deposit(toHex(deposit.commitment))
      ).to.be.revertedWith("The commitment has been submitted");
    });

    it("should require transferrable wTAO", async function () {
      const { taonado_erc20 } = await loadFixture(deployERC20Taonado);
      const [wallet] = await ethers.getSigners();

      const { deposit, note } = await createDeposit();

      await expect(
        taonado_erc20.deposit(toHex(deposit.commitment))
      ).to.be.rejectedWith("FailedInnerCall()");
    });
  });
});
