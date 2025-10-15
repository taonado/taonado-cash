import {
  loadFixture,
  setCode,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { mockMetagraph } from "./mock/metagraph.mock";
import { deployERC20Taonado } from "./deploy/taonado";
import { BigNumberish } from "ethers";
import { randomBytes } from "crypto";
import {
  createDeposit,
  parseNote,
  createNote,
  Deposit,
  toHex,
  generateSnarkProof,
} from "../core/taonado";

describe("Weights", function () {
  const sn_sudo_pk: string = "0x69";
  const netuid: BigNumberish = "0x99"; // 🌪️

  async function deployTracker() {
    const DepositTracker = await ethers.getContractFactory("DepositTracker");
    const depositTracker = await DepositTracker.deploy();

    return depositTracker;
  }

  async function deployFixture() {
    // Deploy WTAO
    const WTAO = await ethers.getContractFactory("WTAO");
    const wtao = await WTAO.deploy();

    // Deploy DepositTracker
    const depositTracker = await deployTracker();

    // get MockMetagraph
    const metagraph = await mockMetagraph();
    //setup owner mock hotkey
    await metagraph.setHotkey(
      netuid,
      0,
      ethers.encodeBytes32String(sn_sudo_pk)
    );

    const { taonado_erc20 } = await deployERC20Taonado(wtao);

    // Deploy WeightsV3
    const Weights = await ethers.getContractFactory("WeightsV3");
    const weights = await Weights.deploy(
      netuid,
      await depositTracker.getAddress(),
      await metagraph.getAddress(),
      await wtao.getAddress(),
      await taonado_erc20.getAddress()
    );

    await weights.setDepositGoal(ethers.parseEther("1000"));

    // Get signers for testing
    const [owner, addr1, addr2, throwaway] = await ethers.getSigners();

    return {
      wtao,
      depositTracker,
      metagraph,
      weights,
      owner,
      addr1,
      addr2,
      taonado_erc20,
    };
  }

  describe("getWeightsNoDeposits", async function () {
    it("should burn all emissions with no deposits", async function () {
      const { weights, owner, addr1, addr2 } = await loadFixture(deployFixture);

      const normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1][0]).to.equal(65535n);
    });

    it("should burn excess emissions even with unallocated wtao deposits", async function () {
      const { weights, owner, addr1, addr2, wtao } = await loadFixture(
        deployFixture
      );

      let normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1][0]).to.equal(65535n);

      await wtao.connect(addr1).deposit({ value: ethers.parseEther("113") });

      // should still be 100% burn
      normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1][0]).to.equal(65535n);
    });

    it("should split emissions proportionally to deposits", async function () {
      const { weights, depositTracker, metagraph, owner, addr1, addr2, wtao } =
        await loadFixture(deployFixture);

      // "register" two miners
      const [miner1, miner2] = [randomBytes(32), randomBytes(32)];
      await metagraph.setHotkey(netuid, 1, miner1);
      await metagraph.setHotkey(netuid, 2, miner2);

      // new miners shouldn't get any weights!
      let normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([65535n, 0n, 0n]);

      // deposit some tao
      await wtao.connect(addr1).deposit({ value: ethers.parseEther("1") });
      await wtao.connect(addr2).deposit({ value: ethers.parseEther("1") });

      await depositTracker.connect(addr1).associate(miner1);
      await depositTracker.connect(addr2).associate(miner2);

      // miners should get some weights now
      normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([65403n, 65n, 65n]);

      // moar tao!!!111!!
      await wtao.connect(addr1).deposit({ value: ethers.parseEther("449") });
      await wtao.connect(addr2).deposit({ value: ethers.parseEther("449") });

      // miners should get some weights now
      normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([6553n, 29490n, 29490n]);

      // miner 1 wins!
      await wtao.connect(addr1).deposit({ value: ethers.parseEther("100") });
      normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([0n, 36044n, 29490n]);

      // miner 2 throws in the towel. fuck miner 2!
      await wtao.connect(addr2).withdraw(ethers.parseEther("450"));
      normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([29490n, 36044n, 0n]);

      // fuck miners!
      await wtao.connect(addr1).withdraw(ethers.parseEther("550"));
      normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([65535n, 0n, 0n]);

      // exceed deposit goal by x10
      await wtao.connect(addr1).deposit({ value: ethers.parseEther("9000") });
      await wtao.connect(addr2).deposit({ value: ethers.parseEther("1000") });

      normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([0n, 58981n, 6553n]);
    });

    it("should consider taonado shielded pool deposits", async function () {
      const {
        weights,
        depositTracker,
        metagraph,
        addr1,
        addr2,
        wtao,
        taonado_erc20,
      } = await loadFixture(deployFixture);

      // "register" two miners
      const [miner1, miner2] = [randomBytes(32), randomBytes(32)];
      await metagraph.setHotkey(netuid, 1, miner1);
      await metagraph.setHotkey(netuid, 2, miner2);

      // new miners shouldn't get any weights!
      let normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([65535n, 0n, 0n]);

      // deposit some tao
      await wtao.connect(addr1).deposit({ value: ethers.parseEther("10") });
      await wtao.connect(addr2).deposit({ value: ethers.parseEther("10") });

      await depositTracker.connect(addr1).associate(miner1);
      await depositTracker.connect(addr2).associate(miner2);

      // miners should get some weights now
      normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([64224n, 655n, 655n]);

      const { deposit, note } = await createDeposit();
      await wtao
        .connect(addr1)
        .approve(await taonado_erc20.getAddress(), ethers.parseEther("1"));

      await taonado_erc20.connect(addr1).deposit(toHex(deposit.commitment));

      // weights shouldn't change, as they contributed capital is the same!
      normalizedWeights = await weights.getNormalizedWeights();
      expect(normalizedWeights[1]).to.deep.equal([64224n, 655n, 655n]);

      expect(await taonado_erc20.totalLifetimeDeposits(addr1)).to.equal(
        ethers.parseEther("1")
      );
    });
  });
});
