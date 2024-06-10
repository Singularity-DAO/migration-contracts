const { ethers } = require("hardhat");
const { JsonRpcProvider, parseUnits } = require("ethers");

let provider;
let tx;
let hasRole;

const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"

const OWNER_MULTISIG = process.env.OWNER_MULTISIG;

const MIGRATION_FET_ADDRESS = process.env.MIGRATION_FET_ADDRESS;
const MIGRATION_AGIX_ADDRESS = process.env.MIGRATION_AGIX_ADDRESS;
const MIGRATION_OCEAN_ADDRESS = process.env.MIGRATION_OCEAN_ADDRESS;

const txOptions = {
  // gasLimit: 3e5,
  // maxFeePerGas: ethers.parseUnits("15", "gwei"),
  // maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
};

async function getDeployer() {
  if (!process.env.RPC) {
    console.log("Missing RPC in .env");
    return;
  }
  if (!process.env.PRIVATE_KEY) {
    console.log("Missing PRIVATE_KEY in .env");
    return;
  }
  provider = new JsonRpcProvider(process.env.RPC);
  console.log("Using RPC: %s", process.env.RPC);
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

async function deploy(deployer) {
  const deployerAddress = await deployer.getAddress();
  migrateToken_CF = await ethers.getContractFactory("MigrateToken", deployer);

  console.log("Working on FET Migration Contract: %s", MIGRATION_FET_ADDRESS);

  const fetMigrationContract = await ethers.getContractAt("MigrateToken", MIGRATION_FET_ADDRESS, deployer);

  // grant admin role to OWNER_MULTISIG
  tx = await fetMigrationContract.grantRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG, txOptions);
  await tx.wait();
  
  // check if role was granted
  hasRole = await fetMigrationContract.hasRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG);
  console.log("Granted %s role to %s: %s", DEFAULT_ADMIN_ROLE, OWNER_MULTISIG, hasRole);
  assert(hasRole);

  // revoke admin role from deployer
  tx = await fetMigrationContract.revokeRole(DEFAULT_ADMIN_ROLE, deployerAddress, txOptions);
  await tx.wait();
  hasRole = await fetMigrationContract.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress);
  console.log("Revoked %s role from %s: %s", DEFAULT_ADMIN_ROLE, deployerAddress, hasRole);
  assert(!hasRole);

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  console.log("Working on AGIX Migration Contract: %s", MIGRATION_AGIX_ADDRESS);

  const agixMigrationContract = await ethers.getContractAt("MigrateToken", MIGRATION_AGIX_ADDRESS, deployer);

  // grant admin role to OWNER_MULTISIG
  tx = await agixMigrationContract.grantRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG, txOptions);
  await tx.wait();

  // check if role was granted
  hasRole = await agixMigrationContract.hasRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG);
  console.log("Granted %s role to %s: %s", DEFAULT_ADMIN_ROLE, OWNER_MULTISIG, hasRole);
  assert(hasRole);

  // revoke admin role from deployer
  tx = await agixMigrationContract.revokeRole(DEFAULT_ADMIN_ROLE, deployerAddress, txOptions);
  await tx.wait();
  hasRole = await agixMigrationContract.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress);
  console.log("Revoked %s role from %s: %s", DEFAULT_ADMIN_ROLE, deployerAddress, hasRole);
  assert(!hasRole);

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  console.log("Working on OCEAN Migration Contract: %s", MIGRATION_OCEAN_ADDRESS);

  const oceanMigrationContract = await ethers.getContractAt("MigrateToken", MIGRATION_OCEAN_ADDRESS, deployer);
  
  // grant admin role to OWNER_MULTISIG
  tx = await oceanMigrationContract.grantRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG, txOptions);
  await tx.wait();

  // check if role was granted
  hasRole = await oceanMigrationContract.hasRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG);
  console.log("Granted %s role to %s: %s", DEFAULT_ADMIN_ROLE, OWNER_MULTISIG, hasRole);
  assert(hasRole);

  // revoke admin role from deployer
  tx = await oceanMigrationContract.revokeRole(DEFAULT_ADMIN_ROLE, deployerAddress, txOptions);
  await tx.wait();
  hasRole = await oceanMigrationContract.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress);
  console.log("Revoked %s role from %s: %s", DEFAULT_ADMIN_ROLE, deployerAddress, hasRole);
  assert(!hasRole);
}

const getDeployerAndDeploy = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await deploy(deployer);
};

getDeployerAndDeploy();
