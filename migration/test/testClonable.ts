import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";

const tx_options = {gasLimit:28500000, gasPrice: 50000000000};

describe("test Clonable", function () {
  async function deployClonable() {
      const [owner, user] = await ethers.getSigners();

      const clonable_CF = await ethers.getContractFactory("Clonable");
      const clonableImplementation = await clonable_CF.deploy();

      return { clonable_CF, clonableImplementation, owner, user };
  }

  async function getCloneFromTx(tx: any, contract: any) {
      var tx_receipt = await tx.wait();
      if (tx_receipt.status!=1) {
         console.log('Failed cloning %s', JSON.stringify(tx_receipt));
      }
      const events = await contract.queryFilter(contract.filters.Cloned, -1);
      return events[0].args[0];
  }

  async function getClone() {
      const { clonable_CF, clonableImplementation, owner, user } = await loadFixture(deployClonable);

      const newInstanceAddress = await getCloneFromTx(await clonableImplementation.connect(owner).getClone(), clonableImplementation);
      const clonable = await clonable_CF.attach(newInstanceAddress);
      return { clonable, owner, user };
  }

  describe("Deployment", function () {

    it("Should be able to clone correctly", async function () {
        const { clonableImplementation, owner } = await loadFixture(deployClonable);

        const newInstanceAddress = await getCloneFromTx(await clonableImplementation.connect(owner).getClone(), clonableImplementation);
        
        expect(newInstanceAddress)
            .to.not.equal(ZeroAddress);
        expect(newInstanceAddress)
            .to.not.equal(await clonableImplementation.getAddress());
        expect(owner)
            .to.equal(await owner.getAddress());
    });

    it("Should not be able to change ownership after clone", async () => {
        const { clonable, owner, user } = await getClone();
        await expect(clonable.connect(owner).setOwnerAfterClone(user.address))
            .to.be.revertedWith("ERR_REINIT");
    });

    it("Should not be able to transfer ownership by non-owner", async () => {
        const { clonable, owner, user } = await getClone();
        await expect(clonable.connect(user).transferOwnership(user.address))
            .to.be.revertedWith("ERR_OWNER");
    });

    it("Should not be able to transfer ownership to zero", async () => {
        const { clonable, owner, user } = await getClone();
        await expect(clonable.connect(owner).transferOwnership(ZeroAddress))
            .to.be.revertedWith("ERR_ZERO");
    });

    it("Should be able to transfer ownership by owner", async () => {
        const { clonable, owner, user } = await getClone();
        await clonable.connect(owner).transferOwnership(user.address);
        expect(await clonable.owner())
            .to.be.equal(user.address);
    });

  });

});
