import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroAddress, parseUnits } from "ethers";
  
describe('test ASItoken', function() {
    var deployer, user, bridge;
    var asiToken;
    
    before(async () => {
        [deployer, user, bridge] = await ethers.getSigners();
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
        const minterRole = await asiToken.MINTER_ROLE();
        const minter = bridge;
        await asiToken.connect(deployer).grantRole(minterRole, minter.address);

        const amountToMint = parseUnits("100", 18);
        const recipient = user.address;
        await asiToken.connect(minter).mint(recipient, amountToMint);
        
        await asiToken.connect(deployer).revokeRole(minterRole, minter.address);
        await expect(asiToken.connect(user).mint(recipient, amountToMint))
            .to.be.revertedWithCustomError(asiToken, "AccessControlUnauthorizedAccount");
    });
});
