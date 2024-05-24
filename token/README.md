# token-contracts

This repository includes the token contracts and associated tests for a token.

## Token

- ERC-20 implementation for a Token.

## Installation

### Dependencies

Install the required dependencies:

```bash
npm install
```

### Compile

Compile the smart contracts:

```bash
npm run compile
```

### Test Coverage

Run the tests and generate a coverage report:

```bash
npm run coverage
```

## Deployment Guide

### Deploying the Token

1. Set the following variables in the `.env` file:

   ```plaintext
   RPC=<Your_RPC_URL>
   PRIVATE_KEY=<Your_Private_Key>
   ```

2. Deploy the token by running:

   ```bash
   npm run deploy
   ```

   This will provide you with the implementation contract address for the token. Copy and save this address.

### Migrating Tokens

After deploying the token, follow the steps in the [migration token repository](https://github.com/Singularity-DAO/migration-contracts/migration). Ensure you complete all steps outlined in the migration contract README file.

### Granting Roles

1. Update the `scripts/grantRole.js` file with the correct addresses:

   ```javascript
   const ETH_TOKEN = "the token address";
   const A_MIGRATION_CONTRACT = "the A migration contract address";
   const F_MIGRATION_CONTRACT = "the F migration contract address";
   const O_MIGRATION_CONTRACT = "the O migration contract address";
   ```

2. Grant the minting role to the migration contracts by running:

   ```bash
   npm run grantRole
   ```

This will grant the minting role of the token to the specified migration contracts.
