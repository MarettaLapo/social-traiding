// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [owner, manager] = await ethers.getSigners();
  const USDC = await ethers.getContractFactory("USDC");
  const usdc = await USDC.deploy();
  const TraidingAccount = await ethers.getContractFactory("TraidingAccount");
  const usdcAddress = await usdc.getAddress();
  const traidingAccount = await TraidingAccount.deploy(usdcAddress);
  const traidingAccAddress = await traidingAccount.getAddress();
  const AccountManager = await ethers.getContractFactory("AccountManager");
  const accountManager = await AccountManager.connect(owner).deploy(
    usdcAddress,
    traidingAccAddress
  );
  console.log("AccountManager deployed to:", await accountManager.getAddress());
  console.log("USDC deployed to:", usdcAddress);

  // const fundrisingDuration = 24 * 60 * 60;
  // const timeForTraiding = 30 * 24 * 60 * 60;
  // const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  // const liquidityPool = await LiquidityPool.deploy(
  //   manager.address,
  //   usdcAddress,
  //   fundrisingDuration,
  //   timeForTraiding,
  //   traidingAccAddress
  // );
  // console.log("LiquidityPool deployed to:", await liquidityPool.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
