const { ethers } = require("hardhat");
const { JsonRpcProvider } = require("ethers");

let provider;

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
  testToken_CF = await ethers.getContractFactory("TestToken", deployer);

  const fetToken = await testToken_CF.deploy("FETCH AI", "FET", 18);
  let dTx = await fetToken.deploymentTransaction();
  await dTx.wait();
  const fetTokenAddress = await fetToken.getAddress();
  console.log("Deployed FET: %s", fetTokenAddress);

  const agixToken = await testToken_CF.deploy("SINGULARITY NET", "AGIX", 8);
  dTx = await agixToken.deploymentTransaction();
  await dTx.wait();
  const agixTokenAddress = await agixToken.getAddress();
  console.log("Deployed AGIX: %s", agixTokenAddress);

  const oceanToken = await testToken_CF.deploy("OCEAN PROTOCOL", "OCEAN", 18);
  dTx = await oceanToken.deploymentTransaction();
  await dTx.wait();
  const oceanTokenAddress = await oceanToken.getAddress();
  console.log("Deployed OCEAN: %s", oceanTokenAddress);
}

const getDeployerAndDeploy = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await deploy(deployer);
};

getDeployerAndDeploy();
