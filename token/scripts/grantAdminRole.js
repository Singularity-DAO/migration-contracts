const { ethers } = require("hardhat");
const { JsonRpcProvider, parseUnits } = require("ethers");

let provider;
let tx;
let hasRole;


const OWNER_MULTISIG = process.env.OWNER_MULTISIG;

const ETH_ASI = process.env.ETH_ASI;

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

  const asiToken = await ethers.getContractAt("ASItoken", ETH_ASI, deployer);

  // roles
  const DEFAULT_ADMIN_ROLE = await asiToken.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await asiToken.MINTER_ROLE();
  const PAUSE_ROLE = await asiToken.PAUSE_ROLE();

  // grant admin role to OWNER_MULTISIG
  tx = await asiToken.grantRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG, txOptions);
  await tx.wait();

  hasRole = await asiToken.hasRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG);
  console.log("OWNER_MULTISIG has DEFAULT_ADMIN_ROLE: ", hasRole);

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  // grant minter role to OWNER_MULTISIG
  tx = await asiToken.grantRole(MINTER_ROLE, OWNER_MULTISIG, txOptions);
  await tx.wait();

  hasRole = await asiToken.hasRole(MINTER_ROLE, OWNER_MULTISIG);
  console.log("OWNER_MULTISIG has MINTER_ROLE: ", hasRole);

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  // grant pause role to OWNER_MULTISIG
  tx = await asiToken.grantRole(PAUSE_ROLE, OWNER_MULTISIG, txOptions);
  await tx.wait();

  hasRole = await asiToken.hasRole(PAUSE_ROLE, OWNER_MULTISIG);
  console.log("OWNER_MULTISIG has PAUSE_ROLE: ", hasRole);

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  // revoke admin role from deployer
  tx = await asiToken.revokeRole(DEFAULT_ADMIN_ROLE, deployerAddress, txOptions);
  await tx.wait();
  hasRole = await asiToken.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress);  
  console.log("deployer has DEFAULT_ADMIN_ROLE: ", hasRole);
}

const getDeployerAndDeploy = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await deploy(deployer);
};

getDeployerAndDeploy();
