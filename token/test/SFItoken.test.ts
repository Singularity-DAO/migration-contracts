import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroAddress, parseUnits, id } from "ethers";
  
describe('test SFItoken', function() {
    var deployer, user, pauser, bridge;
    var sfiToken;

    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINTER_ROLE = id("MINTER_ROLE");
    const PAUSE_ROLE = id("PAUSE_ROLE");
    
    before(async () => {
        [deployer, user, pauser, bridge] = await ethers.getSigners();
        const sfiToken_CF = await ethers.getContractFactory("SFItoken");
        sfiToken = await sfiToken_CF.deploy();
    });
    
    it("Initial Deployment Configuration - verify Initial Supply, Decimals", async function () {
        const expectedInitialTotalSupply = 0;
        const expectedDecimals = 18;

        const totalSupply = await sfiToken.totalSupply();
        const decimals = await sfiToken.decimals();

        expect(totalSupply)
            .to.equal(expectedInitialTotalSupply);
        expect(decimals)
            .to.equal(expectedDecimals);

        expect(await sfiToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address))
            .to.be.true;
        expect(await sfiToken.hasRole(MINTER_ROLE, deployer.address))
            .to.be.true;
        expect(await sfiToken.hasRole(PAUSE_ROLE, deployer.address))
            .to.be.true;
    });

    it("Mint - verify total supply and balance", async function () {
        const amountToMint = parseUnits("100", 18);
        const recipient = bridge.address;
        
        const totalSupplyBefore = await sfiToken.totalSupply()
        const recipientBalanceBefore = await sfiToken.balanceOf(recipient);
        const expectedTotalSupply = totalSupplyBefore + amountToMint;
        const expectedRecipientBalance = recipientBalanceBefore + amountToMint;

        await sfiToken.connect(deployer).mint(recipient, amountToMint)

        const totalSupplyAfter = await sfiToken.totalSupply();
        const recipientBalanceAfter = await sfiToken.balanceOf(recipient);

        expect(totalSupplyAfter)
            .to.equal(expectedTotalSupply);
        expect(recipientBalanceAfter)
            .to.equal(expectedRecipientBalance);
    });

    it("Burn - verify total supply and balance", async function () {
        const amountToBurn = parseUnits("100", 18);
        const burner = bridge;
        
        const totalSupplyBefore = await sfiToken.totalSupply()
        const burnerBalanceBefore = await sfiToken.balanceOf(burner.address);
        const expectedTotalSupply = totalSupplyBefore -amountToBurn;
        const expectedBurnerBalance = burnerBalanceBefore - amountToBurn;

        await sfiToken.connect(burner).burn(amountToBurn)

        const totalSupplyAfter = await sfiToken.totalSupply();
        const burnerBalanceAfter = await sfiToken.balanceOf(burner.address);

        expect(totalSupplyAfter)
            .to.equal(expectedTotalSupply);
        expect(burnerBalanceAfter)
            .to.equal(expectedBurnerBalance);
    });

    it("Assign Minter Role to bridge and verify that role can be revoked", async function() {
        const minter = bridge;
        await sfiToken.connect(deployer).grantRole(MINTER_ROLE, minter.address);

        const amountToMint = parseUnits("100", 18);
        const recipient = user.address;
        await sfiToken.connect(minter).mint(recipient, amountToMint);
        
        await sfiToken.connect(deployer).revokeRole(MINTER_ROLE, minter.address);
        await expect(sfiToken.connect(user).mint(recipient, amountToMint))
            .to.be.revertedWithCustomError(sfiToken, "AccessControlUnauthorizedAccount");
    });

    it("Grant pause role to pauser", async function () {
        expect(await sfiToken.hasRole(PAUSE_ROLE, pauser.address))
            .to.be.false;

        await sfiToken.connect(deployer).grantRole(PAUSE_ROLE, pauser.address);

        expect(await sfiToken.hasRole(PAUSE_ROLE, pauser.address))
            .to.be.true;
    });

    it("Only pause role should be able to pause", async function () {
        await expect(sfiToken.connect(user).pause())
            .to.be.revertedWithCustomError(sfiToken, "AccessControlUnauthorizedAccount");
    });

    it("Only pause role should be able to unpause", async function () {
        await expect(sfiToken.connect(user).unpause())
            .to.be.revertedWithCustomError(sfiToken, "AccessControlUnauthorizedAccount");
    });

    it("Should be able to pause and unpause minting", async function () {
        const amountToMint = parseUnits("100", 18);
        const recipient = bridge.address;

        const totalSupplyBefore = await sfiToken.totalSupply()
        const recipientBalanceBefore = await sfiToken.balanceOf(recipient);
        const expectedTotalSupply = totalSupplyBefore + amountToMint;
        const expectedRecipientBalance = recipientBalanceBefore + amountToMint;

        await sfiToken.connect(pauser).pause();
        await expect(sfiToken.connect(deployer).mint(recipient, amountToMint))
            .to.be.revertedWithCustomError(sfiToken, "EnforcedPause");

        await sfiToken.connect(pauser).unpause();
        await expect(sfiToken.connect(deployer).mint(recipient, amountToMint))
            .not.to.be.revertedWithCustomError(sfiToken, "EnforcedPause");
    });

});
