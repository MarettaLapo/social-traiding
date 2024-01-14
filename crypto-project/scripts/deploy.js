// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
// const hre = require("hardhat");
import { ethers } from "hardhat";

async function main() {
//   const currentTimestampInSeconds = Math.round(Date.now() / 1000);
//   const unlockTime = currentTimestampInSeconds + 60;

//   const lockedAmount = hre.ethers.parseEther("0.001");

//   const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
//     value: lockedAmount,
//   });

//   await lock.waitForDeployment();

//   console.log(
//     `Lock with ${ethers.formatEther(
//       lockedAmount
//     )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`
//   );
// }
    const [owner] = await ethers.getSigners();
    const USDC = await ethers.getContractFactory("USDC");
    const usdc = await USDC.deploy();
    const TraidingAccount = await ethers.getContractFactory("TraidingAccount");
    const usdcAddress = await usdc.getAddress();
    const traidingAccount = await TraidingAccount.deploy(usdcAddress);
    const traidingAccAddress = await traidingAccount.getAddress();
    // const traidingTime = 24*60*60;
    const AccountManager = await ethers.getContractFactory("AccountManager");
    const accountManager = await AccountManager.deploy(usdcAddress, traidingAccAddress, {from: owner});
    await accountManager.deployed();
    // await usdc.transfer(client.address, 1_000_000e6);
    console.log("AccountManager deployed to:", await accountManager.getAddress());
  }
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
