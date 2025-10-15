# TuneMantra Developer Onboarding Guide

*Version: 1.0.0 (March 27, 2025)*

## Table of Contents

- [Introduction](#introduction)
- [Development Environment Setup](#development-environment-setup)
- [Project Architecture Overview](#project-architecture-overview)
- [Codebase Navigation](#codebase-navigation)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Debugging and Troubleshooting](#debugging-and-troubleshooting)
- [Deployment Process](#deployment-process)
- [Key Technologies](#key-technologies)
- [Communication Channels](#communication-channels)
- [Helpful Resources](#helpful-resources)
- [FAQs](#faqs)

## Introduction

Welcome to the TuneMantra development team! This guide is designed to help you get up to speed quickly and become a productive team member. It contains essential information about our development environment, workflow, coding standards, and more.

### About TuneMantra

TuneMantra is a multi-tenant music distribution platform that enables artists, labels, and distributors to manage, distribute, and monetize music content across global digital platforms. The platform handles the complete lifecycle from content ingestion to royalty distribution and provides comprehensive analytics.

Key features include:
- Content and metadata management
- Global distribution to 150+ digital service providers
- Rights and ownership management
- Royalty calculation and payment processing
- Advanced analytics and reporting

### Project Goals

Our development goals are aligned with the following principles:
1. Build a scalable, secure, and reliable platform
2. Provide an exceptional user experience for all stakeholders
3. Maintain high code quality and test coverage
4. Enable rapid feature development with minimal technical debt
5. Support multi-tenancy with strong data isolation

## Development Environment Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Git**: Version 2.30.0 or higher
- **Node.js**: Version 18.x LTS or higher
- **npm**: Version 9.x or higher
- **Docker**: Version 24.x or higher
- **Docker Compose**: Version 2.x or higher
- **PostgreSQL client tools**: Version 14.x or higher
- **VS Code** (recommended) or your preferred IDE

### Environment Setup Steps

1. **Clone the Repository**

```bash
git clone git@github.com:tunemantra/tunemantra-platform.git
cd tunemantra-platform
```

2. **Configure Git**

Set up Git with your username and email:

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

Set up commit signing with your GPG key:

```bash
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_GPG_KEY_ID
```

3. **Install Dependencies**

```bash
npm install
```

4. **Set Up Environment Variables**

Copy the example environment file and update it with your local settings:

```bash
cp .env.example .env.development.local
```

Edit `.env.development.local` with appropriate values. Contact your team lead to obtain necessary secrets for development.

5. **Initialize Development Database**

```bash
npm run db:setup
```

This will create the database schema and seed it with initial data.

6. **Start the Development Environment**

```bash
npm run dev
```

This will start the development server with hot-reloading enabled.

7. **Verify Setup**

Open your browser and navigate to:

```
http://localhost:3000
```

You should see the TuneMantra application running.

### Docker Development Environment

Alternatively, you can use Docker for development:

```bash
docker-compose -f docker-compose.dev.yml up
```

This will set up the complete development environment, including the database, Redis, and other services.

### IDE Configuration

#### VS Code Setup

For VS Code users, we recommend the following extensions:

- ESLint
- Prettier
- TypeScript Hero
- GitLens
- Docker
- PostgreSQL
- EditorConfig

We've included a `.vscode` directory in the repository with recommended settings. To use them:

1. Open the project in VS Code
2. Go to File > Preferences > Settings
3. Click "Workspace" tab to see project-specific settings

#### IntelliJ/WebStorm Setup

For IntelliJ/WebStorm users:

1. Enable ESLint integration
2. Enable Prettier integration
3. Set TypeScript compiler to use project version
4. Configure Node.js interpreter to use project version

## Project Architecture Overview

TuneMantra follows a modern, modular architecture designed for scalability and maintainability.

### High-Level Architecture

The platform is organized into several key components:

1. **Client Application**: React-based frontend with modular feature organization
2. **API Layer**: Express.js-based REST API with GraphQL support
3. **Service Layer**: Business logic implementing core functionality
4. **Data Access Layer**: Database interaction with Drizzle ORM
5. **Infrastructure Layer**: Docker, Kubernetes, and cloud resources

### Architectural Diagrams

For a visual representation of the architecture, refer to:
- [System Architecture Diagram](../diagrams/system-architecture-diagram.svg)
- [API Overview Diagram](../diagrams/api-overview-diagram.svg)
- [Distribution System Overview](../diagrams/distribution-system-overview.svg)

### Security Architecture

Security is a foundational aspect of the platform. Our security model includes:

- Identity and access management
- Data protection measures
- Network security controls
- Application security practices
- Compliance framework

For more details, see the [Security Model Documentation](../technical/security-model.md).

### Database Structure

The platform uses PostgreSQL as the primary database, with additional specialized data stores:

- **PostgreSQL**: Primary transactional database
- **Redis**: Caching and session storage
- **Elasticsearch**: Search functionality
- **Amazon S3**: File storage

Refer to the database schema documentation for details on tables, relationships, and indexes.

## Codebase Navigation

Understanding the codebase structure is key to effective development. Here's a guide to the main directories:

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
└── examples/                  # Example implementations
```

### Client Structure

```
client/
├── public/                    # Static assets
├── src/                       # Source code
│   ├── api/                   # API client code
│   ├── assets/                # Images, fonts, etc.
│   ├── components/            # React components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Page components
│   ├── routes/                # Routing configuration
│   ├── services/              # Service layer
│   ├── store/                 # State management
│   ├── styles/                # Global styles
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
└── tests/                     # Frontend tests
```

### Server Structure

```
server/
├── src/                       # Source code
│   ├── api/                   # API routes and controllers
│   ├── config/                # Server configuration
│   ├── db/                    # Database connection and models
│   ├── middleware/            # Express middleware
│   ├── services/              # Business logic
│   ├── utils/                 # Utility functions
│   └── types/                 # TypeScript type definitions
└── tests/                     # Backend tests
```

### Key Files

Some important files to be aware of:

- `package.json`: Project dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `.env.example`: Example environment variables
- `docker-compose.yml`: Docker compose configuration
- `shared/schema.ts`: Database schema definition
- `server/api/index.ts`: API route registration
- `client/src/app.tsx`: Main React application entry point

## Development Workflow

### Git Workflow

We follow a modified GitFlow branching strategy:

1. **Main Branches**:
   - `main`: Production code
   - `develop`: Development code

2. **Feature Development**:
   - Create a feature branch from `develop`
   - Name it according to the convention: `feature/TM-XXX-short-description`
   - Develop, test, and commit your changes
   - Create a pull request back to `develop`

3. **Bugfixes**:
   - For non-critical bugs: Create a branch from `develop` named `bugfix/TM-XXX-short-description`
   - For critical production bugs: Create a branch from `main` named `hotfix/TM-XXX-short-description`

4. **Pull Requests**:
   - Ensure all tests pass
   - Get at least one code review
   - Address all comments
   - Squash commits if necessary

For a detailed explanation of our Git strategy, see the [Repository Documentation](./repository-documentation.md).

### Issue Tracking

We use Jira for issue tracking:

1. All development work should be associated with a Jira ticket
2. Use the ticket ID in branch names and commit messages
3. Move tickets through the appropriate workflow states
4. Link pull requests to the relevant tickets

### Development Cycle

Our typical development cycle follows these steps:

1. **Planning**:
   - Requirements gathering
   - Task breakdown
   - Estimation

2. **Development**:
   - Feature implementation
   - Unit testing
   - Code review

3. **Testing**:
   - Integration testing
   - QA verification
   - Bug fixing

4. **Deployment**:
   - Staging deployment
   - Final verification
   - Production deployment

5. **Monitoring**:
   - Performance monitoring
   - Error tracking
   - Usage analytics

### Local Development Tasks

Common development tasks:

**Start Development Server**
```bash
npm run dev
```

**Run Tests**
```bash
npm test                # Run all tests
npm run test:unit       # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e        # Run end-to-end tests
```

**Lint Code**
```bash
npm run lint            # Lint all code
npm run lint:fix        # Fix linting issues
```

**Format Code**
```bash
npm run format
```

**Database Operations**
```bash
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database
npm run db:generate     # Generate migration
npm run db:push         # Push schema changes
```

## Coding Standards

Following consistent coding standards helps maintain codebase quality and readability.

### TypeScript Guidelines

- Use TypeScript for all new code
- Define interfaces for data structures
- Use proper type annotations
- Avoid using `any` type
- Leverage TypeScript's advanced features (generics, mapped types, etc.)

### JavaScript/TypeScript Style

We follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with some modifications:

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use template literals for string interpolation
- Use camelCase for variables and functions
- Use PascalCase for classes and React components
- Use UPPER_CASE for constants

ESLint and Prettier are configured to enforce these rules.

### React Best Practices

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component names
- Implement proper prop validation
- Follow logical folder structure
- Separate business logic from UI
- Use code splitting for performance

### API Design Principles

- Follow RESTful design principles
- Use appropriate HTTP methods and status codes
- Implement consistent error handling
- Use proper versioning
- Document all endpoints
- Implement rate limiting and security measures

For detailed API guidelines, see the [API Reference Documentation](./api-reference.md).

### Testing Standards

- Write tests for all business logic
- Aim for high test coverage (at least 80%)
- Follow the AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Mock external dependencies
- Organize tests to mirror the source code structure

### Code Comments

- Use JSDoc for function and class documentation
- Add comments for complex logic
- Avoid obvious comments
- Keep comments updated as code changes
- Use TODO, FIXME, and NOTE tags when appropriate

## Testing Guidelines

Comprehensive testing is essential for maintaining code quality and preventing regressions.

### Testing Approach

We employ several levels of testing:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test interactions between components
3. **End-to-End Tests**: Test complete user flows
4. **Performance Tests**: Test system performance under load

### Testing Technologies

- **Jest**: For unit and integration testing
- **React Testing Library**: For React component testing
- **Cypress**: For end-to-end testing
- **Supertest**: For API testing
- **k6**: For performance testing

### Unit Testing

Unit tests should be:
- Fast and focused
- Independent of external resources
- Comprehensive in coverage
- Easy to understand and maintain

Example unit test:

```typescript
import { calculateRoyalty } from '../services/royalty';

describe('calculateRoyalty', () => {
  it('calculates correct royalty for standard rate', () => {
    const result = calculateRoyalty({
      revenue: 100,
      rate: 0.7,
      territory: 'US'
    });
    
    expect(result).toBe(70);
  });

  it('applies minimum guarantee when applicable', () => {
    const result = calculateRoyalty({
      revenue: 10,
      rate: 0.7,
      minimumGuarantee: 10,
      territory: 'US'
    });
    
    expect(result).toBe(10);
  });
});
```

### Integration Testing

Integration tests verify that components work together correctly:

```typescript
import request from 'supertest';
import app from '../app';
import { db } from '../db';

describe('Royalty API', () => {
  beforeAll(async () => {
    await db.migrate.latest();
    await db.seed.run();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('returns calculated royalties for a release', async () => {
    const response = await request(app)
      .get('/api/royalties/release/123')
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1250.75);
    expect(response.body.items).toHaveLength(3);
  });
});
```

### End-to-End Testing

E2E tests verify complete user flows:

```typescript
describe('Release Creation', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password');
  });

  it('creates a new release with tracks', () => {
    cy.visit('/releases/new');
    cy.get('#title').type('New Album');
    cy.get('#artist').type('Test Artist');
    cy.get('#release-date').type('2025-04-01');
    cy.get('#add-track').click();
    cy.get('#track-title-0').type('Track 1');
    cy.get('#track-duration-0').type('3:45');
    cy.get('#save-release').click();
    
    cy.url().should('include', '/releases/');
    cy.contains('New Album').should('be.visible');
    cy.contains('Release created successfully').should('be.visible');
  });
});
```

### Test Coverage

We aim for high test coverage:
- 90%+ coverage for critical business logic
- 80%+ coverage for services and API controllers
- 70%+ coverage for UI components

Run coverage reports using:
```bash
npm run test:coverage
```

## Debugging and Troubleshooting

### Common Development Issues

**Database Connection Issues**
- Check that PostgreSQL is running
- Verify connection string in `.env` file
- Ensure database exists and has correct permissions

**API Errors**
- Check server logs for detailed error messages
- Verify that the request has the correct format and authentication
- Check for rate limiting or permission issues

**Frontend Build Problems**
- Clear npm cache: `npm cache clean --force`
- Remove `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run tsc`

### Debugging Tools

**Server-side Debugging**
- Use `console.log()` for quick debugging
- Add `debugger` statement for Node.js debugging
- Use VS Code's built-in debugger (launch configurations are provided)

**Client-side Debugging**
- Use browser dev tools (Chrome DevTools recommended)
- React DevTools extension for component inspection
- Redux DevTools for state management debugging
- Network tab for API request inspection

**Database Debugging**
- Use pgAdmin or similar tools to inspect database
- SQL query logging is enabled in development
- Database migrations can be rolled back with `npm run db:rollback`

### Logging

We use structured logging to facilitate debugging:

```typescript
import logger from '../utils/logger';

// Log levels: error, warn, info, debug
logger.info('Processing payment', { userId: 123, amount: 50.25 });
logger.error('Payment failed', { error: err.message, transactionId: 'tx_123' });
```

In development, logs are output to the console. In production, logs are sent to our centralized logging system.

## Deployment Process

### Environments

We maintain several environments:

1. **Development**: For active development work
2. **Testing**: For automated testing and QA
3. **Staging**: Mirror of production for final verification
4. **Production**: Live system serving real users

### Continuous Integration / Continuous Deployment

Our CI/CD pipeline is built with GitHub Actions:

1. Code is committed to a feature branch
2. Pull request is opened
3. Automated tests run (lint, unit, integration)
4. Manual code review is performed
5. PR is merged to develop
6. Build is created and deployed to development environment
7. When ready for release:
   - Release branch is created
   - Final testing is conducted
   - Deployed to staging environment
   - After verification, deployed to production

### Deployment Commands

**Manual Deployment (Not Recommended)**
```bash
npm run build
npm run deploy:staging  # or deploy:production
```

**Infrastructure Updates**
```bash
cd infrastructure
terraform apply -var-file=environments/production.tfvars
```

### Release Process

1. Update version in `package.json`
2. Generate release notes
3. Create release branch
4. Deploy to staging
5. Perform release testing
6. Deploy to production
7. Tag the release
8. Merge back to develop

## Key Technologies

### Frontend

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **React Query**: Data fetching and state management
- **React Router**: Routing
- **Tailwind CSS**: Styling
- **Shadcn/UI**: Component library
- **Vite**: Build tool

### Backend

- **Node.js**: Runtime environment
- **Express**: Web framework
- **TypeScript**: Type-safe JavaScript
- **Drizzle ORM**: Database ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **Jest**: Testing framework

### Infrastructure

- **Docker**: Containerization
- **Kubernetes**: Container orchestration
- **Terraform**: Infrastructure as Code
- **AWS**: Cloud infrastructure
- **GitHub Actions**: CI/CD

### Monitoring and Observability

- **Datadog**: Monitoring and observability
- **Sentry**: Error tracking
- **ELK Stack**: Logging
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization

## Communication Channels

Effective communication is essential for successful collaboration.

### Team Channels

- **Daily Standup**: 10:00 AM Eastern Time, Monday-Friday via Zoom
- **Sprint Planning**: Biweekly on Monday, 1:00 PM Eastern Time
- **Retrospective**: Biweekly on Friday, 3:00 PM Eastern Time
- **Tech Sync**: Weekly on Wednesday, 11:00 AM Eastern Time

### Communication Tools

- **Slack**: Primary communication tool
  - `#tm-development`: General development discussion
  - `#tm-deployments`: Deployment notifications
  - `#tm-production-alerts`: Production alerts
  - `#tm-help`: Help and troubleshooting

- **Jira**: Task and issue tracking
- **Confluence**: Documentation and knowledge base
- **GitHub**: Code review and collaboration
- **Google Meet/Zoom**: Video conferencing

### Asking for Help

When you need assistance:

1. Check existing documentation
2. Search Slack history
3. Ask in the appropriate Slack channel
4. Tag specific team members if needed
5. Be specific about the problem and what you've already tried

## Helpful Resources

### Internal Resources

- [TuneMantra Architecture Documentation](../technical/comprehensive-system-architecture.md)
- [API Reference](./api-reference.md)
- [Database Schema Documentation](../technical/database-schema.md)
- [Coding Standards Guide](./coding-standards.md)
- [Security Guidelines](../technical/security-model.md)

### External Learning Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

### Recommended Reading

- "Clean Code" by Robert C. Martin
- "Refactoring" by Martin Fowler
- "Patterns of Enterprise Application Architecture" by Martin Fowler
- "Domain-Driven Design" by Eric Evans
- "Building Microservices" by Sam Newman

## FAQs

### Development Environment

**Q: How do I reset my development database?**

A: Run the following commands:
```bash
npm run db:drop
npm run db:setup
```

**Q: How do I update my local dependencies?**

A: Run:
```bash
npm update
```

**Q: How do I access the staging environment?**

A: Staging is available at https://staging.tunemantra.com. Contact your team lead for access credentials.

### Common Procedures

**Q: How do I create a new API endpoint?**

A: 
1. Define the route in the appropriate route file under `server/api/routes`
2. Implement the controller function
3. Add validation using Zod schemas
4. Add tests for the new endpoint
5. Document the endpoint in the API reference

**Q: How do I add a new database table?**

A:
1. Add the table definition to `shared/schema.ts`
2. Create a migration using `npm run db:generate my_migration_name`
3. Run the migration using `npm run db:migrate`
4. Add any necessary seed data
5. Update the data access layer to use the new table

**Q: How do I manage feature flags?**

A:
1. Add the feature flag to the `FeatureFlag` enum in `shared/types/features.ts`
2. Add the default value to the feature flags configuration
3. Use the `useFeatureFlag` hook in the frontend or the `isFeatureEnabled` function in the backend

### Getting Help

**Q: Who should I contact for specific issues?**

A:
- **Backend issues**: Contact the backend team lead
- **Frontend issues**: Contact the frontend team lead
- **DevOps issues**: Contact the DevOps team lead
- **Security concerns**: Contact the security team

**Q: How do I report a bug?**

A: Create a ticket in Jira with the following information:
- Clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots or videos if applicable
- Any relevant logs or error messages

---

© 2023-2025 TuneMantra. All rights reserved.