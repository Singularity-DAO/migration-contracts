const { ethers } = require("hardhat");
const { JsonRpcProvider, parseUnits, formatUnits } = require("ethers");

const ETH_ASI = process.env.ETH_ASI;

const MIGRATION_FET_ADDRESS = process.env.MIGRATION_FET_ADDRESS;
const MIGRATION_AGIX_ADDRESS = process.env.MIGRATION_AGIX_ADDRESS;
const MIGRATION_OCEAN_ADDRESS = process.env.MIGRATION_OCEAN_ADDRESS;

const FET_ASI_CONVERSION_RATIO = parseUnits("1", 18);
const AGIX_ASI_CONVERSION_RATIO = parseUnits("0.433350", 18);
const OCEAN_ASI_CONVERSION_RATIO = parseUnits("0.433226", 18);

const FET_TOTAL_SUPPLY = parseUnits("2630547140.999999999999656122", 18);
const AGIX_TOTAL_SUPPLY = parseUnits("1143778736.02972206", 8);
const OCEAN_TOTAL_SUPPLY = parseUnits("1410000000", 18);

const FET_ASI_MIGRATION_SUPPLY = FET_ASI_CONVERSION_RATIO * FET_TOTAL_SUPPLY / 1000000000000000000n; // 1e18
const AGIX_ASI_MIGRATION_SUPPLY = AGIX_ASI_CONVERSION_RATIO * AGIX_TOTAL_SUPPLY / 100000000n; // 1e8
const OCEAN_ASI_MIGRATION_SUPPLY = OCEAN_ASI_CONVERSION_RATIO * OCEAN_TOTAL_SUPPLY / 1000000000000000000n; // 1e18

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
  const provider = new JsonRpcProvider(process.env.RPC);
  console.log("Using RPC: %s", process.env.RPC);
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

async function deploy(deployer) {
  const deployerAddress = await deployer.getAddress();

  const asiToken = await ethers.getContractAt("ASItoken", ETH_ASI, deployer);

  const tokensToMint = (AGIX_ASI_MIGRATION_SUPPLY + FET_ASI_MIGRATION_SUPPLY + OCEAN_ASI_MIGRATION_SUPPLY).toString();

  console.log("tokensToMint: ", tokensToMint)

  tx = await asiToken.mint(deployerAddress, tokensToMint, txOptions);
  await tx.wait();
  console.log("Minted %s ASI to deployer", tokensToMint);

  const bal = await asiToken.balanceOf(deployerAddress);
  console.log("deployer ASI token balance: ", formatUnits(bal, 18));

  tx = await asiToken.transfer(
    MIGRATION_FET_ADDRESS,
    FET_ASI_MIGRATION_SUPPLY,
    txOptions
  );
  await tx.wait();
  console.log(
    "Transferred %s ASI to FET migration contract",
    FET_ASI_MIGRATION_SUPPLY.toString()
  );

  tx = await asiToken.transfer(
    MIGRATION_AGIX_ADDRESS,
    AGIX_ASI_MIGRATION_SUPPLY,
    txOptions
  );
  await tx.wait();
  console.log(
    "Transferred %s ASI to AGIX migration contract",
    AGIX_ASI_MIGRATION_SUPPLY.toString()
  );

  tx = await asiToken.transfer(
    MIGRATION_OCEAN_ADDRESS,
    OCEAN_ASI_MIGRATION_SUPPLY,
    txOptions
  );
  await tx.wait();
  console.log(
    "Transferred %s ASI to OCEAN migration contract",
    OCEAN_ASI_MIGRATION_SUPPLY.toString()
  );
}

const getDeployerAndDeploy = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await deploy(deployer);
};

getDeployerAndDeploy();
