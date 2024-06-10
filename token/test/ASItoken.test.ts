import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroAddress, parseUnits, id } from "ethers";
  
describe('test ASItoken', function() {
    var deployer, user, pauser, bridge;
    var asiToken;

    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINTER_ROLE = id("MINTER_ROLE");
    const PAUSE_ROLE = id("PAUSE_ROLE");
    
    before(async () => {
        [deployer, user, pauser, bridge] = await ethers.getSigners();
        const asiToken_CF = await ethers.getContractFactory("ASItoken");
        asiToken = await asiToken_CF.deploy();
    });
    
    it("Initial Deployment Configuration - verify Initial Supply, Decimals", async function () {
        const expectedInitialTotalSupply = 0;
        const expectedDecimals = 18;

        const totalSupply = await asiToken.totalSupply();
        const decimals = await asiToken.decimals();

        expect(totalSupply)
            .to.equal(expectedInitialTotalSupply);
        expect(decimals)
            .to.equal(expectedDecimals);

        expect(await asiToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address))
            .to.be.true;
        expect(await asiToken.hasRole(MINTER_ROLE, deployer.address))
            .to.be.true;
        expect(await asiToken.hasRole(PAUSE_ROLE, deployer.address))
            .to.be.true;
    });

    it("Mint - verify total supply and balance", async function () {
        const amountToMint = parseUnits("100", 18);
        const recipient = bridge.address;
        
        const totalSupplyBefore = await asiToken.totalSupply()
        const recipientBalanceBefore = await asiToken.balanceOf(recipient);
        const expectedTotalSupply = totalSupplyBefore + amountToMint;
        const expectedRecipientBalance = recipientBalanceBefore + amountToMint;

        await asiToken.connect(deployer).mint(recipient, amountToMint)

        const totalSupplyAfter = await asiToken.totalSupply();
        const recipientBalanceAfter = await asiToken.balanceOf(recipient);

        expect(totalSupplyAfter)
            .to.equal(expectedTotalSupply);
        expect(recipientBalanceAfter)
            .to.equal(expectedRecipientBalance);
    });

    it("Burn - verify total supply and balance", async function () {
        const amountToBurn = parseUnits("100", 18);
        const burner = bridge;
        
        const totalSupplyBefore = await asiToken.totalSupply()
        const burnerBalanceBefore = await asiToken.balanceOf(burner.address);
        const expectedTotalSupply = totalSupplyBefore -amountToBurn;
        const expectedBurnerBalance = burnerBalanceBefore - amountToBurn;

        await asiToken.connect(burner).burn(amountToBurn)

        const totalSupplyAfter = await asiToken.totalSupply();
        const burnerBalanceAfter = await asiToken.balanceOf(burner.address);

        expect(totalSupplyAfter)
            .to.equal(expectedTotalSupply);
        expect(burnerBalanceAfter)
            .to.equal(expectedBurnerBalance);
    });

    it("Assign Minter Role to bridge and verify that role can be revoked", async function() {
        const minter = bridge;
        await asiToken.connect(deployer).grantRole(MINTER_ROLE, minter.address);

        const amountToMint = parseUnits("100", 18);
        const recipient = user.address;
        await asiToken.connect(minter).mint(recipient, amountToMint);
        
        await asiToken.connect(deployer).revokeRole(MINTER_ROLE, minter.address);
        await expect(asiToken.connect(user).mint(recipient, amountToMint))
            .to.be.revertedWithCustomError(asiToken, "AccessControlUnauthorizedAccount");
    });

    it("Grant pause role to pauser", async function () {
        expect(await asiToken.hasRole(PAUSE_ROLE, pauser.address))
            .to.be.false;

        await asiToken.connect(deployer).grantRole(PAUSE_ROLE, pauser.address);

        expect(await asiToken.hasRole(PAUSE_ROLE, pauser.address))
            .to.be.true;
    });

    it("Only pause role should be able to pause", async function () {
        await expect(asiToken.connect(user).pause())
            .to.be.revertedWithCustomError(asiToken, "AccessControlUnauthorizedAccount");
    });

    it("Only pause role should be able to unpause", async function () {
        await expect(asiToken.connect(user).unpause())
            .to.be.revertedWithCustomError(asiToken, "AccessControlUnauthorizedAccount");
    });

    it("Should be able to pause and unpause minting", async function () {
        const amountToMint = parseUnits("100", 18);
        const recipient = bridge.address;

        const totalSupplyBefore = await asiToken.totalSupply()
        const recipientBalanceBefore = await asiToken.balanceOf(recipient);
        const expectedTotalSupply = totalSupplyBefore + amountToMint;
        const expectedRecipientBalance = recipientBalanceBefore + amountToMint;

        await asiToken.connect(pauser).pause();
        await expect(asiToken.connect(deployer).mint(recipient, amountToMint))
            .to.be.revertedWithCustomError(asiToken, "EnforcedPause");

        await asiToken.connect(pauser).unpause();
        await expect(asiToken.connect(deployer).mint(recipient, amountToMint))
            .not.to.be.revertedWithCustomError(asiToken, "EnforcedPause");
    });

});
