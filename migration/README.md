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

We are going to deploy the migration contracts for the tokens.

### Setup

1. Create a `.env` file in the project root and set the following variables:

   ```plaintext
   RPC=<Your_RPC_URL>
   PRIVATE_KEY=<Your_Private_Key>
   ```

2. Copy the newly deployed token address from there and paste it into the `scripts/deploy.js` file as shown below:

   ```javascript
   const ETH_TOKEN = "address goes here";
   ```

3. Ensure that all other addresses and configurations in the `deploy.js` file are correct.

4. If needed, you can also change the transaction option settings in the `deploy.js` file:

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

This will deploy the migration contracts with the specified configurations.
