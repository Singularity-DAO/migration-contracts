const { ethers } = require("hardhat");
const { JsonRpcProvider } = require("ethers");

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
  SFItoken_CF = await ethers.getContractFactory("SFItoken", deployer);

  const SFItokenImplementation = await SFItoken_CF.deploy();
  const SFItokenImplementationAddress =
    await SFItokenImplementation.getAddress();
  console.log(
    "Deployed SFItokenImplementation: %s",
    SFItokenImplementationAddress
  );
}

const getDeployerAndDeploy = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await deploy(deployer);
};

getDeployerAndDeploy();
