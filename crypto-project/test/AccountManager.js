const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");



  describe("AccountManager", function() {

    async function deployContract() {

        const [owner, manager, client] = await ethers.getSigners();
        const USDC = await ethers.getContractFactory("USDC");
        const usdc = await USDC.deploy();
        const TraidingAccount = await ethers.getContractFactory("TraidingAccount");
        const usdcAddress = await usdc.getAddress();
        const traidingAccount = await TraidingAccount.deploy(usdcAddress);
        const traidingAccAddress = await traidingAccount.getAddress();
        const traidingTime = 24*60*60;
        const AccountManager = await ethers.getContractFactory("AccountManager");
        const accountManager = await AccountManager.deploy(usdcAddress, traidingAccAddress, {from: owner});
        await usdc.transfer(client.address, 1_000_000e6);
        return {accountManager, manager, usdc, client, traidingAccount, traidingTime, owner};
    }
    
    describe("Deployment", function() {
        it("Should create an account", async function () {
            const {accountManager, client, traidingTime} = await loadFixture(deployContract);
            
            const creationOfAcc = accountManager.connect(client).createAccount(traidingTime)
            const tx = await creationOfAcc;

            const receipt = await tx.wait()
            // console.log(receipt.logs[0].args);
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