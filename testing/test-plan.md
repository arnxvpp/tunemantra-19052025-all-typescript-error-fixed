# TuneMantra Test Plan

## Overview

This test plan outlines the approach for verifying the integrated functionality of the TuneMantra music distribution platform. The focus is on validating the core capabilities, particularly the blockchain integration, rights management, and royalty calculation features.

## Test Objectives

1. Verify blockchain connectivity and multi-network support
2. Validate rights management functionality including territorial rights
3. Test royalty calculation accuracy and processing
4. Ensure proper integration between components

## Test Environment

### Prerequisites

- PostgreSQL database
- Node.js environment
- Blockchain provider APIs (Ethereum, Polygon, Mumbai)

### Configuration

- Environment variables for database connection
- Environment variables for blockchain RPC endpoints
- Feature flags for enabling/disabling specific networks

## Test Scope

### In Scope

- Blockchain connector service
- Rights management service
- Royalty calculation
- Database operations for core functions

### Out of Scope

- User interface testing
- Load/performance testing
- Security penetration testing

## Test Strategy

### Unit Testing

Each core service will be tested individually to verify its basic functionality:

- **Blockchain Connector**: Test network support and NFT operations
- **Rights Management**: Test rights registration, conflict detection
- **Royalty Calculation**: Test calculation accuracy and financial operations

### Integration Testing

Test interactions between services:

- Rights registration → Blockchain verification
- Rights management → Royalty calculation
- Blockchain operations → Database persistence

## Test Cases

### Blockchain Connector Tests

1. **Network Support**
   - Verify supported networks can be retrieved
   - Verify each network's configuration is valid

2. **NFT Minting**
   - Verify NFT can be minted for a track
   - Verify NFT metadata is properly created
   - Verify NFT details can be retrieved

### Rights Management Tests

1. **Rights Registration**
   - Verify standard rights can be registered
   - Verify territorial rights can be registered
   - Verify rights with split percentages work correctly

2. **Conflict Detection**
   - Verify conflicts are detected when total percentage exceeds 100%
   - Verify conflicts are handled properly

3. **Rights Verification**
   - Verify rights ownership can be checked
   - Verify territorial restrictions are enforced

### Royalty Calculation Tests

1. **Calculation**
   - Verify royalty amounts are calculated correctly
   - Verify splits between multiple rights holders

2. **Processing**
   - Verify royalties can be marked as processed
   - Verify royalties can be marked as paid

## Test Execution

### Running Tests

Three main test scripts have been created:

1. `scripts/test-blockchain-connector.ts`: Tests blockchain operations
2. `scripts/test-rights-management.ts`: Tests rights management
3. `scripts/test-royalty-calculation.ts`: Tests royalty calculations

A combined script `scripts/run-all-tests.ts` runs all tests in sequence.

### Test Data

The tests use a minimal set of test data created on-the-fly if it doesn't exist:
- Test users
- Test tracks
- Test releases
- Test distribution records

## Success Criteria

### Pass Criteria

- All test cases execute without errors
- Core functionality works as expected
- Data integrity is maintained

### Fail Criteria

- Critical functions fail to execute
- Database errors occur
- Inconsistent behavior is observed

## Risk Management

### Identified Risks

1. **Blockchain Provider Availability**
   - Mitigation: Use fallback providers, implement retries
   
2. **Database Performance**
   - Mitigation: Optimize queries, limit test data size

3. **Incomplete Test Coverage**
   - Mitigation: Regularly review and expand test cases

## Reporting

Test results will be captured in the console output and can be redirected to log files for analysis.

### Key Metrics

- Number of tests passed/failed
- Error types and frequency
- Transaction times for blockchain operations

## Follow-up Actions

After test execution:

1. Fix any identified issues
2. Document workarounds for known limitations
3. Update tests to cover new functionality

## Conclusion

This test plan provides a structured approach to verify the core functionality of TuneMantra. By following this plan, we can ensure that the platform's key features work as expected and integrate properly with each other.