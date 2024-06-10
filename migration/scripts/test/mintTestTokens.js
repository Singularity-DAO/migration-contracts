const { ethers } = require("hardhat");
const { JsonRpcProvider, parseUnits } = require("ethers");

let provider;
let tx;

const ETH_FET = process.env.ETH_FET;
const ETH_AGIX = process.env.ETH_AGIX;
const ETH_OCEAN = process.env.ETH_OCEAN;

const FET_TOTAL_SUPPLY = parseUnits("2630547140.999999999999656122", 18);
const AGIX_TOTAL_SUPPLY = parseUnits("1143778736.02972206", 8);
const OCEAN_TOTAL_SUPPLY = parseUnits("1410000000", 18);

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
  testToken_CF = await ethers.getContractFactory("TestToken", deployer);

  const fetToken = await ethers.getContractAt("TestToken", ETH_FET, deployer);
  tx = await fetToken.mint(deployerAddress, FET_TOTAL_SUPPLY);
  await tx.wait();
  console.log("Minted %s FET to %s", FET_TOTAL_SUPPLY, deployerAddress);

  const agixToken = await ethers.getContractAt("TestToken", ETH_AGIX, deployer);
  tx = await agixToken.mint(deployerAddress, AGIX_TOTAL_SUPPLY);
  await tx.wait();
  console.log("Minted %s AGIX to %s", AGIX_TOTAL_SUPPLY, deployerAddress);

  const oceanToken = await ethers.getContractAt("TestToken", ETH_OCEAN, deployer);
  tx = await oceanToken.mint(deployerAddress, OCEAN_TOTAL_SUPPLY);
  await tx.wait();
  console.log("Minted %s OCEAN to %s", OCEAN_TOTAL_SUPPLY, deployerAddress);
}

const getDeployerAndDeploy = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await deploy(deployer);
};

getDeployerAndDeploy();
