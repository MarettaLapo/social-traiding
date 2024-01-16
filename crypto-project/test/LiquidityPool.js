// import {expect} from 'chai';
// import {time, loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

//   describe("LiquidityPool", function() {

//     async function deployContract() {
//         const [manager, client] = await ethers.getSigners();
//         const USDC = await ethers.getContractFactory("USDC");
//         const usdc = await USDC.deploy();
//         const TraidingAccount = await ethers.getContractFactory("TraidingAccount");
//         const usdcAddress = await usdc.getAddress();
//         const traidingAccount = await TraidingAccount.deploy(usdcAddress);
//         const traidingAccAddress = await traidingAccount.getAddress();
//         const fundrisingDuration = 24*60*60;
//         const timeForTraiding = 30*24*60*60;
//         await usdc.transfer(client.address, 1_000_000e6);

//         const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
//         const liquidityPool = await LiquidityPool.deploy(manager.address, usdcAddress, 
//                                           fundrisingDuration, timeForTraiding, traidingAccAddress);

//         return {liquidityPool, manager, usdc, client, traidingAccount, fundrisingDuration, timeForTraiding};
//     }

//     describe("Deployment", function() {
//         it("Should set the right manager", async function () {
//             const {liquidityPool, manager} = await loadFixture(deployContract);
//             expect(await liquidityPool.managerAddress()).to.equal(manager.address);
//         });
//     });
    
//     describe("Functions", function() {
//         describe("Transfers", function() {

//             it("Should transfer tokens to the LP", async function () {
//                 const {liquidityPool, client, usdc} = await loadFixture(deployContract);
//                 const amountToken = 100n;
//                 await usdc.connect(client).approve(await liquidityPool.getAddress(), amountToken);
//                 const clientBalance = await usdc.balanceOf(client.address);
//                 const lpBalance = await usdc.balanceOf(await liquidityPool.getAddress());
//                 await liquidityPool.connect(client).provide(amountToken);
//                 expect(amountToken).to.equal(await liquidityPool.getOwnerTokenCount(client.address));
//                 expect(clientBalance - BigInt(amountToken)).to.equal(await usdc.balanceOf(client.address));
//                 expect(lpBalance + BigInt(amountToken)).to.equal(await usdc.balanceOf(await liquidityPool.getAddress()));
//             });

//             it("Should transfer tokens to the client", async function () {
//                 const {liquidityPool, client, usdc} = await loadFixture(deployContract);
//                 const amountToken = 100n;
//                 for (i=0; i<2; i++){
//                     await usdc.connect(client).approve(await liquidityPool.getAddress(), amountToken);
//                     await liquidityPool.connect(client).provide(amountToken);
//                 }
//                 const clientBalance = await usdc.balanceOf(client.address);
//                 const lpBalance = await usdc.balanceOf(await liquidityPool.getAddress());
//                 await liquidityPool.connect(client).withdraw();
//                 expect(0).to.equal(await liquidityPool.getOwnerTokenCount(client.address));
//                 expect(clientBalance + 2n*amountToken).to.equal(await usdc.balanceOf(client.address));
//                 expect(lpBalance - 2n*amountToken).to.equal(await usdc.balanceOf(await liquidityPool.getAddress()));
//             });
//         });

//         describe("The traiding's state ", function() {

//             it("Should start the traiding", async function () {
//                 const {liquidityPool, fundrisingDuration} = await loadFixture(deployContract);
//                 await time.increaseTo(await time.latest() + fundrisingDuration);
//                 await liquidityPool.startTraiding();
//                 expect(await liquidityPool.getCanTraiding()).to.be.true;
//             });

//             it("Should close the traiding correctly", async function() {
//                 const {liquidityPool, usdc, manager, traidingAccount} = await loadFixture(deployContract);
//                 const amountToken = 1000000000000n;
//                 await usdc.transfer(await traidingAccount.getAddress(), amountToken);
//                 await usdc.connect(manager).approve(await liquidityPool.getAddress(), amountToken);
//                 await liquidityPool.connect(manager).provide(amountToken);
//                 await manager.sendTransaction({
//                   to: await liquidityPool.getAddress(),
//                   value: ethers.parseEther("1.0")
//                 });

//                 const lpEthBalance = await ethers.provider.getBalance(await liquidityPool.getAddress());
//                 const lpBalance = await usdc.balanceOf(await liquidityPool.getAddress());
//                 const formula = 2000n * lpEthBalance/BigInt(1e12);
//                 const managerBalance = await usdc.balanceOf(manager.address);
                
//                 await liquidityPool.closeTraiding();
                
//                 expect(await liquidityPool.getCanTraiding()).to.be.false;
//                 expect(await ethers.provider.getBalance(await liquidityPool.getAddress())).to.equal(0);
//                 expect(lpBalance + formula - await liquidityPool.getManagerFee()).to.
//                                 equal(await usdc.balanceOf(await liquidityPool.getAddress()));
//                 expect(lpEthBalance).to.equal(await ethers.provider.getBalance(await traidingAccount.getAddress()));
//                 expect(amountToken - formula).to.equal(await usdc.balanceOf(await traidingAccount.getAddress()));
//                 expect(await usdc.balanceOf(manager.address)).to.
//                                 equal(managerBalance + await liquidityPool.getManagerFee());
//             });

//             it("Should return the right manager fee", async function() {
//                 const {liquidityPool, usdc, client, manager} = await loadFixture(deployContract);
//                 const amountToken = 200n;
//                 await usdc.connect(client).approve(await liquidityPool.getAddress(), amountToken);
//                 await liquidityPool.connect(client).provide(amountToken);
//                 await usdc.transfer(await liquidityPool.getAddress(), amountToken);
//                 const usdcBalance = await usdc.balanceOf((await liquidityPool.getAddress()));
//                 const managerBalance = await usdc.balanceOf(manager.address);
//                 await liquidityPool.calculateManagerFee();
//                 const managerFee = (usdcBalance - await liquidityPool.getBalance())/100n * 5n
//                 expect(await liquidityPool.getManagerFee()).to.equal(managerFee);
//                 expect(await await usdc.balanceOf((await liquidityPool.getAddress()))).to.equal(usdcBalance - managerFee);
//                 expect(await usdc.balanceOf(manager.address)).to.equal(managerBalance + managerFee);
//                 //
//                 await liquidityPool.connect(client).withdraw();
//                 await liquidityPool.calculateManagerFee();
//                 expect(await liquidityPool.getManagerFee()).to.equal(0);
//             });
//         });

//         describe("Swapping", function() {

//             it("Should swap USDC to ETH", async function(){
//                 const {liquidityPool, usdc, traidingAccount, manager} = await loadFixture(deployContract);
//                 const amountToken = 1n;
//                 await usdc.connect(manager).approve(await liquidityPool.getAddress(), amountToken);
//                 await liquidityPool.connect(manager).provide(amountToken);
//                 await manager.sendTransaction({
//                   to: await traidingAccount.getAddress(),
//                   value: ethers.parseEther("1.0")
//                 });
//                 const traidingEthBalance = await ethers.provider.getBalance(await traidingAccount.getAddress());
//                 const lpEthBalance = await ethers.provider.getBalance(await liquidityPool.getAddress());
//                 const lpUsdcBalance = await usdc.balanceOf(await liquidityPool.getAddress());
//                 const traidingUsdcBalance = await usdc.balanceOf(await traidingAccount.getAddress());
//                 await liquidityPool.connect(manager).swapUSDCtoETH(amountToken);
//                 expect(traidingUsdcBalance + amountToken).to.equal( await usdc.balanceOf(await traidingAccount.getAddress()));
//                 expect(lpUsdcBalance - amountToken).to.equal( await usdc.balanceOf(await liquidityPool.getAddress()));
//                 expect(traidingEthBalance - amountToken * BigInt(1e12)/2000n).to.
//                                 equal(await ethers.provider.getBalance(await traidingAccount.getAddress()));
//                 expect(lpEthBalance + amountToken * BigInt(1e12)/2000n).to.
//                                 equal(await ethers.provider.getBalance(await liquidityPool.getAddress()));
//             });
            
//             it("Should swap ETH to USDC", async function(){
//                 const {liquidityPool, usdc, traidingAccount, manager} = await loadFixture(deployContract);
//                 const amountToken = 1000n;
//                 await usdc.transfer(await traidingAccount.getAddress(), 1_000_000e6);
//                 await manager.sendTransaction({
//                   to: await liquidityPool.getAddress(),
//                   value: ethers.parseEther("1.0")
//                 });
//                 const traidingEthBalance = await ethers.provider.getBalance(await traidingAccount.getAddress());
//                 const lpEthBalance = await ethers.provider.getBalance(await liquidityPool.getAddress());
//                 const lpUsdcBalance = await usdc.balanceOf(await liquidityPool.getAddress());
//                 const traidingUsdcBalance = await usdc.balanceOf(await traidingAccount.getAddress());
//                 await liquidityPool.connect(manager).swapETHtoUSDC(amountToken);
//                 expect(traidingUsdcBalance - 2000n * amountToken/BigInt(1e12)).to.
//                                   equal(await usdc.balanceOf(await traidingAccount.getAddress()));
//                 expect(lpUsdcBalance + 2000n * amountToken/BigInt(1e12)).to.
//                                   equal(await usdc.balanceOf(await liquidityPool.getAddress()));
//                 expect(traidingEthBalance + amountToken).to.equal(await ethers.provider.getBalance(await traidingAccount.getAddress()));
//                 expect(lpEthBalance - amountToken).to.equal(await ethers.provider.getBalance(await liquidityPool.getAddress()));
//             });
//         });
//     });

//         //revertedwith
//         describe("Validation", function() {

//             it("Should validate if the manager's address is not empty", async function () {
//                 const {manager} = await loadFixture(deployContract);
//                 expect(manager.address).not.to.equal(0);
//             });

//             it("Should revert with the right error if the traiding can't be started yet", async function () {
//                 const {liquidityPool, fundrisingDuration} = await loadFixture(deployContract);
//                 await expect(liquidityPool.startTraiding()).to.be.revertedWith("echo nelzuy torgovat");
//                 await time.increaseTo(await time.latest() + fundrisingDuration);
//                 await expect(liquidityPool.startTraiding()).not.to.be.revertedWith("echo nelzuy torgovat");
//             });

//             it("Should revert with the right error if the function provide called too late", async function () {
//                 const {liquidityPool, fundrisingDuration, client, usdc} = await loadFixture(deployContract);
//                 await usdc.connect(client).approve(await liquidityPool.getAddress(), 100);
//                 await expect(liquidityPool.connect(client).provide(100)).not.to.be.revertedWith("fundrising was finished");
//                 await time.increaseTo(await time.latest() + fundrisingDuration);
//                 await expect(liquidityPool.connect(client).provide(100)).to.be.revertedWith("fundrising was finished");
//             });

//             it("Should revert with the right error if the sender isn't the manager", async function () {
//                 const {liquidityPool, client, manager} = await loadFixture(deployContract);
//                 await expect(liquidityPool.connect(client).swapUSDCtoETH(100)).to.be.revertedWith("error usdc to eth");
//                 await expect(liquidityPool.connect(manager).swapUSDCtoETH(100)).not.to.be.revertedWith("error usdc to eth");
//                 await expect(liquidityPool.connect(client).swapETHtoUSDC(100)).to.be.revertedWith("error eth to usdc");
//                 await expect(liquidityPool.connect(manager).swapETHtoUSDC(100)).not.to.be.revertedWith("error eth to usdc");
//             });
//         });
//     });

