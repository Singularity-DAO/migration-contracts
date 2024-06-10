import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroAddress, parseUnits, id } from "ethers";

const tx_options = {gasLimit:28500000, gasPrice: 50000000000};

const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const PAUSE_ROLE = id("PAUSE_ROLE");

describe("test MigrateToken", function () {
  async function deployMigrateToken() {
      const [defaultAdmin, user, pauser] = await ethers.getSigners();

      const migrateToken_CF = await ethers.getContractFactory("MigrateToken");
      const migrateTokenImplementation = await migrateToken_CF.deploy();

      const testToken_CF = await ethers.getContractFactory("TestToken");
      const oldToken = await testToken_CF.deploy("OldToken", "OLD", 8, tx_options);
      const newToken = await testToken_CF.deploy("NewToken", "NEW", 18, tx_options);

      return { testToken_CF, migrateToken_CF, migrateTokenImplementation, defaultAdmin, user, pauser, oldToken, newToken };
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
      const { testToken_CF, migrateToken_CF, migrateTokenImplementation, defaultAdmin, user, pauser, oldToken, newToken } = await loadFixture(deployMigrateToken);

      const newInstanceAddress = await getCloneFromTx(await migrateTokenImplementation.connect(defaultAdmin).getClone(), migrateTokenImplementation);
      const migrateToken = await migrateToken_CF.attach(newInstanceAddress);
      return { testToken_CF, migrateToken, defaultAdmin, user, pauser, oldToken, newToken };
  }

  describe("Deployment", function () {

    it("Should be able to clone correctly", async function () {
        const { migrateTokenImplementation, defaultAdmin } = await loadFixture(deployMigrateToken);

        const newInstanceAddress = await getCloneFromTx(await migrateTokenImplementation.connect(defaultAdmin).getClone(), migrateTokenImplementation);
        
        expect(newInstanceAddress)
            .to.not.equal(ZeroAddress);
        expect(newInstanceAddress)
            .to.not.equal(await migrateTokenImplementation.getAddress());
        expect(defaultAdmin)
            .to.equal(await defaultAdmin.getAddress());
    });
    

    it("Should fail to initialize without DEFAULT_ADMIN_ROLE", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        const userAddress = user.address.toLowerCase();
        const roleId = DEFAULT_ADMIN_ROLE.toLowerCase();
        const expectedErrorMessage = "AccessControl: account "+userAddress+" is missing role "+roleId;
        await expect(migrateToken.connect(user).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWith(expectedErrorMessage);
    });

    it("Should fail to initialize when old token address is zero", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = ZeroAddress;
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await expect(migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "MissingOldToken");
    });

    it("Should fail to initialize when new token address is zero", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = ZeroAddress;
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await expect(migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "MissingNewToken");
    });

    it("Should fail to initialize when conversion ratio is zero", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await expect(migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "MissingConversionRatio");
    });

    it("Should fail to initialize when burn address is zero", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = false;
        const newTokenMintable = true;
        const burnAddress = ZeroAddress;

        await expect(migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "MissingBurnAddress");
    });

    it("Should be able to initialize correctly", async function () {
        const { migrateToken, defaultAdmin, oldToken, newToken } = await getClone();
        expect(await migrateToken.hasRole(DEFAULT_ADMIN_ROLE, defaultAdmin.address)).to.be.true;

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
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
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);

        await expect(migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress))
            .to.be.revertedWithCustomError(migrateToken, "AlreadyInitialized");
    });

    it("Should be able to assign PAUSE role correctly", async function () {
        const { migrateToken, defaultAdmin, user, pauser, oldToken, newToken } = await getClone();

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);

        const hasRoleBefore = await migrateToken.hasRole(PAUSE_ROLE, pauser.address);
        expect(hasRoleBefore).is.false;
        
        await migrateToken.connect(defaultAdmin).grantRole(PAUSE_ROLE, pauser.address);
        
        const hasRoleAfter = await migrateToken.hasRole(PAUSE_ROLE, pauser.address);
        expect(hasRoleAfter).is.true;
    });

    it("Should fail to pause by user without PAUSE role", async function () {
        const { migrateToken, defaultAdmin, user, pauser, oldToken, newToken } = await getClone();

        const hasRole = await migrateToken.hasRole(PAUSE_ROLE, user.address);
        expect(hasRole).is.false;
        
        const userAddress = user.address.toLowerCase();
        const roleId = PAUSE_ROLE.toLowerCase();
        const expectedErrorMessage = "AccessControl: account "+userAddress+" is missing role "+roleId;
        
        await expect(migrateToken.connect(user).pause())
            .to.be.revertedWith(expectedErrorMessage);
    });

    it("Should fail to unpause by user without PAUSE role", async function () {
        const { migrateToken, defaultAdmin, user, pauser, oldToken, newToken } = await getClone();

        const hasRole = await migrateToken.hasRole(PAUSE_ROLE, user.address);
        expect(hasRole).is.false;
        
        const userAddress = user.address.toLowerCase();
        const roleId = PAUSE_ROLE.toLowerCase();
        const expectedErrorMessage = "AccessControl: account "+userAddress+" is missing role "+roleId;
        
        await expect(migrateToken.connect(user).unpause())
            .to.be.revertedWith(expectedErrorMessage);        
    });

    it("Should fail to migrate tokens when migration contract is paused", async function () {
        const { migrateToken, defaultAdmin, user, pauser, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
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

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);

        await migrateToken.connect(defaultAdmin).grantRole(PAUSE_ROLE, pauser.address);
        await migrateToken.connect(pauser).pause();
        
        const tokensToMigrate = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await expect(migrateToken.connect(user).migrateTokens(tokensToMigrate))
            .to.be.revertedWith("Pausable: paused");
        
        await migrateToken.connect(pauser).unpause();
        await expect(migrateToken.connect(user).migrateTokens(tokensToMigrate))
            .not.to.be.revertedWith("Pausable: paused");
    });

    it("Should revert migration when output amount is zero", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();

        // 1 old token converts to 0.000000000000000001 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.000000000000000001", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = true;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);
                                                     
        const tokensToMigrate = parseUnits("0.1", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await expect(migrateToken.connect(user).migrateTokens(tokensToMigrate))
            .to.be.revertedWithCustomError(migrateToken, "ZeroAmountOut");
    });

    it("Should migrate tokens correctly when old token is burnable and new token is mintable", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
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

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
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
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
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

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
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
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("1000", await newToken.decimals());
        await newToken.connect(defaultAdmin).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = false;
        const newTokenMintable = false;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
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

    it("Should migrate tokens correctly when conversion ratio is 1 (old tokens burnable, new tokens preminted)", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);

        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("1000", await newToken.decimals());
        await newToken.connect(defaultAdmin).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        // 1 old token converts to 1 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("1", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = false;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);

        const tokensToMigrate = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await migrateToken.connect(user).migrateTokens(tokensToMigrate);

        const expectedOldTokensTotalSupply = parseUnits("900", await oldToken.decimals())
        expect(await oldToken.totalSupply())
            .to.equal(expectedOldTokensTotalSupply);
        const expectedOldUserTokens = parseUnits("900", await oldToken.decimals())
        expect(await oldToken.balanceOf(user.address))
            .to.equal(expectedOldUserTokens);
        const expectedNewUserTokens = parseUnits("100", await newToken.decimals())
        expect(await newToken.balanceOf(user.address))
            .to.equal(expectedNewUserTokens);
    });

    it("Should migrate tokens correctly when old token and new token have same amount of decimals (old tokens burnable, new tokens preminted)", async function () {
        const { testToken_CF, migrateToken, defaultAdmin, user, newToken } = await getClone();

        const oldToken = await testToken_CF.deploy("OldToken", "OLD", 18, tx_options);
        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);

        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("1000", await newToken.decimals());
        await newToken.connect(defaultAdmin).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        // 1 old token converts to 0.433226 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.433226", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = false;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress,
                                                     newTokenAddress,
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);

        const tokensToMigrate = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await migrateToken.connect(user).migrateTokens(tokensToMigrate);

        const expectedOldTokensTotalSupply = parseUnits("900", await oldToken.decimals())
        expect(await oldToken.totalSupply())
            .to.equal(expectedOldTokensTotalSupply);
        const expectedOldUserTokens = parseUnits("900", await oldToken.decimals())
        expect(await oldToken.balanceOf(user.address))
            .to.equal(expectedOldUserTokens);
        const expectedNewUserTokens = parseUnits("43.3226", await newToken.decimals())
        expect(await newToken.balanceOf(user.address))
            .to.equal(expectedNewUserTokens);
    });

    it("Should be able to recover preminted tokens in migration contract to facilitate migration for 3rd parties (CEX or bridges)", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();
        
        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("1000", await newToken.decimals());
        await newToken.connect(defaultAdmin).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = false;
        const newTokenMintable = false;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);

        var recoverAmount = parseUnits("100", await newToken.decimals());
        await migrateToken.connect(defaultAdmin).recoverTokens(recoverAmount)
                                                     
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(parseUnits("900", await newToken.decimals()));
        
        recoverAmount = parseUnits("900", await newToken.decimals());
        await migrateToken.connect(defaultAdmin).recoverTokens(recoverAmount)
                                                     
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(parseUnits("0", await newToken.decimals()));
    });

    it("Should not be able to recover preminted tokens in migration contract as a non-admin", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();
        
        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("1000", await newToken.decimals());
        await newToken.connect(defaultAdmin).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = false;
        const newTokenMintable = false;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
                                                     newTokenAddress, 
                                                     conversionRatio,
                                                     oldTokenBurnable,
                                                     newTokenMintable,
                                                     burnAddress);

        var recoverAmount = parseUnits("100", await newToken.decimals());
        const userAddress = user.address.toLowerCase();
        const defaultAdminRoleId = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const expectedErrorMessage = "AccessControl: account "+userAddress+" is missing role "+defaultAdminRoleId;
        await expect(migrateToken.connect(user).recoverTokens(recoverAmount))
            .to.be.revertedWith(expectedErrorMessage);
    });

    it("Should not allow to migrate tokens when not initialized correctly", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("1000", await newToken.decimals());
        await newToken.connect(defaultAdmin).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        const tokensToMigrate = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(user).approve(migrateTokenAddress, tokensToMigrate);
        await expect(migrateToken.connect(user).migrateAllTokens())
            .to.be.revertedWithCustomError(migrateToken, "NotInitialized");
    });

    it("Should be able to migrate all tokens in wallet correctly", async function () {
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
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

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
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
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
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

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
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
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("100", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
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

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
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
        const { migrateToken, defaultAdmin, user, oldToken, newToken } = await getClone();

        const oldTokensToMint = parseUnits("1000", await oldToken.decimals());
        await oldToken.connect(defaultAdmin).mint(user.address, oldTokensToMint, tx_options);
        expect(await oldToken.balanceOf(user.address))
            .to.equal(oldTokensToMint);
        
        const migrateTokenAddress = await migrateToken.getAddress();
        const newTokensToMint = parseUnits("100", await newToken.decimals());
        await newToken.connect(defaultAdmin).mint(migrateTokenAddress, newTokensToMint, tx_options);
        expect(await newToken.balanceOf(migrateTokenAddress))
            .to.equal(newTokensToMint);

        // 1 old token converts to 0.4 new token
        const oldTokenAddress = await oldToken.getAddress();
        const newTokenAddress = await newToken.getAddress();
        const conversionRatio = parseUnits("0.4", await newToken.decimals());
        const oldTokenBurnable = true;
        const newTokenMintable = false;
        const burnAddress = "0x000000000000000000000000000000000000dEaD";

        await migrateToken.connect(defaultAdmin).initialize(oldTokenAddress, 
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
