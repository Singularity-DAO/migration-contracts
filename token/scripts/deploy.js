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
  ASItoken_CF = await ethers.getContractFactory("ASItoken", deployer);

  const ASItokenImplementation = await ASItoken_CF.deploy();
  const ASItokenImplementationAddress =
    await ASItokenImplementation.getAddress();
  console.log(
    "Deployed ASItokenImplementation: %s",
    ASItokenImplementationAddress
  );
}

const getDeployerAndDeploy = async () => {
  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Using deployer: %s", deployerAddress);

  await deploy(deployer);
};

getDeployerAndDeploy();
