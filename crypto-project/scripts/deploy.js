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
  await accountManager.deployed();
  console.log("AccountManager deployed to:", await accountManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
