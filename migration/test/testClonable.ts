import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";

const tx_options = {gasLimit:28500000, gasPrice: 50000000000};

const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("test Clonable", function () {
  async function deployClonable() {
      const [defaultAdmin, user] = await ethers.getSigners();

      const clonable_CF = await ethers.getContractFactory("Clonable");
      const clonableImplementation = await clonable_CF.deploy();

      return { clonable_CF, clonableImplementation, defaultAdmin, user };
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
      const { clonable_CF, clonableImplementation, defaultAdmin, user } = await loadFixture(deployClonable);

      const newInstanceAddress = await getCloneFromTx(await clonableImplementation.connect(defaultAdmin).getClone(), clonableImplementation);
      const clonable = await clonable_CF.attach(newInstanceAddress);
      return { clonable, defaultAdmin, user };
  }

  describe("Deployment", function () {

    it("Implementation Should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
        const { clonableImplementation, defaultAdmin } = await loadFixture(deployClonable);
        expect(await clonableImplementation.hasRole(DEFAULT_ADMIN_ROLE, defaultAdmin)).to.be.true;
    });

    it("Should be able to clone correctly and have DEFAULT_ADMIN_ROLE on cloned instance", async function () {
        const { clonable_CF, clonableImplementation, defaultAdmin } = await loadFixture(deployClonable);

        const newInstanceAddress = await getCloneFromTx(await clonableImplementation.connect(defaultAdmin).getClone(), clonableImplementation);
        
        expect(newInstanceAddress)
            .to.not.equal(ZeroAddress);
        expect(newInstanceAddress)
            .to.not.equal(await clonableImplementation.getAddress());

        const clonable = await clonable_CF.attach(newInstanceAddress);
        expect(await clonable.hasRole(DEFAULT_ADMIN_ROLE, defaultAdmin)).to.be.true;
    });

    it("Should not be able to call setDefaultAdmin after clone", async () => {
        const { clonable, defaultAdmin, user } = await getClone();
        await expect(clonable.connect(defaultAdmin).setDefaultAdmin(user.address))
            .to.be.revertedWithCustomError(clonable, "AlreadyInitializedRBAC");
    });

  });

});
