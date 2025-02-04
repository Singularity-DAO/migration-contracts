const { ethers } = require("hardhat");
const { JsonRpcProvider, parseUnits } = require("ethers");

let provider;
let tx;
let hasRole;

const OWNER_MULTISIG = process.env.OWNER_MULTISIG;

const ETH_SFI = process.env.ETH_SFI;

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

  const sfiToken = await ethers.getContractAt("SFItoken", ETH_SFI, deployer);

  // roles
  const DEFAULT_ADMIN_ROLE = await sfiToken.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await sfiToken.MINTER_ROLE();
  const PAUSE_ROLE = await sfiToken.PAUSE_ROLE();

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  // grant minter role to OWNER_MULTISIG
  console.log("Granting MINTER_ROLE to OWNER_MULTISIG")
  tx = await sfiToken.grantRole(MINTER_ROLE, OWNER_MULTISIG, txOptions);
  await tx.wait();

  hasRole = await sfiToken.hasRole(MINTER_ROLE, OWNER_MULTISIG);
  console.log("OWNER_MULTISIG has MINTER_ROLE: ", hasRole);
  if (!hasRole) {
    throw Error("Failed to grant MINTER_ROLE to OWNER_MULTISIG");
  }

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  // renounce minter role from deployer
  console.log("Renouncing MINTER_ROLE from deployer")
  tx = await sfiToken.renounceRole(MINTER_ROLE, deployerAddress, txOptions);
  await tx.wait();
  hasRole = await sfiToken.hasRole(MINTER_ROLE, deployerAddress);
  console.log("deployer has MINTER_ROLE: ", hasRole);
  if (hasRole) {
    throw Error("Failed to renounce MINTER_ROLE from deployer");
  }

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  // grant pause role to OWNER_MULTISIG
  console.log("Granting PAUSE_ROLE to OWNER_MULTISIG")
  tx = await sfiToken.grantRole(PAUSE_ROLE, OWNER_MULTISIG, txOptions);
  await tx.wait();

  hasRole = await sfiToken.hasRole(PAUSE_ROLE, OWNER_MULTISIG);
  console.log("OWNER_MULTISIG has PAUSE_ROLE: ", hasRole);
  if (!hasRole) {
    throw Error("Failed to grant PAUSE_ROLE to OWNER_MULTISIG");
  }

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  // renounce pause role from deployer
  console.log("Renouncing PAUSE_ROLE from deployer")
  tx = await sfiToken.renounceRole(PAUSE_ROLE, deployerAddress, txOptions);
  await tx.wait();
  hasRole = await sfiToken.hasRole(PAUSE_ROLE, deployerAddress);
  console.log("deployer has PAUSE_ROLE: ", hasRole);
  if (hasRole) {
    throw Error("Failed to renounce PAUSE_ROLE from deployer");
  }

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  // grant admin role to OWNER_MULTISIG
  console.log("Granting DEFAULT_ADMIN_ROLE to OWNER_MULTISIG")
  tx = await sfiToken.grantRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG, txOptions);
  await tx.wait();

  hasRole = await sfiToken.hasRole(DEFAULT_ADMIN_ROLE, OWNER_MULTISIG);
  console.log("OWNER_MULTISIG has DEFAULT_ADMIN_ROLE: ", hasRole);
  if (!hasRole) {
    throw Error("Failed to grant DEFAULT_ADMIN_ROLE to OWNER_MULTISIG");
  }

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  // renounce admin role from deployer
  console.log("Renouncing DEFAULT_ADMIN_ROLE from deployer")
  tx = await sfiToken.renounceRole(DEFAULT_ADMIN_ROLE, deployerAddress, txOptions);
  await tx.wait();
  hasRole = await sfiToken.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress);  
  console.log("deployer has DEFAULT_ADMIN_ROLE: ", hasRole);
  if (hasRole) {
    throw Error("Failed to renounce DEFAULT_ADMIN_ROLE from deployer");
  }
}

const getDeployerAndDeploy = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await deploy(deployer);
};

getDeployerAndDeploy();
