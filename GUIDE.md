Here's an organized and improved version of your guide:
# Deployment Guide for ASI Token and Migration Contracts

## Prerequisites

1. **Create .env File**:
   - Create a `.env` file in both the `token` and `migration` directories.
   - Copy the content from `.env.example` to the `.env` file in both directories.

## Step-by-Step Deployment

### 1. Deploy ASI Token

1. Navigate to the `token` directory:
   ```sh
   cd token
   ```

2. Deploy the ASI token:
   ```sh
   npm run deploy
   ```

3. **Update `.env`**:
   - Update the ASI address and the Ocean, AGIX, and FET addresses in the `.env` file.

### 2. Deploy Migration Contracts

1. Navigate to the `migration` directory:
   ```sh
   cd migration
   ```

2. Deploy the migration contracts:
   ```sh
   npm run deploy
   ```

3. **Update `.env`**:
   - Copy the migration contract addresses and paste them into the `.env` file.

### 3. Transfer ASI Tokens to Migration Contracts

1. Navigate to the `token` directory:
   ```sh
   cd token
   ```

2. Transfer ASI tokens to the migration contracts:
   ```sh
   npm run transfer
   ```

### 4. Grant Admin Role to Multisig and Revoke Deployer as Admin

1. Navigate to the `migration` directory:
   ```sh
   cd migration
   ```

2. Grant the admin role and revokes the current admin:
   ```sh
   npm run grantAdminRole
   ```

3. Navigate to the `token` directory:
   ```sh
   cd token
   ```

4. Grant the admin role and revokes the current admin:
   ```sh
   npm run grantAdminRole
   ```

## Contract Verification on Etherscan

Once the deployments are complete, verify the contracts on Etherscan by running the following commands:

### In the Token Directory:

```sh
npx hardhat verify $ETH_ASI --network sepolia
```

### In the Migration Directory:

```sh
npx hardhat verify $MIGRATION_FET_ADDRESS --network sepolia
npx hardhat verify $MIGRATION_AGIX_ADDRESS --network sepolia
npx hardhat verify $MIGRATION_OCEAN_ADDRESS --network sepolia
```
