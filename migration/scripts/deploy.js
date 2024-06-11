const { ethers } = require("hardhat");
const { JsonRpcProvider, parseUnits } = require("ethers");

let provider;
let tx;

const ETH_ASI = process.env.ETH_ASI; // mainnet ASI (forked)

const ETH_AGIX = process.env.ETH_AGIX; // mainnet AGIX
const ETH_FET = process.env.ETH_FET; // mainnet FET
const ETH_OCEAN = process.env.ETH_OCEAN; // mainnet OCEAN

const FET_BURNABLE = true;
const AGIX_BURNABLE = true;
const OCEAN_BURNABLE = false;

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

const ASI_MINTABLE = false; // for sepolia

const FET_ASI_CONVERSION_RATIO = parseUnits("1", 18);
const AGIX_ASI_CONVERSION_RATIO = parseUnits("0.433350", 18);
const OCEAN_ASI_CONVERSION_RATIO = parseUnits("0.433226", 18);

const txOptions = {
  // gasLimit: 3e5,
  // maxFeePerGas: ethers.parseUnits("15", "gwei"),
  // maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
};

async function getCloneFromTx(tx) {
  const txReceipt = await tx.wait();
  if (txReceipt.status != 1) {
    console.log("Failed cloning %s", JSON.stringify(txReceipt));
  }
  return txReceipt.logs[0].args[0];
}

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

async function cloneTokenMigration(migrateTokenImplementation) {
  const tx = await migrateTokenImplementation.getClone(txOptions);
  await tx.wait();
  const migrateTokenAddress = await getCloneFromTx(tx);
  console.log("Cloned MigrateToken: %s", migrateTokenAddress);
  return await migrateToken_CF.attach(migrateTokenAddress);
}

async function deploy(deployer) {
  migrateToken_CF = await ethers.getContractFactory("MigrateToken", deployer);

  const migrateTokenImplementation = await migrateToken_CF.deploy();
  const dTx = await migrateTokenImplementation.deploymentTransaction();
  await dTx.wait();
  const migrateTokenImplementationAddress = await migrateTokenImplementation.getAddress();
  console.log("Deployed migrateTokenImplementation: %s", migrateTokenImplementationAddress);

  const migrateFET = await cloneTokenMigration(migrateTokenImplementation);
  const migrateFETAddress = await migrateFET.getAddress();
  console.log("Cloned MigrateToken for FET: %s", migrateFETAddress);

  const migrateAGIX = await cloneTokenMigration(migrateTokenImplementation);
  const migrateAGIXAddress = await migrateAGIX.getAddress();
  console.log("Cloned MigrateToken for AGIX: %s", migrateAGIXAddress);

  const migrateOCEAN = await cloneTokenMigration(migrateTokenImplementation);
  const migrateOCEANAddress = await migrateOCEAN.getAddress();
  console.log("Cloned MigrateToken for OCEAN: %s", migrateOCEANAddress);

  console.log(
    "-----------------------------------------------------------------------------------------------------------------------------------------------"
  );

  tx = await migrateFET.initialize(
    ETH_FET,
    ETH_ASI,
    FET_ASI_CONVERSION_RATIO,
    FET_BURNABLE,
    ASI_MINTABLE,
    BURN_ADDRESS,
    txOptions
  );
  await tx.wait();
  console.log(
    "Initialized FET -> ASI migration contract (%s) using conversion ratio: %s",
    migrateFETAddress,
    FET_ASI_CONVERSION_RATIO
  );

  tx = await migrateAGIX.initialize(
    ETH_AGIX,
    ETH_ASI,
    AGIX_ASI_CONVERSION_RATIO,
    AGIX_BURNABLE,
    ASI_MINTABLE,
    BURN_ADDRESS,
    txOptions
  );
  await tx.wait();
  console.log(
    "Initialized AGIX -> ASI migration contract (%s) using conversion ratio: %s",
    migrateAGIXAddress,
    AGIX_ASI_CONVERSION_RATIO
  );

  tx = await migrateOCEAN.initialize(
    ETH_OCEAN,
    ETH_ASI,
    OCEAN_ASI_CONVERSION_RATIO,
    OCEAN_BURNABLE,
    ASI_MINTABLE,
    BURN_ADDRESS,
    txOptions
  );
  await tx.wait();
  console.log(
    "Initialized OCEAN -> ASI migration contract (%s) using conversion ratio: %s",
    migrateOCEANAddress,
    OCEAN_ASI_CONVERSION_RATIO
  );
}

const getDeployerAndDeploy = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await deploy(deployer);
};

getDeployerAndDeploy();
