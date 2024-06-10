# asi-token-contracts

This repository includes the token contracts and associated tests for the ASI token.

## ASI Token

- ERC-20 implementation for the ASI Token.

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

### Deploying the ASI Token

1. Set the following variables in the `.env` file:

   ```plaintext
   RPC=<Your_RPC_URL>
   PRIVATE_KEY=<Your_Private_Key>
   ```

2. Deploy the ASI token by running:

   ```bash
   npm run deploy
   ```

   This will provide you with the implementation contract address for the ASI token. Copy and save this address.

### Migrating Tokens

After deploying the ASI token, follow the steps in the [migration token repository](https://github.com/Singularity-DAO/migration-contracts/migration). Ensure you complete all steps outlined in the migration contract README file.

### Granting Roles

1. Set the following variables in the `.env` file:

   ```plaintext
   RPC=<Your_RPC_URL>
   PRIVATE_KEY=<Your_Private_Key>
   ETH_ASI=<ASI Address>
   AGIX_MIGRATION_CONTRACT=<AGIX Migration Address>
   FET_MIGRATION_CONTRACT=<FET Migration Address>
   OCEAN_MIGRATION_CONTRACT=<OCEAN Migration Address>
   ```


2. Grant the minting role to the migration contracts by running:

   ```bash
   npm run grantRole
   ```

This will grant the minting role of the ASI token to the specified migration contracts.
