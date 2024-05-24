import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroAddress, parseUnits } from "ethers";

const tx_options = {gasLimit:28500000, gasPrice: 50000000000};

describe("test MigrateToken", function () {
  async function deployMigrateToken() {
      const [owner, user] = await ethers.getSigners();

      const migrateToken_CF = await ethers.getContractFactory("MigrateToken");
      const migrateTokenImplementation = await migrateToken_CF.deploy();

      const testToken_CF = await ethers.getContractFactory("TestToken");
      const oldToken = await testToken_CF.deploy("OldToken", "OLD", 8, tx_options);
      const newToken = await testToken_CF.deploy("NewToken", "NEW", 18, tx_options);

      return { migrateToken_CF, migrateTokenImplementation, owner, user, oldToken, newToken };
  }

  async function getCloneFromTx(tx: any, contract: any) {
      var tx_receipt = await tx.wait();
      if (tx_receipt.status != 1) {
         console.log('Failed cloning %s', JSON.stringify(tx_receipt));
      }
      const events = await contract.queryFilter(contract.filters.Cloned, -1);
      return events[0].args[0];
  }

  async function getClone() {
      const { migrateToken_CF, migrateTokenImplementation, owner, user, oldToken, newToken } = await loadFixture(deployMigrateToken);

      const newInstanceAddress = await getCloneFromTx(await migrateTokenImplementation.connect(owner).getClone(), migrateTokenImplementation);
      const migrateToken = await migrateToken_CF.attach(newInstanceAddress);
      return { migrateToken, owner, user, oldToken, newToken };
  }

  describe("Deployment", function () {

    it("Should be able to clone correctly", async function () {
        const { migrateTokenImplementation, owner } = await loadFixture(deployMigrateToken);

        const newInstanceAddress = await getCloneFromTx(await migrateTokenImplementation.connect(owner).getClone(), migrateTokenImplementation);
        
        expect(newInstanceAddress)
            .to.not.equal(ZeroAddress);
        expect(newInstanceAddress)
            .to.not.equal(await migrateTokenImplementation.getAddress());
        expect(owner)
            .to.equal(await owner.getAddress());
    });

    it("Should fail to initialize by non-owner", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await expect(migrateToken.connect(user).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWith("ERR_OWNER");
    });

    it("Should fail to initialize when old token address is zero", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = ZeroAddress;
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await expect(migrateToken.connect(owner).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "MissingOldToken");
    });

    it("Should fail to initialize when new token address is zero", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = ZeroAddress;
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await expect(migrateToken.connect(owner).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "MissingNewToken");
    });

    it("Should fail to initialize when conversion ratio is zero", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await expect(migrateToken.connect(owner).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "MissingConversionRatio");
    });

    it("Should fail to initialize when burn address is zero", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = false;
        const newTokenMintable = true;
        const burnAddress = ZeroAddress;

        await expect(migrateToken.connect(owner).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "MissingBurnAddress");
    });

    it("Should be able to initialize correctly", async function () {
        const { migrateToken, owner, oldToken, newToken } = await getClone();
        expect(await migrateToken.owner()).to.equal(owner.address);

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(owner).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);

        expect(await migrateToken.oldToken())
            .to.equal(oldTokenAddress);
        expect(await migrateToken.newToken())
            .to.equal(newTokenAddress);
        expect(await migrateToken.conversionRatio())
            .to.equal(conversionRatio);
        expect(await migrateToken.isOldTokenBurnable())
            .to.equal(oldTokenBurnable);
        expect(await migrateToken.isNewTokenMintable())
            .to.equal(newTokenMintable);
        expect(await migrateToken.burnAddress())
            .to.equal(burnAddress);
    });


    it("Should fail to re-initialize when already initialized", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(owner).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);

        await expect(migrateToken.connect(owner).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "AlreadyInitialized");
    });

    it("Should migrate tokens correctly when old token is burnable and new token is mintable", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(owner).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(owner).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);
                                                     
        const tokensToMigrate = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await migrateToken.connect(user).migrateTokens(tokensToMigrate);

        const expectedOldUserTokens = parseUnits("900", await oldToken.decimals())
        expect(await oldToken.balanceOf(user.address))
            .to.equal(expectedOldUserTokens);
        const expectedNewUserTokens = parseUnits("40", await newToken.decimals())
        expect(await newToken.balanceOf(user.address))
            .to.equal(expectedNewUserTokens);
    });

    it("Should migrate tokens correctly when old token is not burnable and new token is mintable", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(owner).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = false;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(owner).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);
                                                     
        const tokensToMigrate = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await migrateToken.connect(user).migrateTokens(tokensToMigrate);

        const expectedBurnedTokens = parseUnits("100", await oldToken.decimals())
        expect(await oldToken.balanceOf(burnAddress))
            .to.equal(expectedBurnedTokens);
        const expectedOldUserTokens = parseUnits("900", await oldToken.decimals())
        expect(await oldToken.balanceOf(user.address))
            .to.equal(expectedOldUserTokens);
        const expectedNewUserTokens = parseUnits("40", await newToken.decimals())
        expect(await newToken.balanceOf(user.address))
            .to.equal(expectedNewUserTokens);
    });

    it("Should migrate tokens correctly when old token is not burnable and new token is not mintable", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(owner).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("1000", await newToken.decimals());
        await newToken.connect(owner).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = false;
        const newTokenMintable = false;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(owner).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);
                                                     
        const tokensToMigrate = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await migrateToken.connect(user).migrateTokens(tokensToMigrate);

        const expectedBurnedTokens = parseUnits("100", await oldToken.decimals())
        expect(await oldToken.balanceOf(burnAddress))
            .to.equal(expectedBurnedTokens);
        const expectedOldUserTokens = parseUnits("900", await oldToken.decimals())
        expect(await oldToken.balanceOf(user.address))
            .to.equal(expectedOldUserTokens);
        const expectedNewUserTokens = parseUnits("40", await newToken.decimals())
        expect(await newToken.balanceOf(user.address))
            .to.equal(expectedNewUserTokens);
    });

    it("Should not allow to migrate tokens when not initialized correctly", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(owner).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("1000", await newToken.decimals());
        await newToken.connect(owner).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        const tokensToMigrate = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await expect(migrateToken.connect(user).migrateAllTokens())
            .to.be.revertedWithCustomError(migrateToken, "NotInitialized");
    });

    it("Should be able to migrate all tokens in wallet correctly", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(owner).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(owner).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);
                                                     
        const tokensToMigrate = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await migrateToken.connect(user).migrateAllTokens();

        const expectedOldUserTokens = parseUnits("0", await oldToken.decimals())
        expect(await oldToken.balanceOf(user.address))
            .to.equal(expectedOldUserTokens);
        const expectedNewUserTokens = parseUnits("400", await newToken.decimals())
        expect(await newToken.balanceOf(user.address))
            .to.equal(expectedNewUserTokens);
    });

    it("Should not be able to migrate tokens in wallet when not enough allowance", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(owner).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(owner).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);
                                                     
        const tokenAllowance = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokenAllowance);
        await expect(migrateToken.connect(user).migrateAllTokens())
            .to.be.revertedWithCustomError(migrateToken, "MissingAllowance")
                                               .withArgs(oldTokenAddress, tokenAllowance, oldTokensToMint);
    });

    it("Should not be able to migrate tokens in wallet when not enough balance in user wallet", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(owner).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(owner).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);
                                                     
        const tokensToMigrate = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await expect(migrateToken.connect(user).migrateTokens(tokensToMigrate))
            .to.be.revertedWithCustomError(migrateToken, "NotEnoughBalance")
                                               .withArgs(oldTokenAddress, oldTokensToMint, tokensToMigrate, user.address);
    });

    it("Should not be able to migrate tokens in wallet when not enough balance in migration contract", async function () {
        const { migrateToken, owner, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(owner).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("100", await newToken.decimals());
        await newToken.connect(owner).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = false;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(owner).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);
                                                     
        const tokensToMigrate = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        const expectedTokensAfterMigration = parseUnits("400", await newToken.decimals())
        await expect(migrateToken.connect(user).migrateTokens(tokensToMigrate))        
            .to.be.revertedWithCustomError(migrateToken, "NotEnoughBalance")
                                               .withArgs(newTokenAddress, newTokensToMint, expectedTokensAfterMigration, migrateTokenAddress);
    });

  });

});
