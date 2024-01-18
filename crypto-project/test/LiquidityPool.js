import {expect} from 'chai';
import {time, loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

describe("LiquidityPool", function() {

    async function deployContract() {
        const [manager, client, clientTmp] = await ethers.getSigners();
        const USDC = await ethers.getContractFactory("USDC");
        const usdc = await USDC.deploy();
        const TraidingAccount = await ethers.getContractFactory("TraidingAccount");
        const usdcAddress = await usdc.getAddress();
        const traidingAccount = await TraidingAccount.deploy(usdcAddress);
        const traidingAccAddress = await traidingAccount.getAddress();
        const fundrisingStopTime = 24*60*60;
        const timeForTraiding = 30*24*60*60;
        await usdc.transfer(client.address, 1_000_000e6);
        await usdc.transfer(clientTmp.address, 1_000_000e6);

        const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
        const liquidityPool = await LiquidityPool.deploy(manager.address, usdcAddress, 
                                          fundrisingStopTime, timeForTraiding, traidingAccAddress);

        return {liquidityPool, manager, usdc, client, clientTmp, traidingAccount, fundrisingStopTime, timeForTraiding};
    }

    describe("Deployment", function() {
        it("Should set the right manager", async function () {
            const {liquidityPool, manager} = await loadFixture(deployContract);
            expect(await liquidityPool.managerAddress()).to.equal(manager.address);
        });
    });
    
    describe("Functions", function() {
        describe("Transfers", function() {

            it("Should transfer tokens to the LP", async function () {
                const {liquidityPool, client, usdc} = await loadFixture(deployContract);
                const amountToken = 100n;
                await usdc.connect(client).approve(await liquidityPool.getAddress(), amountToken);
                const clientBalance = await usdc.balanceOf(client.address);
                const lpBalance = await usdc.balanceOf(await liquidityPool.getAddress());

                const callProvide = await liquidityPool.connect(client).provide(amountToken);
                
                await expect(callProvide)
                    .to.emit(liquidityPool, 'ownerProvidedToken')
                    .withArgs(client.address, 100n);

                expect(amountToken).to.equal(await liquidityPool.getOwnerTokenCount(client.address));
                expect(clientBalance - BigInt(amountToken)).to.equal(await usdc.balanceOf(client.address));
                expect(lpBalance + BigInt(amountToken)).to.equal(await usdc.balanceOf(await liquidityPool.getAddress()));
            });

            it("Should transfer tokens to the client", async function () {
                const {liquidityPool, client, clientTmp, usdc, fundrisingStopTime, timeForTraiding} = await loadFixture(deployContract);
                const amountToken =  1000000n;

                await usdc.connect(client).approve(await liquidityPool.getAddress(), amountToken);
                await liquidityPool.connect(client).provide(amountToken);
                await usdc.transfer(await liquidityPool.getAddress(), 2n*amountToken);

                await usdc.connect(clientTmp).approve(await liquidityPool.getAddress(), 2n*amountToken);
                await liquidityPool.connect(clientTmp).provide(2n*amountToken);
                await usdc.transfer(await liquidityPool.getAddress(), 3n*amountToken);

                const clientBalance = await usdc.balanceOf(client.address);
                const clientTmpBalance = await usdc.balanceOf(clientTmp.address);
                const clientTokens = await liquidityPool.getOwnerTokenCount(client.address);
                const clientTmpTokens = await liquidityPool.getOwnerTokenCount(clientTmp.address);

                await time.increaseTo(await time.latest() + fundrisingStopTime + timeForTraiding);
                await liquidityPool.closeTraiding();

                const lpBalance = await usdc.balanceOf(await liquidityPool.getAddress());
                const amountLPToken = lpBalance * clientTokens / await liquidityPool.getBalance();
                const callWithdraw = await liquidityPool.connect(client).withdraw();

                await expect(callWithdraw)
                    .to.emit(liquidityPool, 'ownerWithDrawToken')
                    .withArgs(client.address, amountLPToken);

                expect(await liquidityPool.getOwnerTokenCount(client.address)).to.equal(0);
                expect(await usdc.balanceOf(client.address)).to.equal(clientBalance + amountLPToken);
                expect(await usdc.balanceOf(await liquidityPool.getAddress())).to.equal(lpBalance - amountLPToken);

                ///////////////
                const amountLPTokenTmp = lpBalance * clientTmpTokens / await liquidityPool.getBalance();
                const callWithdrawTmp = await liquidityPool.connect(clientTmp).withdraw();

                await expect(callWithdrawTmp)
                    .to.emit(liquidityPool, 'ownerWithDrawToken')
                    .withArgs(clientTmp.address, amountLPTokenTmp);

                expect(await liquidityPool.getOwnerTokenCount(clientTmp.address)).to.equal(0);
                expect(await usdc.balanceOf(clientTmp.address)).to.equal(clientTmpBalance + amountLPTokenTmp);
                expect(await usdc.balanceOf(await liquidityPool.getAddress())).to.equal(lpBalance - amountLPToken - amountLPTokenTmp);
            });
        });

        describe("The traiding's state", function() {

            it("Should start the traiding", async function () {
                const {liquidityPool, fundrisingStopTime} = await loadFixture(deployContract);
                await time.increaseTo(await time.latest() + fundrisingStopTime);
                await liquidityPool.startTraiding();
                expect(await liquidityPool.getCanTraiding()).to.be.true;
            });

            it("Should close the traiding correctly", async function() {
                const {liquidityPool, usdc, manager, traidingAccount, fundrisingStopTime, timeForTraiding} = await loadFixture(deployContract);
                const amountToken = 1000000000000n;
                await usdc.transfer(await traidingAccount.getAddress(), amountToken);
                await usdc.connect(manager).approve(await liquidityPool.getAddress(), amountToken);
                await liquidityPool.connect(manager).provide(amountToken);
                await manager.sendTransaction({
                  to: await liquidityPool.getAddress(),
                  value: ethers.parseEther("1.0")
                });

                const lpEthBalance = await ethers.provider.getBalance(await liquidityPool.getAddress());
                const lpBalance = await usdc.balanceOf(await liquidityPool.getAddress());
                const currency = await traidingAccount.getCurrency();
                const formula = currency * lpEthBalance/BigInt(1e12);
                const managerBalance = await usdc.balanceOf(manager.address);
                
                await time.increaseTo(await time.latest() + fundrisingStopTime + timeForTraiding);
                
                await liquidityPool.closeTraiding();
                
                expect(await liquidityPool.getCanTraiding()).to.be.false;
                expect(await ethers.provider.getBalance(await liquidityPool.getAddress())).to.equal(0);
                expect(lpBalance + formula - await liquidityPool.getManagerFee()).to.
                                equal(await usdc.balanceOf(await liquidityPool.getAddress()));
                expect(lpEthBalance).to.equal(await ethers.provider.getBalance(await traidingAccount.getAddress()));
                expect(amountToken - formula).to.equal(await usdc.balanceOf(await traidingAccount.getAddress()));
                expect(await usdc.balanceOf(manager.address)).to.
                                equal(managerBalance + await liquidityPool.getManagerFee());
            });

            it("Should return the right manager fee when LP has gained tokens", async function() {
                const {liquidityPool, usdc, client, manager} = await loadFixture(deployContract);
                const amountToken = 200n;
                await usdc.connect(client).approve(await liquidityPool.getAddress(), amountToken);
                await liquidityPool.connect(client).provide(amountToken);
                await usdc.transfer(await liquidityPool.getAddress(), amountToken/4n);
                const usdcBalance = await usdc.balanceOf((await liquidityPool.getAddress()));
                const managerBalance = await usdc.balanceOf(manager.address);
                
                const callCalculate1 = await liquidityPool.calculateManagerFee();

                await expect(callCalculate1)
                    .to.emit(liquidityPool, 'managerfeeCalculated')
                    .withArgs(manager.address, await liquidityPool.getManagerFee());

                const managerFee = (usdcBalance - await liquidityPool.getBalance()) * 5n /100n
                expect(await liquidityPool.getManagerFee()).to.equal(managerFee);
                expect(await usdc.balanceOf(await liquidityPool.getAddress())).to.equal(usdcBalance - managerFee);
                expect(await usdc.balanceOf(manager.address)).to.equal(managerBalance + managerFee);
            });

            it("Should return the right manager fee when LP has not gained tokens", async function() {
                const {liquidityPool, usdc, client, manager} = await loadFixture(deployContract);
                const amountToken = 200n;
                await usdc.connect(client).approve(await liquidityPool.getAddress(), amountToken);
                await liquidityPool.connect(client).provide(amountToken);
                const usdcBalance = await usdc.balanceOf((await liquidityPool.getAddress()));
                const managerBalance = await usdc.balanceOf(manager.address);

                const callCalculate2 = await liquidityPool.calculateManagerFee();

                await expect(callCalculate2)
                    .to.emit(liquidityPool, 'managerfeeCalculated')
                    .withArgs(manager.address, 0);

                expect(await liquidityPool.getManagerFee()).to.equal(0);
                expect(await usdc.balanceOf(await liquidityPool.getAddress())).to.equal(usdcBalance);
                expect(await usdc.balanceOf(manager.address)).to.equal(managerBalance);
            });
        });


        describe("Swapping", function() {

            it("Should swap USDC to ETH", async function(){
                const {liquidityPool, usdc, traidingAccount, manager, fundrisingStopTime} = await loadFixture(deployContract);
                const amountToken = 100n;
                await usdc.connect(manager).approve(await liquidityPool.getAddress(), amountToken);
                await liquidityPool.connect(manager).provide(amountToken);
                await manager.sendTransaction({
                  to: await traidingAccount.getAddress(),
                  value: ethers.parseEther("1.0")
                });
                const traidingEthBalance = await ethers.provider.getBalance(await traidingAccount.getAddress());
                const lpEthBalance = await ethers.provider.getBalance(await liquidityPool.getAddress());
                const lpUsdcBalance = await usdc.balanceOf(await liquidityPool.getAddress());
                const traidingUsdcBalance = await usdc.balanceOf(await traidingAccount.getAddress());
                const currency = await traidingAccount.getCurrency();
                
                await time.increaseTo(await time.latest() + fundrisingStopTime);
                await liquidityPool.startTraiding();

                await liquidityPool.connect(manager).swapUSDCtoETH(amountToken);
                
                expect(traidingUsdcBalance + amountToken).to.equal( await usdc.balanceOf(await traidingAccount.getAddress()));
                expect(lpUsdcBalance - amountToken).to.equal( await usdc.balanceOf(await liquidityPool.getAddress()));
                expect(traidingEthBalance - amountToken * BigInt(1e12)/currency).to.
                                equal(await ethers.provider.getBalance(await traidingAccount.getAddress()));
                expect(lpEthBalance + amountToken * BigInt(1e12)/currency).to.
                                equal(await ethers.provider.getBalance(await liquidityPool.getAddress()));
            });
            
            it("Should swap ETH to USDC", async function(){
                const {liquidityPool, usdc, traidingAccount, manager, fundrisingStopTime} = await loadFixture(deployContract);
                const amountToken = 1000n;
                await usdc.transfer(await traidingAccount.getAddress(), 1_000_000e6);
                await manager.sendTransaction({
                  to: await liquidityPool.getAddress(),
                  value: ethers.parseEther("1.0")
                });
                const traidingEthBalance = await ethers.provider.getBalance(await traidingAccount.getAddress());
                const lpEthBalance = await ethers.provider.getBalance(await liquidityPool.getAddress());
                const lpUsdcBalance = await usdc.balanceOf(await liquidityPool.getAddress());
                const traidingUsdcBalance = await usdc.balanceOf(await traidingAccount.getAddress());
                const currency = await traidingAccount.getCurrency();
                
                await time.increaseTo(await time.latest() + fundrisingStopTime);
                await liquidityPool.startTraiding();

                await liquidityPool.connect(manager).swapETHtoUSDC(amountToken);
                
                expect(traidingUsdcBalance - currency * amountToken/BigInt(1e12)).to.
                                  equal(await usdc.balanceOf(await traidingAccount.getAddress()));
                expect(lpUsdcBalance + currency * amountToken/BigInt(1e12)).to.
                                  equal(await usdc.balanceOf(await liquidityPool.getAddress()));
                expect(traidingEthBalance + amountToken).to.equal(await ethers.provider.getBalance(await traidingAccount.getAddress()));
                expect(lpEthBalance - amountToken).to.equal(await ethers.provider.getBalance(await liquidityPool.getAddress()));
            });
        });
    });


    describe("Validation", function() {

        it("Should revert with the right error if the traiding can't be started yet", async function () {
            const {liquidityPool, fundrisingStopTime} = await loadFixture(deployContract);
            await expect(liquidityPool.startTraiding()).to.be.revertedWith("echo nelzuy torgovat");
            
            await time.increaseTo(await time.latest() + fundrisingStopTime);
            await expect(liquidityPool.startTraiding()).not.to.be.revertedWith("echo nelzuy torgovat");
        });

        it("Should revert with the right error if the function provide was called too late", async function () {
            const {liquidityPool, fundrisingStopTime, client, usdc} = await loadFixture(deployContract);
            await usdc.connect(client).approve(await liquidityPool.getAddress(), 100);
            await expect(liquidityPool.connect(client).provide(100)).not.to.be.revertedWith("fundrising was finished");
            
            await time.increaseTo(await time.latest() + fundrisingStopTime);
            await expect(liquidityPool.connect(client).provide(100)).to.be.revertedWith("fundrising was finished");
        });

        it("Should revert with the right error if the function withdraw was called too soon", async function () {
            const {liquidityPool, fundrisingStopTime, client, usdc, timeForTraiding} = await loadFixture(deployContract);
            await usdc.connect(client).approve(await liquidityPool.getAddress(), 100);
            await expect(liquidityPool.connect(client).withdraw()).to.be.revertedWith("still phase traiding");
            
            await time.increaseTo(await time.latest() + fundrisingStopTime + timeForTraiding);
            await expect(liquidityPool.connect(client).withdraw()).not.to.be.revertedWith("still phase traiding");
        });

        it("Should revert with the right error if the sender isn't the manager", async function () {
            const {liquidityPool, client, manager} = await loadFixture(deployContract);
            await expect(liquidityPool.connect(client).startTraiding()).to.be.revertedWith("you are not manager");
            await expect(liquidityPool.connect(manager).startTraiding()).not.to.be.revertedWith("you are not manager");
            
            await expect(liquidityPool.connect(client).swapUSDCtoETH(100)).to.be.revertedWith("error usdc to eth");
            await expect(liquidityPool.connect(manager).swapUSDCtoETH(100)).not.to.be.revertedWith("error usdc to eth");
            
            await expect(liquidityPool.connect(client).swapETHtoUSDC(100)).to.be.revertedWith("error eth to usdc");
            await expect(liquidityPool.connect(manager).swapETHtoUSDC(100)).not.to.be.revertedWith("error eth to usdc");
        });

        it("Should revert with the right error if the traiding wasn't started yet", async function () {
            const {liquidityPool, fundrisingStopTime} = await loadFixture(deployContract);
            await expect(liquidityPool.swapUSDCtoETH(100)).to.be.revertedWith("this is not phase traiding");
            await expect(liquidityPool.swapETHtoUSDC(100)).to.be.revertedWith("this is not phase traiding");

            await time.increaseTo(await time.latest() + fundrisingStopTime);
            await liquidityPool.startTraiding();

            await expect(liquidityPool.swapUSDCtoETH(100)).not.to.be.revertedWith("this is not phase traiding");
            await expect(liquidityPool.swapETHtoUSDC(100)).not.to.be.revertedWith("this is not phase traiding");
        });

        it("Should revert with the right error if the traiding can't be closed yet", async function () {
            const {liquidityPool, fundrisingStopTime, timeForTraiding} = await loadFixture(deployContract);
            await expect(liquidityPool.closeTraiding()).to.be.revertedWith("still phase traiding");
            await time.increaseTo(await time.latest() + fundrisingStopTime + timeForTraiding);
            await expect(liquidityPool.closeTraiding()).not.to.be.revertedWith("still phase traiding");
        });
    });
});

