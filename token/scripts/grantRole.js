const { ethers } = require("hardhat");
const { JsonRpcProvider } = require("ethers");
const ASItokenABI = require("../artifacts/contracts/ASItoken.sol/ASItoken.json");

const ETH_ASI = process.env.ETH_ASI;
const AGIX_MIGRATION_CONTRACT = process.env.AGIX_MIGRATION_CONTRACT;
const FET_MIGRATION_CONTRACT = process.env.FET_MIGRATION_CONTRACT;
const OCEAN_MIGRATION_CONTRACT = process.env.OCEAN_MIGRATION_CONTRACT;

async function getDeployer() {
  if (!process.env.RPC) {
    console.log("Missing RPC in .env");
    return;
  }
  if (!process.env.PRIVATE_KEY) {
    console.log("Missing PRIVATE_KEY in .env");
    return;
  }
  const provider = new JsonRpcProvider(process.env.RPC);
  console.log("Using RPC: %s", process.env.RPC);
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

async function grantRole(deployer) {
  ASItoken = new ethers.Contract(ETH_ASI, ASItokenABI.abi, deployer);
  const mintingRole = await ASItoken.MINTER_ROLE();

  let tx;

  tx = await ASItoken.grantRole(mintingRole, AGIX_MIGRATION_CONTRACT);
  await tx.wait();
  console.log("Granted role to %s", AGIX_MIGRATION_CONTRACT);

  tx = await ASItoken.grantRole(mintingRole, FET_MIGRATION_CONTRACT);
  await tx.wait();
  console.log("Granted role to %s", FET_MIGRATION_CONTRACT);

  tx = await ASItoken.grantRole(mintingRole, OCEAN_MIGRATION_CONTRACT);
  await tx.wait();
  console.log("Granted role to %s", OCEAN_MIGRATION_CONTRACT);
}

const getDeployerAndGrantRole = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await grantRole(deployer);
};

getDeployerAndGrantRole();
