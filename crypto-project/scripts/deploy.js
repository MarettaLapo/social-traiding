import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [owner, manager, client] = await ethers.getSigners();
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

  const traidingTime = 24 * 60 * 60;
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(
    manager.address,
    usdcAddress,
    traidingTime,
    traidingAccAddress
  );
  // await usdc.transfer(client.address, 1_000_000e6);
  console.log("LiquidityPool deployed to:", await liquidityPool.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
