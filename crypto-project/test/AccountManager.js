// const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
import {expect} from 'chai';
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import {anyValue} from "@nomicfoundation/hardhat-chai-matchers/withArgs.js";


  describe("AccountManager", function() {

    async function deployContract() {

        const [manager, owner, client] = await ethers.getSigners();
        const USDC = await ethers.getContractFactory("USDC");
        const usdc = await USDC.deploy();
        const TraidingAccount = await ethers.getContractFactory("TraidingAccount");
        const usdcAddress = await usdc.getAddress();
        const traidingAccount = await TraidingAccount.deploy(usdcAddress);
        const traidingAccAddress = await traidingAccount.getAddress();
        const fundrisingStopTime = 24*60*60;
        const timeForTraiding = 30*24*60*60;
        const AccountManager = await ethers.getContractFactory("AccountManager");
        const accountManager = await AccountManager.connect(owner).deploy(usdcAddress, traidingAccAddress);
        await usdc.transfer(client.address, 1_000_000e6);
        return {accountManager, manager, usdc, client, traidingAccount, fundrisingStopTime, owner, timeForTraiding};
    }
    
    describe("Functions", function() {
        it("Should create an account", async function () {
            const {accountManager, client, fundrisingStopTime, timeForTraiding} = await loadFixture(deployContract);
            
            const creationOfAcc = accountManager.connect(client).createAccount(fundrisingStopTime, timeForTraiding);
            const tx = await creationOfAcc;

            const receipt = await tx.wait();
            const lpAddress = receipt.logs[0].args.lp;
            
            expect(await accountManager.getIsValid(lpAddress)).to.be.true;
            await expect(creationOfAcc)
                    .to.emit(accountManager, 'LPCreated')
                    .withArgs(anyValue, client.address);
        });

        it("Should revert if not the owner called functions", async function () {
            const {accountManager, manager, owner, usdc, traidingAccount} = await loadFixture(deployContract);            
            const contractOwner = await accountManager.owner();
            expect(contractOwner).to.equal(owner.address);

            await expect(accountManager.connect(manager).setUSDC(usdc)).to.be.reverted;
            await expect(accountManager.connect(owner).setUSDC(usdc)).not.to.be.reverted;

            await expect(accountManager.connect(manager).setTraidingAccount(traidingAccount)).to.be.reverted;
            await expect(accountManager.connect(owner).setTraidingAccount(traidingAccount)).not.to.be.reverted;

        });

    });
});