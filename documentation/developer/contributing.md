# Contributing to TuneMantra

Thank you for your interest in contributing to TuneMantra! This guide will help you understand our development process and how you can contribute effectively to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. We expect all contributors to be respectful, inclusive, and considerate of others.

## Development Workflow

### Branch Strategy

We follow a Git Flow-inspired branching strategy:

- `main`: Production-ready code
- `develop`: Latest development changes
- `feature/*`: New features and enhancements
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical fixes for production
- `release/*`: Release preparation branches

### Issue Tracking

We use GitHub Issues for tracking tasks, bugs, and feature requests:

1. Check existing issues before creating new ones
2. Use issue templates when available
3. Include as much detail as possible
4. Add appropriate labels

### Pull Request Process

1. Fork the repository (external contributors)
2. Create a branch from `develop` with an appropriate prefix
3. Make your changes with clear, focused commits
4. Write or update tests as needed
5. Ensure linting and tests pass locally
6. Submit a pull request to `develop`
7. Reference any related issues in your PR

### Code Review

All contributions require a code review before merging:

1. At least one maintainer must approve your changes
2. Address any feedback from reviewers
3. Ensure CI checks pass
4. Maintainers will merge your PR once approved

## Development Environment

### Prerequisites

- Node.js 16+ and npm 7+
- PostgreSQL 13+
- Git

### Setup Instructions

1. Clone the repository
   ```bash
   git clone https://github.com/your-organization/tunemantra.git
   cd tunemantra
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. Initialize the database
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript features appropriately
- Define interfaces and types for better code quality
- Avoid using `any` when possible
- Use type narrowing instead of type assertions

### React Best Practices

- Use functional components with hooks
- Split large components into smaller, reusable ones
- Use appropriate component composition
- Follow React Query patterns for data fetching

### Backend Guidelines

- Follow RESTful API design principles
- Use appropriate HTTP status codes
- Validate input with Zod schemas
- Handle errors consistently

### General Style Guidelines

- Use meaningful variable and function names
- Write clear comments for complex logic
- Keep functions focused and small
- Follow the DRY (Don't Repeat Yourself) principle

## Testing

### Test Types

We use several types of tests:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test how components work together
- **API Tests**: Test API endpoints
- **End-to-End Tests**: Test complete user flows

### Writing Tests

- Each new feature should include tests
- Bug fixes should include tests that reproduce the issue
- Aim for high test coverage but prioritize critical paths
- Test both success and failure scenarios

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode during development
npm run test:watch
```

## Documentation

### Code Documentation

- Use JSDoc comments for functions and classes
- Document complex algorithms and business logic
- Keep comments up-to-date when changing code
- Document all exported functions and types

### User Documentation

- Update relevant user documentation when adding features
- Use clear, concise language
- Include examples and screenshots when helpful
- Place documentation in the appropriate directory

## Feature Requests and Enhancements

Have an idea for a new feature? Here's how to propose it:

1. Check existing issues to see if it's already been suggested
2. Create a new issue using the feature request template
3. Clearly describe the feature and its benefits
4. If possible, include mockups or technical details

## Bug Reports

Found a bug? Help us fix it by providing:

1. A clear description of the bug
2. Steps to reproduce the issue
3. Expected behavior vs. actual behavior
4. Environment details (browser, OS, device)
5. Screenshots or error messages if available

## Performance Considerations

When contributing, keep performance in mind:

- Be mindful of bundle size
- Optimize database queries
- Use appropriate indexing
- Test performance impact of changes
- Consider both client and server performance

## Accessibility

We strive to make TuneMantra accessible to all users:

- Ensure components meet WCAG 2.1 AA standards
- Use semantic HTML elements
- Provide text alternatives for non-text content
- Ensure keyboard navigability
- Test with screen readers when possible

## Security Best Practices

When contributing, consider security implications:

- Validate and sanitize all user inputs
- Use parameterized queries for database operations
- Follow the principle of least privilege
- Keep dependencies up to date
- Don't commit sensitive information

## Database Changes

When making database schema changes:

1. Update the schema definition in `shared/schema.ts`
2. Use Drizzle's migration system
3. Consider backward compatibility
4. Document significant changes
5. Test migrations thoroughly

## Versioning and Releases

We follow Semantic Versioning:

- **Major version**: Incompatible API changes
- **Minor version**: Backwards-compatible new features
- **Patch version**: Backwards-compatible bug fixes

## Licensing

By contributing to TuneMantra, you agree that your contributions will be licensed under the project's license.

## Getting Help

If you need help with the contribution process:

- Check the documentation
- Ask questions in GitHub issues
- Reach out to the core team

We appreciate your contributions and look forward to your involvement in making TuneMantra better!