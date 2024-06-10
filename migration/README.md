# SingularityDAO Token Migration

This project facilitates the migration from one token to another using a configurable conversion ratio.

## Features

- Supports mintable tokens or transfers of pre-minted tokens.
- Supports burnable tokens or transfers old tokens to a configurable burn address.
- Implements the EIP-1167 minimal proxy pattern.
- Only supports tokens implementing `IERC20Metadata`.
- Does not support tokens using Fee-on-transfer.

## Getting Started

To get started with this project, you can run some of the following tasks:

```sh
npm run lint      # Lint the code
npx run compile   # Compile the contracts
npm run test      # Run the tests
npm run coverage  # Generate test coverage report
```

## Deployment

We are going to deploy the migration contracts for the AGIX, FET, and OCEAN tokens. 
Ensure that ASI token has been deployed by following instructions in [token repository](https://github.com/Singularity-DAO/migration-contracts/token/). Ensure you complete all steps outlined in the token contract README file.

### Setup

1. Create a `.env` file in the project root and set the following variables:

   ```plaintext
   RPC=<Your_RPC_URL>
   PRIVATE_KEY=<Your_Private_Key>
   ETH_AGIX = <AGIX Address>
   ETH_FET = <FET Address>
   ETH_OCEAN = <OCEAN Address>
   ETH_ASI =  <ASI Address>
   ```

2. Ensure that all other addresses and configurations in the `deploy.js` file are correct.

3. If needed, you can also change the transaction option settings in the `deploy.js` file:

   ```javascript
   const txOptions = {
     gasLimit: 300000,
     maxFeePerGas: ethers.parseUnits("15", "gwei"),
     maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
   };
   ```

### Deployment Command

Once everything is set up, deploy the token by running:

```sh
npm run deploy
```
