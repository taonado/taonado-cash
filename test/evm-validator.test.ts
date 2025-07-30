import {
  loadFixture,
  mine,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { mockMetagraph } from "./mock/metagraph.mock";
import { mockNeuron } from "./mock/neuron.mock";
import { BigNumberish } from "ethers";
import { randomBytes } from "crypto";
import { upgrades } from "hardhat";

import type {
  WTAO,
  DepositTracker,
  WeightsV2,
  EvmValidator,
  MockMetagraph,
  MockNeuron,
} from "../typechain-types";

//predicate for chai.emit.withArgs()
function gtZero(value: bigint): boolean {
  return value > 0;
}

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
    const WTAOFactory = await ethers.getContractFactory("WTAO");
    const wtao = (await WTAOFactory.deploy()) as unknown as WTAO;

    // Deploy DepositTracker
    const DepositTrackerFactory = await ethers.getContractFactory(
      "DepositTracker"
    );
    const depositTracker =
      (await DepositTrackerFactory.deploy()) as unknown as DepositTracker;

    // Deploy MockMetagraph
    const metagraph = (await mockMetagraph()) as unknown as MockMetagraph;
    await metagraph.setHotkey(
      netuid,
      0,
      ethers.encodeBytes32String(sn_sudo_pk)
    );

    // Deploy MockNeuron
    const neuron = (await mockNeuron()) as unknown as MockNeuron;

    // Deploy WeightsV2
    const WeightsFactory = await ethers.getContractFactory("WeightsV2");
    const weights = (await WeightsFactory.deploy(
      netuid,
      await depositTracker.getAddress(),
      await metagraph.getAddress(),
      await wtao.getAddress()
    )) as unknown as WeightsV2;

    await weights.setDepositGoal(ethers.parseEther("1000"));

    // Deploy EvmValidator
    const EvmValidatorFactory = await ethers.getContractFactory("EvmValidator");
    const evmValidator = (await upgrades.deployProxy(
      EvmValidatorFactory,
      [netuid, await weights.getAddress()],
      {
        initializer: "initialize",
      }
    )) as unknown as EvmValidator;

    // Get signers
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
        owner,
      } = await loadFixture(deployFixture);

      // Fund contract
      await owner.sendTransaction({
        to: evmValidator.getAddress(),
        value: ethers.parseEther("10"),
      });

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

    it("should pay bounty and refund gas for running setWeights", async function () {
      const {
        evmValidator,
        depositTracker,
        addr1,
        owner,
        metagraph,
        wtao,
        weights,
        neuron,
      } = await loadFixture(deployFixture);

      // Fund contract
      await owner.sendTransaction({
        to: evmValidator.getAddress(),
        value: ethers.parseEther("10"),
      });

      const bounty = ethers.parseEther("0");
      await evmValidator.connect(owner).setSetWeightsBounty(bounty);

      const [miner1, miner2] = [randomBytes(32), randomBytes(32)];
      await metagraph.setHotkey(netuid, 1, miner1);
      await metagraph.setHotkey(netuid, 2, miner2);

      await depositTracker.connect(addr1).associate(miner1);
      await wtao.connect(addr1).deposit({ value: ethers.parseEther("1") });

      // Fund addr1 for gas
      await owner.sendTransaction({
        to: addr1.address,
        value: ethers.parseEther("1"),
      });

      const balanceBefore = await ethers.provider.getBalance(addr1.address);

      await expect(
        evmValidator
          .connect(addr1)
          .setWeights(ethers.encodeBytes32String("0x0"))
      )
        .to.emit(evmValidator, "BountyPaid")
        .withArgs(addr1.address, gtZero, gtZero, gtZero);

      const balanceAfter = await ethers.provider.getBalance(addr1.address);

      // because evmValidator pays bounty and refunds gas, we expect
      // the balance to increase by the bounty
      const expectedDiff = bounty;

      expect(balanceAfter - balanceBefore).to.be.approximately(
        expectedDiff,
        ethers.parseEther("0.0001") // tighter margin for accuracy
      );

      let setWeights = await neuron.getLastSetWeights();

      // weights should match
      let normalizedWeights = await weights.getNormalizedWeights();
      expect(setWeights[0]).to.equal(netuid);
      expect(setWeights[1]).to.deep.equal(normalizedWeights[0]);
      expect(setWeights[2]).to.deep.equal(normalizedWeights[1]);
      expect(setWeights[3]).to.equal(version_key);
    });

    it("should revert if contract balance is insufficient for refund", async function () {
      const { evmValidator, addr1 } = await loadFixture(deployFixture);

      await expect(
        evmValidator
          .connect(addr1)
          .setWeights(ethers.encodeBytes32String("0x0"))
      ).to.be.revertedWith("Insufficient balance, contact the owner");
    });

    it("should boost weights for running setWeights", async function () {
      const {
        evmValidator,
        depositTracker,
        addr1,
        owner,
        metagraph,
        wtao,
        weights,
        neuron,
      } = await loadFixture(deployFixture);

      // Fund contract
      await owner.sendTransaction({
        to: evmValidator.getAddress(),
        value: ethers.parseEther("10"),
      });

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

    it("should enforce block interval for miners", async function () {
      const { evmValidator, addr1, owner } = await loadFixture(deployFixture);

      // Fund contract
      await owner.sendTransaction({
        to: evmValidator.getAddress(),
        value: ethers.parseEther("10"),
      });

      const weight_block_interval = 250;
      await evmValidator
        .connect(owner)
        .setSetWeightsBlockInterval(weight_block_interval);

      await expect(
        evmValidator
          .connect(addr1)
          .setWeights(ethers.encodeBytes32String("0x0"))
      ).to.be.revertedWith("Weight set interval has not passed");

      await mine(weight_block_interval + 1);

      await expect(evmValidator.setWeights(ethers.encodeBytes32String("0x0")))
        .to.not.be.reverted;
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

      // Fund contract
      await owner.sendTransaction({
        to: evmValidator.getAddress(),
        value: ethers.parseEther("10"),
      });

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

  describe("Upgradability", function () {
    it("should upgrade EvmValidator and preserve state", async function () {
      const { evmValidator, owner } = await loadFixture(deployFixture);

      // Set a value in the original contract
      await evmValidator
        .connect(owner)
        .setSetWeightsBounty(ethers.parseEther("1"));
      expect(await evmValidator.setWeightsBounty()).to.equal(
        ethers.parseEther("1")
      );

      // Deploy a new version of the contract
      const EvmValidatorV2 = await ethers.getContractFactory("EvmValidatorV2");
      // Upgrade the proxy to the new implementation
      const upgraded = await upgrades.upgradeProxy(
        await evmValidator.getAddress(),
        EvmValidatorV2
      );

      // Check that the state is preserved
      expect(await upgraded.setWeightsBounty()).to.equal(
        ethers.parseEther("1")
      );

      // Check new functionality (assume V2 adds a function called newFunction)
      expect(await upgraded.newFunction()).to.equal("V2 works!");
    });
  });
});
