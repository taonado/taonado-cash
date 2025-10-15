import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { config } from "../config";
import {
  createDeposit,
  parseNote,
  createNote,
  Deposit,
  toHex,
  generateSnarkProof,
} from "../core/taonado";
import { deployERC20Taonado } from "./deploy/taonado";

const pool_token_amount = ethers.parseEther("1");

describe("ERC20Taonado", function () {
  describe("Deposits", function () {
    it("Should parse deposit note & match", async function () {
      const { deposit, note } = await createDeposit();

      expect(deposit.commitment).to.not.be.undefined;
      expect(deposit.nullifier).to.not.be.undefined;
      expect(deposit.secret).to.not.be.undefined;
      expect(deposit.nullifierHash).to.not.be.undefined;
      expect(deposit.preimage).to.not.be.undefined;

      const parsedDeposit = parseNote(note);
      expect(parsedDeposit).to.deep.equal(deposit);

      const note2 = await createNote(parsedDeposit);
      expect(note2).to.equal(note);
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

  describe("Withdrawals", function () {
    async function setupAndMakeDeposit() {
      const { wtao, taonado_erc20 } = await loadFixture(deployERC20Taonado);
      const [wallet] = await ethers.getSigners();

      await wtao.deposit({ value: pool_token_amount });
      await wtao.approve(taonado_erc20.getAddress(), pool_token_amount);

      const { deposit, note } = await createDeposit();
      await taonado_erc20.deposit(toHex(deposit.commitment));

      // generate a proof and use it across multiple tests, speeding up the tests
      const { proof, args } = await generateSnarkProof(
        deposit,
        wallet.address,
        taonado_erc20
      );

      return { wtao, taonado_erc20, wallet, deposit, note, proof, args };
    }
    it("should allow withdrawals", async function () {
      const { wtao, taonado_erc20, wallet, deposit, note, proof, args } =
        await loadFixture(setupAndMakeDeposit);

      const beforeBalance = await wtao.balanceOf(wallet.address);
      // @ts-ignore
      await taonado_erc20.withdraw(proof, ...args);
      const afterBalance = await wtao.balanceOf(wallet.address);

      expect(afterBalance).to.equal(beforeBalance + pool_token_amount);

      const lifetimeDeposits = await taonado_erc20.totalLifetimeDeposits(
        wallet.address
      );
      expect(lifetimeDeposits).to.equal(pool_token_amount);
    });

    it("should prevent double withdrawals", async function () {
      const { wtao, taonado_erc20, wallet, deposit, note, proof, args } =
        await loadFixture(setupAndMakeDeposit);

      // @ts-ignore
      await taonado_erc20.withdraw(proof, ...args);

      await expect(
        // @ts-ignore
        taonado_erc20.withdraw(proof, ...args)
      ).to.be.revertedWith("The note has been already spent");
    });

    it("should not allow recipient change", async function () {
      const { wtao, taonado_erc20, wallet, deposit, note, proof, args } =
        await loadFixture(setupAndMakeDeposit);

      const [, malicious] = await ethers.getSigners();

      const badArgs = [proof, ...args];
      badArgs[3] = malicious.address;

      await expect(
        // @ts-ignore
        taonado_erc20.withdraw(...badArgs)
      ).to.be.revertedWith("Invalid withdraw proof");
    });

    it("should reject invalid proofs", async function () {
      const { wtao, taonado_erc20, wallet, deposit, note, proof, args } =
        await loadFixture(setupAndMakeDeposit);

      const bad_proof_bytes = Buffer.from(proof.slice(2), "hex");
      // Pick a random uint256 element to corrupt (0-7)
      const elementIndex = Math.floor(Math.random() * 8);
      // Always pick the least significant byte (byte 31, since uint256 is big-endian in Solidity ABI)
      const byteIndex = 0;
      // Calculate the absolute byte position
      const pos = elementIndex * 32 + byteIndex;
      // Flip the least significant bit in that byte
      // (this makes if very likely the field element will be < prime q and pass the other checks)
      bad_proof_bytes[pos] ^= 0x1;

      await expect(
        // @ts-ignore
        taonado_erc20.withdraw("0x" + bad_proof_bytes.toString("hex"), ...args)
      ).to.be.reverted;

      await expect(
        // @ts-ignore
        taonado_erc20.withdraw(proof, ...args)
      ).to.not.be.reverted;
    });
  });
});
