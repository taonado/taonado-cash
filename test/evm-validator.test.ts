import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { mockMetagraph } from "./mock/metagraph.mock";
import { mockNeuron } from "./mock/neuron.mock";
import { AddressLike, BigNumberish, ethers as eth } from "ethers";
import { randomBytes } from "crypto";

describe("EvmValidator", function () {
  const sn_sudo_pk: string = "0x69";
  const version_key: string = "0x00";
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

    // Deploy MockMetagraph
    const metagraph = await mockMetagraph();
    //setup owner mock hotkey
    await metagraph.setHotkey(
      netuid,
      0,
      ethers.encodeBytes32String(sn_sudo_pk)
    );

    const neuron = await mockNeuron();

    // Deploy WeightsV2
    const Weights = await ethers.getContractFactory("WeightsV2");
    const weights = await Weights.deploy(
      netuid,
      await depositTracker.getAddress(),
      await metagraph.getAddress(),
      await wtao.getAddress()
    );

    await weights.setDepositGoal(ethers.parseEther("1000"));

    const EvmValidator = await ethers.getContractFactory("EvmValidator");
    const evmValidator = await EvmValidator.deploy(
      netuid,
      version_key,
      await weights.getAddress()
    );

    // Get signers for testing
    const [owner, addr1, addr2] = await ethers.getSigners();

    return {
      wtao,
      depositTracker,
      evmValidator,
      metagraph,
      weights,
      owner,
      addr1,
      addr2,
      neuron,
    };
  }

  describe("setWeights", function () {
    it("should set weights as miner or non-participant", async function () {
      const {
        evmValidator,
        depositTracker,
        addr1,
        addr2,
        metagraph,
        wtao,
        weights,
        neuron,
      } = await loadFixture(deployFixture);

      const [miner1, miner2] = [randomBytes(32), randomBytes(32)];
      await metagraph.setHotkey(netuid, 1, miner1);
      await metagraph.setHotkey(netuid, 2, miner2);

      await depositTracker.connect(addr1).associate(miner1);

      await wtao.connect(addr1).deposit({ value: ethers.parseEther("1") });
      let normalizedWeights = await weights.getNormalizedWeights();

      await evmValidator
        .connect(addr2)
        .setWeights(ethers.encodeBytes32String("0x0"));

      let setWeights = await neuron.getLastSetWeights();

      expect(setWeights[0]).to.equal(netuid);
      expect(setWeights[1]).to.deep.equal(normalizedWeights[0]);
      expect(setWeights[2]).to.deep.equal(normalizedWeights[1]);
      expect(setWeights[3]).to.equal(version_key);

      // same miner adds more wtao
      await wtao.connect(addr1).deposit({ value: ethers.parseEther("10") });

      normalizedWeights = await weights.getNormalizedWeights();

      // set weights as a non-participant
      await evmValidator
        .connect(addr2)
        .setWeights(ethers.encodeBytes32String("0x0"));

      setWeights = await neuron.getLastSetWeights();

      // weights should match regardless of who set it
      expect(setWeights[0]).to.equal(netuid);
      expect(setWeights[1]).to.deep.equal(normalizedWeights[0]);
      expect(setWeights[2]).to.deep.equal(normalizedWeights[1]);
      expect(setWeights[3]).to.equal(version_key);
    });

    it("should pay bounty for running setWeights", async function () {
      const {
        evmValidator,
        depositTracker,
        addr1,
        addr2,
        owner,
        metagraph,
        wtao,
        weights,
        neuron,
      } = await loadFixture(deployFixture);

      await owner.sendTransaction({
        to: evmValidator.getAddress(),
        value: ethers.parseEther("10"),
      });
      await evmValidator
        .connect(owner)
        .setSetWeightsBounty(ethers.parseEther("1"));

      const [miner1, miner2] = [randomBytes(32), randomBytes(32)];
      await metagraph.setHotkey(netuid, 1, miner1);
      await metagraph.setHotkey(netuid, 2, miner2);

      await depositTracker.connect(addr1).associate(miner1);

      await wtao.connect(addr1).deposit({ value: ethers.parseEther("1") });
      let normalizedWeights = await weights.getNormalizedWeights();

      const balanceBefore = await ethers.provider.getBalance(addr1.address);

      await evmValidator
        .connect(addr1)
        .setWeights(ethers.encodeBytes32String("0x0"));

      const balanceAfter = await ethers.provider.getBalance(addr1.address);
      expect(balanceAfter - balanceBefore).to.be.approximately(
        ethers.parseEther("1"),
        ethers.parseEther("0.001") // enough for the gas difference
      );

      let setWeights = await neuron.getLastSetWeights();

      // shoudn't change weights
      expect(setWeights[0]).to.equal(netuid);
      expect(setWeights[1]).to.deep.equal(normalizedWeights[0]);
      expect(setWeights[2]).to.deep.equal(normalizedWeights[1]);
      expect(setWeights[3]).to.equal(version_key);
    });

    it("should boost weights for running setWeights", async function () {
      const {
        evmValidator,
        depositTracker,
        addr1,
        addr2,
        owner,
        metagraph,
        wtao,
        weights,
        neuron,
      } = await loadFixture(deployFixture);

      const metagraphBoostValue = BigInt(250);

      await evmValidator
        .connect(owner)
        .setMetagraphBoostValue(metagraphBoostValue);

      const [miner1, miner2] = [randomBytes(32), randomBytes(32)];
      await metagraph.setHotkey(netuid, 1, miner1);
      await metagraph.setHotkey(netuid, 2, miner2);

      await depositTracker.connect(addr1).associate(miner1);

      await wtao.connect(addr1).deposit({ value: ethers.parseEther("1") });
      let normalizedWeights = await weights.getNormalizedWeights();

      await evmValidator.connect(addr1).setWeights(miner2);

      let setWeights = await neuron.getLastSetWeights();

      // shoudn't change weights, except for the metagraph boost
      expect(setWeights[0]).to.equal(netuid);
      expect(setWeights[1]).to.deep.equal(normalizedWeights[0]);
      expect(setWeights[2]).to.deep.equal([
        normalizedWeights[1][0],
        normalizedWeights[1][1],
        normalizedWeights[1][2] + BigInt(metagraphBoostValue),
      ]);
      expect(setWeights[3]).to.equal(version_key);
    });
  });

  describe("operatorSetWeights", function () {
    it("only owner can call operatorSetWeights", async function () {
      const { owner, addr1, evmValidator } = await loadFixture(deployFixture);
      await expect(
        evmValidator.connect(addr1).operatorSetWeights()
      ).to.be.revertedWithCustomError(
        evmValidator,
        "OwnableUnauthorizedAccount"
      );
      await expect(evmValidator.connect(owner).operatorSetWeights()).to.not.be
        .reverted;
    });

    it("should set weights", async function () {
      const { owner, evmValidator } = await loadFixture(deployFixture);

      await expect(evmValidator.connect(owner).operatorSetWeights()).to.not.be
        .reverted;
    });
  });

  describe("Owner Management Functions", function () {
    describe("setMetagraphBoostValue", function () {
      it("only owner can call setMetagraphBoostValue", async function () {
        const { addr1, evmValidator } = await loadFixture(deployFixture);
        await expect(
          evmValidator.connect(addr1).setMetagraphBoostValue(100)
        ).to.be.revertedWithCustomError(
          evmValidator,
          "OwnableUnauthorizedAccount"
        );
      });

      it("owner can call setMetagraphBoostValue", async function () {
        const { owner, evmValidator } = await loadFixture(deployFixture);
        await expect(evmValidator.connect(owner).setMetagraphBoostValue(100)).to
          .not.be.reverted;
      });
    });

    describe("setVersionKey", function () {
      it("only owner can call setVersionKey", async function () {
        const { addr1, evmValidator } = await loadFixture(deployFixture);
        await expect(
          evmValidator.connect(addr1).setVersionKey(123)
        ).to.be.revertedWithCustomError(
          evmValidator,
          "OwnableUnauthorizedAccount"
        );
      });

      it("owner can call setVersionKey", async function () {
        const { owner, evmValidator } = await loadFixture(deployFixture);
        await expect(evmValidator.connect(owner).setVersionKey(123)).to.not.be
          .reverted;
      });
    });

    describe("setWeightsContract", function () {
      it("only owner can call setWeightsContract", async function () {
        const { addr1, evmValidator, addr2 } = await loadFixture(deployFixture);
        await expect(
          evmValidator.connect(addr1).setWeightsContract(addr2.address)
        ).to.be.revertedWithCustomError(
          evmValidator,
          "OwnableUnauthorizedAccount"
        );
      });

      it("owner can call setWeightsContract", async function () {
        const { owner, evmValidator, addr2 } = await loadFixture(deployFixture);
        await expect(
          evmValidator.connect(owner).setWeightsContract(addr2.address)
        ).to.not.be.reverted;
      });
    });

    describe("setSetWeightsBounty", function () {
      it("only owner can call setSetWeightsBounty", async function () {
        const { addr1, evmValidator } = await loadFixture(deployFixture);
        await expect(
          evmValidator
            .connect(addr1)
            .setSetWeightsBounty(ethers.parseEther("1"))
        ).to.be.revertedWithCustomError(
          evmValidator,
          "OwnableUnauthorizedAccount"
        );
      });

      it("owner can call setSetWeightsBounty", async function () {
        const { owner, evmValidator } = await loadFixture(deployFixture);
        await expect(
          evmValidator
            .connect(owner)
            .setSetWeightsBounty(ethers.parseEther("1"))
        ).to.not.be.reverted;
      });
    });

    describe("setSetWeightsBlockInterval", function () {
      it("only owner can call setSetWeightsBlockInterval", async function () {
        const { addr1, evmValidator } = await loadFixture(deployFixture);
        await expect(
          evmValidator.connect(addr1).setSetWeightsBlockInterval(100)
        ).to.be.revertedWithCustomError(
          evmValidator,
          "OwnableUnauthorizedAccount"
        );
      });

      it("owner can call setSetWeightsBlockInterval", async function () {
        const { owner, evmValidator } = await loadFixture(deployFixture);
        await expect(
          evmValidator.connect(owner).setSetWeightsBlockInterval(100)
        ).to.not.be.reverted;
      });
    });
  });

  describe("neuronMock", function () {
    it("should revert when mocked!", async function () {
      const { neuron, evmValidator, owner, addr1 } = await loadFixture(
        deployFixture
      );

      await neuron.setShouldRevertSetWeights(true);
      await expect(
        evmValidator
          .connect(addr1)
          .setWeights(ethers.encodeBytes32String(sn_sudo_pk))
      ).to.be.reverted;
      await neuron.setShouldRevertSetWeights(false);
      await expect(
        evmValidator
          .connect(addr1)
          .setWeights(ethers.encodeBytes32String(sn_sudo_pk))
      ).to.not.be.reverted;
    });
  });

  describe("Emergency Functions", function () {
    describe("rescueFunds", function () {
      it("only owner can call rescueFunds", async function () {
        const { owner, addr1, evmValidator } = await loadFixture(deployFixture);
        await expect(
          evmValidator.connect(addr1).rescueFunds()
        ).to.be.revertedWithCustomError(
          evmValidator,
          "OwnableUnauthorizedAccount"
        );
        await expect(evmValidator.connect(owner).rescueFunds()).to.not.be
          .reverted;
      });

      it("should transfer remaining bounty fees to owner", async function () {
        const { owner, evmValidator } = await loadFixture(deployFixture);

        await owner.sendTransaction({
          to: evmValidator.getAddress(),
          value: ethers.parseEther("1"),
        });

        const balanceBefore = await ethers.provider.getBalance(owner.address);

        await expect(await evmValidator.connect(owner).rescueFunds()).to.not.be
          .reverted;

        const balanceAfter = await ethers.provider.getBalance(owner.address);
        expect(balanceAfter).to.be.greaterThan(balanceBefore);

        expect(
          await ethers.provider.getBalance(evmValidator.getAddress())
        ).to.equal(0);
      });
    });
  });
});
