import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ethers as eth } from "ethers";

describe("DepositTracker", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTracker() {
    const DepositTracker = await ethers.getContractFactory("DepositTracker");
    const depositTracker = await DepositTracker.deploy();

    return depositTracker;
  }

  describe("Associations", function () {
    it("Should associate a hotkey with an address", async function () {
      const depositTracker = await loadFixture(deployTracker);
      const hotkey = eth.randomBytes(32);
      const [wallet] = await ethers.getSigners();
      const address = wallet.address;
      await depositTracker.associate(hotkey);

      expect(await depositTracker.associationSetLength(hotkey)).to.equal(1);
      expect(await depositTracker.associations(hotkey, 0)).to.equal(address);

      await expect(depositTracker.associate(hotkey)).to.be.revertedWith(
        "Address already associated"
      );
    });

    it("Should associate a hotkey with multiple addresses", async function () {
      const depositTracker = await loadFixture(deployTracker);
      const hotkey = eth.randomBytes(32);
      const [wallet, wallet2] = await ethers.getSigners();
      console.log(wallet.address, wallet2.address);
      await depositTracker.associate(hotkey);

      const tracker2 = await depositTracker.connect(wallet2);
      await tracker2.associate(hotkey);

      expect(await depositTracker.associationSetLength(hotkey)).to.equal(2);
      expect(await depositTracker.associations(hotkey, 0)).to.equal(
        wallet.address
      );
      expect(await depositTracker.associations(hotkey, 1)).to.equal(
        wallet2.address
      );

      await expect(depositTracker.associate(hotkey)).to.be.revertedWith(
        "Address already associated"
      );
    });
  });
});
