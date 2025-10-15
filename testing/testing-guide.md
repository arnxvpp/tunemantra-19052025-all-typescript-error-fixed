# TuneMantra Testing Guide

This guide provides instructions on how to test the integrated features of the TuneMantra music distribution platform.

## Prerequisites

Before running the tests, ensure that:

1. The PostgreSQL database is set up and accessible
2. Environment variables are properly configured (especially blockchain provider URLs)
3. Node.js and npm are installed

## Available Test Scripts

We've created several test scripts to validate different components of the system:

1. **Blockchain Connector Tests**: `scripts/test-blockchain-connector.ts`
   - Tests multi-network support
   - Tests NFT minting functionality

2. **Rights Management Tests**: `scripts/test-rights-management.ts`
   - Tests rights registration
   - Tests conflict detection
   - Tests rights verification

3. **Royalty Calculation Tests**: `scripts/test-royalty-calculation.ts`
   - Tests royalty calculation functionality
   - Tests royalty processing

4. **Run All Tests**: `scripts/run-all-tests.ts`
   - Runs all tests in sequence

## Running the Tests

### Running Individual Tests

You can run any test script individually using:

```bash
npx tsx scripts/test-blockchain-connector.ts
```

Replace the script name with the test you want to run.

### Running All Tests

To run all tests in sequence:

```bash
npx tsx scripts/run-all-tests.ts
```

## Interpreting Test Results

Each test will output detailed information about the operations being performed and their results.

### Success Indicators

- **Blockchain Tests**: Look for successful network connections and NFT minting
- **Rights Management Tests**: Look for successful rights registration and accurate conflict detection
- **Royalty Tests**: Look for correct calculation amounts and processing status changes

### Common Issues and Troubleshooting

1. **Database Connection Errors**
   - Ensure the PostgreSQL database is running
   - Check database credentials in environment variables

2. **Blockchain Connection Errors**
   - Verify the RPC URLs in environment variables
   - Check if the blockchain provider services are available

3. **Missing Tables**
   - Some tests auto-create required tables if they don't exist
   - If you encounter errors about missing tables, check the database schema

## Environment Configuration

For optimal testing, ensure these environment variables are set:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tunemantra

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-api-key
POLYGON_RPC_URL=https://polygon-rpc.com
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

# Feature Flags
ETHEREUM_ACTIVE=false
POLYGON_ACTIVE=false
MUMBAI_ACTIVE=true
DEFAULT_BLOCKCHAIN_NETWORK=mumbai
```

## Test Data

The test scripts will automatically create minimal test data if none exists, including:
- Test users
- Test tracks
- Test releases
- Test distribution records

You can manually seed more comprehensive test data if needed for more thorough testing.

## Extending the Tests

To add new tests:

1. Create a new test script in the `scripts` directory
2. Follow the pattern of existing tests
3. Add the new script to the `TEST_SCRIPTS` array in `run-all-tests.ts`