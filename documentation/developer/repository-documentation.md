# TuneMantra Repository Documentation

*Version: 1.0.0 (March 27, 2025)*

## Table of Contents

- [Introduction](#introduction)
- [Repository Structure](#repository-structure)
- [Branch Strategy](#branch-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Development Workflow](#development-workflow)
- [Release Management](#release-management)
- [Tagging Strategy](#tagging-strategy)
- [Deployment Pipeline](#deployment-pipeline)
- [Repository History](#repository-history)
- [Code Review Process](#code-review-process)
- [Configuration Management](#configuration-management)
- [Appendix](#appendix)

## Introduction

This document provides comprehensive documentation of the TuneMantra repository, including its structure, branching strategy, development workflow, and historical evolution. It serves as a reference for developers working with the codebase and is especially valuable for onboarding new team members.

### Purpose

The purpose of this document is to:

1. Detail the organization and structure of the codebase
2. Explain the branching strategy and development workflow
3. Document the repository's history and evolution
4. Provide guidance on code contribution and review process
5. Describe the deployment pipeline and release management
6. Serve as a reference for configuration management

### Repository Overview

- **Repository URL**: `git@github.com:tunemantra/tunemantra-platform.git`
- **Repository Type**: Git
- **Hosting Platform**: GitHub Enterprise
- **Access Control**: Role-based access through GitHub Teams
- **Created**: June 15, 2023
- **Total Commits**: 7,823 (as of March 27, 2025)
- **Active Branches**: 23
- **Contributors**: 42
- **Lines of Code**: ~483,000
- **Repository Size**: 1.7 GB

## Repository Structure

The TuneMantra platform repository follows a monorepo approach, containing all platform components in a single repository to facilitate coordinated development and deployment.

### Root Structure

```
tunemantra-platform/
├── client/                    # Frontend application code
├── server/                    # Backend application code
├── shared/                    # Code shared between client and server
├── documentation/             # Project documentation
├── scripts/                   # Build, deployment, and utility scripts
├── config/                    # Configuration files
├── infrastructure/            # Infrastructure as Code (IaC)
├── migrations/                # Database migration scripts
├── tests/                     # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── e2e/                   # End-to-end tests
│   └── performance/           # Performance tests
├── tools/                     # Development tools
├── .github/                   # GitHub workflow configurations
├── .vscode/                   # VS Code configuration
└── examples/                  # Example implementations
```

### Client Structure

The `client` directory contains the frontend application, built with React.

```
client/
├── public/                    # Static assets
├── src/                       # Source code
│   ├── api/                   # API client code
│   ├── assets/                # Images, fonts, etc.
│   ├── components/            # Reusable React components
│   │   ├── common/            # Common components
│   │   ├── analytics/         # Analytics components
│   │   ├── catalog/           # Catalog components
│   │   ├── distribution/      # Distribution components
│   │   ├── rights/            # Rights management components
│   │   ├── royalties/         # Royalty components
│   │   └── user/              # User management components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Page components
│   ├── routes/                # Routing configuration
│   ├── services/              # Service layer
│   ├── store/                 # State management
│   ├── styles/                # Global styles
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── tests/                     # Frontend-specific tests
└── config/                    # Frontend configuration
```

### Server Structure

The `server` directory contains the backend application, built with Node.js and Express.

```
server/
├── src/                       # Source code
│   ├── api/                   # API routes and controllers
│   │   ├── analytics/         # Analytics API
│   │   ├── catalog/           # Catalog API
│   │   ├── distribution/      # Distribution API
│   │   ├── rights/            # Rights management API
│   │   ├── royalties/         # Royalty API
│   │   └── users/             # User management API
│   ├── config/                # Server configuration
│   ├── db/                    # Database connection and models
│   ├── middleware/            # Express middleware
│   ├── services/              # Business logic
│   │   ├── analytics/         # Analytics service
│   │   ├── catalog/           # Catalog service
│   │   ├── distribution/      # Distribution service
│   │   ├── rights/            # Rights management service
│   │   ├── royalties/         # Royalty service
│   │   └── users/             # User management service
│   ├── utils/                 # Utility functions
│   └── types/                 # TypeScript type definitions
├── tests/                     # Backend-specific tests
└── scripts/                   # Backend-specific scripts
```

### Shared Structure

The `shared` directory contains code shared between the client and server.

```
shared/
├── constants/                 # Shared constants
├── types/                     # Shared TypeScript types
├── utils/                     # Shared utility functions
└── validation/                # Shared validation schemas
```

### Infrastructure Structure

The `infrastructure` directory contains Infrastructure as Code (IaC) definitions.

```
infrastructure/
├── terraform/                 # Terraform configurations
│   ├── environments/          # Environment-specific configurations
│   │   ├── development/       # Development environment
│   │   ├── staging/           # Staging environment
│   │   └── production/        # Production environment
│   └── modules/               # Reusable Terraform modules
├── kubernetes/                # Kubernetes manifests
│   ├── base/                  # Base configurations
│   └── overlays/              # Environment-specific overlays
└── scripts/                   # Infrastructure scripts
```

## Branch Strategy

TuneMantra follows a modified GitFlow branching strategy, designed to support our continuous delivery pipeline while maintaining stability in production environments.

### Main Branches

| Branch Name | Purpose | Lifecycle |
|-------------|---------|-----------|
| `main` | The production branch that contains the code currently running in production. | Permanent |
| `develop` | The main development branch where feature branches are merged. | Permanent |
| `release` | Branched from `develop` for release preparation. | Temporary |

### Feature Branches

Feature branches are created from `develop` and follow the naming convention:

```
feature/<issue-id>-<short-description>
```

For example:
- `feature/TM-1234-add-analytics-dashboard`
- `feature/TM-2345-implement-batch-payment-processing`

### Bugfix Branches

Bugfix branches are created from `develop` for non-critical bugs and follow the naming convention:

```
bugfix/<issue-id>-<short-description>
```

For example:
- `bugfix/TM-3456-fix-chart-rendering-issue`
- `bugfix/TM-4567-correct-validation-error-message`

### Hotfix Branches

Hotfix branches are created from `main` for critical production issues and follow the naming convention:

```
hotfix/<issue-id>-<short-description>
```

For example:
- `hotfix/TM-5678-fix-critical-security-vulnerability`
- `hotfix/TM-6789-resolve-api-timeout-issue`

### Release Branches

Release branches are created from `develop` when preparing for a release and follow the naming convention:

```
release/v<major>.<minor>.<patch>
```

For example:
- `release/v2.3.0`
- `release/v2.4.0`

### Branch Protections

The following branch protections are enabled:

- **`main` branch**:
  - Requires pull request before merging
  - Requires code owner review
  - Requires passing CI checks
  - Prevents force pushing
  - Restricts who can push to the branch

- **`develop` branch**:
  - Requires pull request before merging
  - Requires at least one reviewer approval
  - Requires passing CI checks
  - Prevents force pushing

- **`release/*` branches**:
  - Requires pull request before merging
  - Requires at least one reviewer approval
  - Requires passing CI checks
  - Prevents force pushing

## Commit Guidelines

TuneMantra follows the Conventional Commits specification for commit messages to ensure a standardized and readable commit history.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, missing semicolons, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Changes to the build system or dependencies |
| `ci` | Changes to CI configuration files and scripts |
| `chore` | Other changes that don't modify src or test files |
| `revert` | Reverts a previous commit |

### Scopes

Common scopes include:

- `client`: Changes to the frontend application
- `server`: Changes to the backend application
- `api`: Changes to the API layer
- `db`: Changes to the database models or migrations
- `auth`: Changes to the authentication system
- `analytics`: Changes to the analytics system
- `royalties`: Changes to the royalty management system
- `distribution`: Changes to the distribution system
- `catalog`: Changes to the catalog management system
- `rights`: Changes to the rights management system

### Examples

```
feat(catalog): add support for multiple artists per track

This change allows adding multiple artists to a track, with specific roles
such as primary artist, featured artist, producer, etc.

Closes #1234
```

```
fix(api): resolve timeout issue in distribution endpoints

Increased request timeout and implemented pagination to handle large
distribution requests more efficiently.

Fixes #2345
```

### Commit Verification

All commits must be signed with a GPG key to verify commit authenticity.

## Development Workflow

The TuneMantra development workflow is designed to facilitate collaborative development while ensuring code quality and stability.

### Standard Development Flow

1. **Issue Creation**:
   - All development work is tied to an issue in the issue tracker
   - Issues are assigned to developers and prioritized by product management

2. **Branch Creation**:
   - Developer creates a feature or bugfix branch from `develop`
   - Branch is named according to the branching conventions

3. **Development**:
   - Developer works on the assigned task
   - Commits follow the commit guidelines
   - Code is written following the project's coding standards

4. **Testing**:
   - Developer writes unit and integration tests for new code
   - Developer runs existing tests to ensure no regressions

5. **Pull Request Creation**:
   - Developer creates a pull request to merge into `develop`
   - PR description includes:
     - Summary of changes
     - Link to related issue
     - Testing information
     - Any deployment considerations

6. **Code Review**:
   - At least one other developer reviews the code
   - Code owners for affected areas are automatically requested for review
   - CI/CD pipeline runs tests and quality checks
   - Any issues are addressed by the developer

7. **Merge**:
   - Once approved and all checks pass, the PR is merged to `develop`
   - The branch is deleted after merging

8. **Continuous Integration**:
   - Changes in `develop` are automatically deployed to the development environment
   - Additional testing may be performed in the development environment

### Release Flow

1. **Release Branch Creation**:
   - Release manager creates a `release/v*.*.*` branch from `develop`
   - Version number is incremented according to semver principles

2. **Release Preparation**:
   - Final testing and QA is performed on the release branch
   - Only bugfixes are allowed on the release branch
   - Bugfixes are made directly on the release branch or via PRs

3. **Release Finalization**:
   - When the release is stable, a PR is created to merge to `main`
   - Release notes are compiled
   - The release is tagged with the version number

4. **Production Deployment**:
   - The release is deployed to production
   - The release branch is merged back to `develop`
   - The release branch is deleted

### Hotfix Flow

1. **Hotfix Branch Creation**:
   - Developer creates a `hotfix/*` branch from `main`

2. **Fix Implementation**:
   - Developer implements the fix
   - Tests are written or updated
   - The fix is reviewed by at least one other developer

3. **Deployment**:
   - A PR is created to merge to `main`
   - After approval, the fix is merged to `main` and deployed to production
   - Another PR is created to merge the fix to `develop`

## Release Management

TuneMantra follows semantic versioning (SemVer) for versioning the platform, with a structured release schedule and process.

### Versioning Scheme

Versions follow the format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Incremented for incompatible API changes
- **MINOR**: Incremented for backwards-compatible functionality additions
- **PATCH**: Incremented for backwards-compatible bug fixes

### Release Schedule

- **Major Releases**: Scheduled 2-3 times per year
- **Minor Releases**: Scheduled monthly
- **Patch Releases**: Released as needed for bug fixes
- **Hotfixes**: Released immediately for critical issues

### Release Process

1. **Release Planning**:
   - Product management defines the scope of the release
   - Development team estimates effort and schedules work
   - QA team prepares test plans

2. **Development Phase**:
   - Features and bugfixes are developed on feature branches
   - Work is merged into `develop` as it's completed

3. **Release Preparation**:
   - Release branch is created from `develop`
   - Version numbers are updated
   - Final testing and QA is performed
   - Documentation is updated

4. **Release Approval**:
   - Release candidate is reviewed by release manager
   - QA certifies the release
   - Product management approves the release

5. **Release Execution**:
   - Release branch is merged to `main`
   - Code is tagged with the version number
   - Release is deployed to production
   - Release notes are published

6. **Post-Release Activities**:
   - Release is monitored for issues
   - Feedback is collected
   - Lessons learned are documented

### Release Artifacts

Each release includes the following artifacts:

- **Tagged Code**: The code in the repository is tagged with the version number
- **Release Notes**: Detailed description of changes, improvements, and bug fixes
- **Deployment Artifacts**: Docker images, compiled code, etc.
- **Documentation Updates**: Updated documentation reflecting the changes

## Tagging Strategy

TuneMantra uses Git tags to mark specific points in the repository's history, primarily for releases and significant milestones.

### Tag Format

- **Release Tags**: `v<major>.<minor>.<patch>`
  - Example: `v2.3.0`, `v2.3.1`

- **Pre-release Tags**: `v<major>.<minor>.<patch>-<pre-release>`
  - Example: `v2.4.0-beta.1`, `v2.4.0-rc.2`

- **Milestone Tags**: `milestone-<name>`
  - Example: `milestone-international-expansion`

### Tagging Process

1. Tags are created using annotated tags to include additional metadata:
   ```
   git tag -a v2.3.0 -m "Version 2.3.0 - March 2025 Release"
   ```

2. Tags are pushed to the remote repository:
   ```
   git push origin v2.3.0
   ```

3. GitHub releases are created from tags with detailed release notes.

### Significant Tags

| Tag | Date | Description |
|-----|------|-------------|
| `v1.0.0` | 2023-11-15 | Initial production release |
| `v1.1.0` | 2023-12-20 | Added analytics dashboard |
| `v1.2.0` | 2024-01-25 | Added batch payment processing |
| `v1.3.0` | 2024-02-28 | Added multi-language support |
| `v2.0.0` | 2024-04-15 | Major architecture overhaul |
| `v2.1.0` | 2024-05-20 | Added AI-powered recommendations |
| `v2.2.0` | 2024-06-25 | Added blockchain integration |
| `v2.3.0` | 2024-08-10 | Added territory-specific distribution controls |
| `v2.4.0` | 2024-10-05 | Added advanced reporting features |
| `v2.5.0` | 2024-12-15 | Added multi-organization support |
| `v3.0.0` | 2025-02-20 | Complete API restructuring with GraphQL |

## Deployment Pipeline

TuneMantra uses a robust CI/CD pipeline for automated testing, building, and deployment.

### CI/CD Tools

- **CI/CD Platform**: GitHub Actions
- **Container Registry**: Amazon ECR
- **Infrastructure Management**: Terraform
- **Orchestration**: Kubernetes
- **Monitoring**: Datadog, Prometheus

### Pipeline Stages

1. **Lint & Style Check**:
   - Analyzes code for potential errors and style guide compliance
   - Runs on all branches for every push and PR

2. **Build**:
   - Compiles the application code
   - Builds Docker images
   - Runs on all branches for every push and PR

3. **Unit Tests**:
   - Runs unit tests with code coverage reporting
   - Runs on all branches for every push and PR

4. **Integration Tests**:
   - Runs integration tests against a test database
   - Runs on all branches for every push and PR

5. **Security Scan**:
   - Scans code and dependencies for vulnerabilities
   - Runs on all branches for every push and PR

6. **Deploy to Development**:
   - Deploys to the development environment
   - Runs automatically when changes are merged to `develop`

7. **Deploy to Staging**:
   - Deploys to the staging environment
   - Runs automatically when a release branch is created

8. **E2E Tests**:
   - Runs end-to-end tests against the staging environment
   - Runs after deployment to staging

9. **Deploy to Production**:
   - Deploys to the production environment
   - Requires manual approval
   - Runs after merging to `main`

10. **Post-Deployment Tests**:
    - Runs smoke tests against the production environment
    - Verifies the deployment was successful

### Environment Configuration

| Environment | Branch | Auto-Deploy | URL | Purpose |
|-------------|--------|-------------|-----|---------|
| Development | `develop` | Yes | https://dev.tunemantra.com | Feature development and testing |
| Staging | `release/*` | Yes | https://staging.tunemantra.com | Pre-release testing and QA |
| Production | `main` | Manual approval | https://tunemantra.com | Production environment |

### Deployment Artifacts

Each deployment produces the following artifacts:

- **Docker Images**: Tagged with the commit SHA and version
- **Deployment Logs**: Stored in the CI/CD platform
- **Test Reports**: Generated for unit, integration, and E2E tests
- **Code Coverage Reports**: Generated for unit tests

## Repository History

The TuneMantra repository has evolved significantly since its inception. This section documents major milestones and significant changes in the repository's history.

### Repository Timeline

| Date | Event | Description |
|------|-------|-------------|
| 2023-06-15 | Repository Creation | Initial repository setup with basic structure |
| 2023-07-10 | MVP Implementation | Implementation of core features for MVP |
| 2023-08-20 | CI/CD Setup | Implementation of GitHub Actions for CI/CD |
| 2023-09-30 | First Beta Release | Release of beta version to select users |
| 2023-11-15 | v1.0.0 Release | First production release |
| 2024-01-05 | Database Migration | Migrated from MongoDB to PostgreSQL |
| 2024-02-15 | Frontend Framework Update | Migrated from Redux to React Query |
| 2024-04-15 | v2.0.0 Release | Major architecture overhaul |
| 2024-06-25 | Blockchain Integration | Added blockchain integration for rights management |
| 2024-08-10 | Multi-region Support | Added support for multi-region deployment |
| 2024-11-20 | API Restructuring | Redesigned API architecture |
| 2025-01-15 | GraphQL Implementation | Added GraphQL support |
| 2025-02-20 | v3.0.0 Release | Complete API restructuring with GraphQL |

### Major Architecture Changes

#### v1.0.0 to v2.0.0:

1. **Microservices Architecture**:
   - Transitioned from monolithic to modular architecture
   - Implemented service boundaries with clear interfaces
   - Improved scalability and deployment flexibility

2. **State Management Overhaul**:
   - Moved from central Redux store to React Query
   - Implemented context-based state for global state
   - Improved data fetching and caching strategy

3. **Database Restructuring**:
   - Migrated from MongoDB to PostgreSQL
   - Implemented proper relational data modeling
   - Added data versioning and history tracking

#### v2.0.0 to v3.0.0:

1. **API Modernization**:
   - Implemented GraphQL alongside REST API
   - Redesigned API gateway with improved rate limiting
   - Added comprehensive API documentation

2. **Security Enhancements**:
   - Implemented RBAC (Role-Based Access Control)
   - Added multi-factor authentication
   - Improved audit logging and traceability

3. **Performance Optimizations**:
   - Implemented data caching strategy
   - Optimized database queries and indexes
   - Added lazy loading and code splitting in frontend

### Significant Branches

| Branch Name | Created | Merged | Purpose |
|-------------|---------|--------|---------|
| `feature/core-platform` | 2023-06-20 | 2023-07-15 | Initial platform implementation |
| `feature/royalty-calculations` | 2023-07-25 | 2023-08-30 | Implementation of royalty calculation engine |
| `feature/distribution-system` | 2023-09-05 | 2023-10-10 | Implementation of content distribution system |
| `feature/analytics-dashboard` | 2023-10-20 | 2023-11-25 | Implementation of analytics dashboard |
| `feature/api-v2` | 2024-01-10 | 2024-03-15 | Implementation of API v2 |
| `feature/blockchain-integration` | 2024-04-05 | 2024-06-20 | Implementation of blockchain integration |
| `feature/multi-organization` | 2024-07-15 | 2024-09-20 | Implementation of multi-organization support |
| `feature/graphql-api` | 2024-10-05 | 2025-01-10 | Implementation of GraphQL API |

## Code Review Process

Code reviews are a critical part of TuneMantra's development process, ensuring code quality, knowledge sharing, and collaboration.

### Code Review Guidelines

1. **When to Request a Review**:
   - All code changes must be reviewed before merging
   - PRs should be kept small and focused
   - PRs should address a single concern

2. **Who Should Review**:
   - At least one review from a team member is required
   - Code owners are automatically requested for review
   - Senior engineers review architectural changes

3. **What to Review**:
   - Code correctness and logic
   - Test coverage and quality
   - Performance considerations
   - Security implications
   - Adherence to coding standards
   - Documentation

4. **How to Review**:
   - Be respectful and constructive
   - Focus on the code, not the person
   - Explain reasoning behind suggestions
   - Separate "must fix" from "nice to have"

### Code Review Process

1. **PR Preparation**:
   - Developer ensures all tests pass locally
   - Developer adds meaningful PR description
   - Developer completes the PR checklist

2. **Initial Checks**:
   - CI/CD pipeline runs automated checks
   - Code coverage is verified
   - Linting and style are checked

3. **Review Request**:
   - Developer requests reviews from appropriate reviewers
   - Code owners are automatically notified

4. **Review and Feedback**:
   - Reviewers examine the code and provide feedback
   - Developer addresses feedback with code changes or explanations

5. **Approval and Merge**:
   - Once approved by required reviewers, the PR can be merged
   - The developer or release manager merges the PR
   - The branch is deleted after merging

### Code Review Metrics

The following metrics are tracked to ensure a healthy code review process:

- **Time to First Review**: Average time from PR creation to first review
- **Time to Merge**: Average time from PR creation to merge
- **Comments per PR**: Average number of comments per PR
- **Approval Rate**: Percentage of PRs approved on first review
- **Revision Rate**: Average number of revisions per PR

## Configuration Management

TuneMantra's configuration management strategy ensures secure, environment-specific configuration with appropriate access controls.

### Configuration Types

1. **Application Configuration**:
   - Environment-specific settings
   - Feature flags
   - Service endpoints
   - Logging levels

2. **Infrastructure Configuration**:
   - Terraform configurations
   - Kubernetes manifests
   - CI/CD pipeline configurations

3. **Security Configuration**:
   - Authentication settings
   - Authorization rules
   - API keys and secrets

### Configuration Storage

1. **Environment Variables**:
   - Used for environment-specific configuration
   - Injected at runtime
   - Managed through environment-specific `.env` files

2. **Configuration Files**:
   - Used for static configuration
   - Version-controlled in the repository
   - Environment-specific files for different environments

3. **Secret Management**:
   - Sensitive information stored in AWS Secrets Manager
   - Accessed at runtime with appropriate permissions
   - Never stored in version control

### Configuration Hierarchy

Configuration is loaded in the following order, with later sources overriding earlier ones:

1. Default configurations from code
2. Configuration files from the repository
3. Environment variables
4. Secrets from the secret management system

### Environment Configuration

| Environment | Configuration Source | Access Control |
|-------------|----------------------|----------------|
| Local Development | `.env.local` (gitignored) | Developer-managed |
| Development | `.env.development` + AWS Secrets | Accessible to all developers |
| Staging | `.env.staging` + AWS Secrets | Accessible to developers and DevOps |
| Production | `.env.production` + AWS Secrets | Restricted to DevOps and release managers |

## Appendix

### Repository Governance

The TuneMantra repository is governed by the following roles and responsibilities:

- **Repository Administrators**:
  - Chief Technology Officer
  - VP of Engineering
  - Lead DevOps Engineer

- **Code Owners**:
  - Frontend Lead: `client/`
  - Backend Lead: `server/`
  - DevOps Lead: `infrastructure/`, `.github/`
  - Data Lead: `migrations/`, `server/src/db/`

- **Release Managers**:
  - Engineering Manager
  - Product Manager
  - QA Manager

### Commit Access Control

| Role | Access Level | Description |
|------|-------------|-------------|
| Administrator | Full access | Can push to all branches, merge to protected branches |
| Maintainer | Write access | Can push to unprotected branches, merge PRs to protected branches after approval |
| Developer | Write access (limited) | Can push to feature branches, create PRs |
| External Contributor | Fork + PR | Can fork the repository and create PRs |

### Branch Protection Rules

| Branch Pattern | Rules |
|----------------|-------|
| `main` | - Require pull request<br>- Require 2 approvals<br>- Require code owner review<br>- Require CI checks<br>- No force push<br>- Restricted push access |
| `develop` | - Require pull request<br>- Require 1 approval<br>- Require CI checks<br>- No force push |
| `release/*` | - Require pull request<br>- Require 1 approval<br>- Require CI checks<br>- No force push |

### Merge Commit Policy

TuneMantra uses a "rebase and merge" strategy for feature branches to maintain a clean, linear history. This means:

1. Feature branches are rebased on the latest `develop` before merging
2. Merge commits are avoided when possible
3. Squash merging is used for small PRs with multiple small commits

### Repository Backup Strategy

The repository is backed up using the following strategy:

1. **GitHub Enterprise Backup**:
   - Automatic daily backups
   - Retention policy: 30 days

2. **External Backup**:
   - Weekly full repository clone to secure storage
   - Retention policy: 1 year

3. **Disaster Recovery**:
   - Repository can be restored from GitHub Enterprise backup
   - Critical configurations are stored in multiple locations

---

© 2023-2025 TuneMantra. All rights reserved.