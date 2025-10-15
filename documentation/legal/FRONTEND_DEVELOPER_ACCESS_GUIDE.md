# LIMITED REPOSITORY ACCESS GUIDE FOR FRONTEND DEVELOPERS

## Overview

This document outlines the implementation of limited repository access for frontend developers and their teams working on the TuneMantra platform. By providing access only to specific repository branches or components, we can enhance security and protect intellectual property while still enabling effective development workflows.

## Access Control Principles

### Principle of Least Privilege

Frontend developers should have access only to the code and resources necessary to perform their assigned tasks. This helps to:

1. Minimize risk of accidental exposure of sensitive code
2. Reduce the risk of intentional data exfiltration
3. Limit the scope of potential leaks
4. Create a clear audit trail of which developers had access to which components

### Separation of Concerns

The TuneMantra codebase should be structured to allow for clear separation between:

1. Frontend presentation layer
2. API interfaces
3. Business logic
4. Data access layer
5. Blockchain integration
6. Rights management system

## Repository Access Implementation

### Git Access Control Strategies

#### 1. Branch-based Access Control

For frontend development teams, implement the following branch structure:

```
main
├── frontend-main (read-only for all frontend developers)
│   ├── feature/frontend/user-dashboard (team-specific)
│   ├── feature/frontend/artist-portal (team-specific)
│   ├── feature/frontend/analytics-view (team-specific)
│   └── feature/frontend/distribution-interface (team-specific)
```

**Implementation:**
- Create branch protection rules in GitHub/GitLab to restrict push access
- Configure CODEOWNERS files to automatically assign reviews
- Set up branch policies requiring approvals from designated reviewers

#### 2. Submodule-based Access Control

Split the repository into submodules, with frontend developers only having access to frontend submodules:

```
tunemantra-main (restricted access)
├── tunemantra-frontend (frontend team access)
├── tunemantra-api (restricted access)
├── tunemantra-core (restricted access)
├── tunemantra-blockchain (restricted access)
└── tunemantra-rights (restricted access)
```

**Implementation:**
- Create separate repositories for each submodule
- Set up appropriate access control on each repository
- Use Git submodules to integrate all components in the main repository
- Implement automated CI/CD that pulls in changes from submodules

#### 3. Monorepo with Access Control

If using a monorepo approach, implement path-based access restrictions:

```
/
├── client/ (frontend team access)
├── server/ (restricted access)
├── shared/ (read-only access for all teams)
└── scripts/ (restricted access)
```

**Implementation:**
- Use GitHub/GitLab path-based permissions to restrict access to specific directories
- Implement pre-commit hooks to prevent unauthorized changes
- Configure CI/CD to enforce access control policies

### API Design for Limited Access

Design APIs to expose only the necessary functionality to frontend developers:

1. Create well-documented API interfaces with clear contracts
2. Use API gateways to abstract away backend implementation details
3. Provide mock API services for frontend development
4. Separate API specification from implementation

### Mock Data and Services

Provide frontend developers with mock data and services to enable development without direct access to backend systems:

1. Create comprehensive mock data sets that represent realistic but non-sensitive data
2. Implement mock API servers that simulate backend behavior
3. Provide frontend-specific test environments
4. Document all mock services thoroughly

## Access Management Process

### 1. Developer Onboarding

When onboarding a frontend developer or team:

1. Create team-specific accounts in your source control system
2. Grant access only to required frontend repositories/branches
3. Provide read-only access to API documentation and shared types
4. Configure developer workstations with appropriate Git credentials
5. Document all access grants with justification and duration

### 2. Team-based Access Control

Organize frontend developers into teams with specific access patterns:

| Team | Repository Access | Branch Access | Additional Access |
|------|-------------------|--------------|-------------------|
| UI/UX Team | client/* | frontend-main, feature/frontend/ui-components | design-systems repository |
| Dashboard Team | client/src/pages/dashboard/* | frontend-main, feature/frontend/user-dashboard | dashboard-mockups repository |
| Artist Portal Team | client/src/pages/artist/* | frontend-main, feature/frontend/artist-portal | artist-portal-design repository |
| Distribution UI Team | client/src/pages/distribution/* | frontend-main, feature/frontend/distribution-interface | distribution-mockups repository |

### 3. Time-limited Access

Implement time-limited access for all external developers:

1. Grant access for specific project duration
2. Require access renewal at regular intervals (e.g., every 30 days)
3. Automatically remove access when project milestones are completed
4. Conduct regular access audits

### 4. Access Monitoring

Implement monitoring of repository access:

1. Enable comprehensive audit logging in your source control system
2. Monitor unusual access patterns (e.g., accessing unfamiliar code areas)
3. Track downloads of large portions of the codebase
4. Set up alerts for suspicious activities

## Practical Implementation Guide

### GitHub Implementation

1. **Create Team-specific Repositories**:
   ```bash
   # Create frontend-specific repository
   gh repo create tunemantra-frontend --private
   ```

2. **Configure Branch Protection**:
   ```bash
   # Protect main branch
   gh api repos/tunemantra/tunemantra-frontend/branches/main/protection \
     --method PUT \
     --input branch-protection.json
   ```

3. **Set Up Team Permissions**:
   ```bash
   # Create team
   gh api orgs/tunemantra/teams --method POST \
     -f name='Frontend Dashboard Team' \
     -f privacy='closed'
     
   # Set team permissions
   gh api orgs/tunemantra/teams/frontend-dashboard/repos/tunemantra/tunemantra-frontend \
     --method PUT \
     -f permission='push'
   ```

4. **Configure CODEOWNERS**:
   
   Create a `CODEOWNERS` file in the repository:
   ```
   # Frontend code ownership
   /client/src/pages/dashboard/* @dashboard-team
   /client/src/pages/artist/* @artist-portal-team
   /client/src/pages/distribution/* @distribution-team
   /client/src/components/* @ui-team
   ```

### GitLab Implementation

1. **Create Project Access Tokens**:
   - Navigate to Settings > Access Tokens
   - Create tokens with specific scopes (read_repository, write_repository)
   - Set appropriate expiration dates

2. **Configure Protected Branches**:
   - Navigate to Settings > Repository > Protected Branches
   - Add protection rules for main and other critical branches
   - Set merge access levels to appropriate roles

3. **Set Up Deploy Keys**:
   - Use deploy keys for CI/CD systems instead of user accounts
   - Limit deploy key access to specific repositories

4. **Create Group-level Access**:
   - Create groups for different frontend teams
   - Assign appropriate access levels to each group

## Frontend Developer Workflow

### Code Access Workflow

1. Developer is onboarded and granted access to specific repository/branches
2. Developer clones only the frontend repository
3. Developer creates feature branches from the frontend-main branch
4. Pull requests are created against frontend-main
5. Designated reviewers approve changes
6. Changes are merged to frontend-main
7. CI/CD pipeline integrates frontend-main with the main application

### Mock API Development

For frontend developers without backend access:

1. Provide API specification documents (OpenAPI/Swagger)
2. Create mock API servers with example responses
3. Document all available endpoints and data structures
4. Provide sandboxed test environments

### Example Commands for Frontend Developers

```bash
# Clone only the frontend repository
git clone https://github.com/tunemantra/tunemantra-frontend.git

# Create a new feature branch
git checkout -b feature/user-dashboard-improvements

# Work on changes and commit
git add .
git commit -m "Improve user dashboard layout"

# Push changes to remote
git push origin feature/user-dashboard-improvements

# Create a pull request through GitHub/GitLab UI
```

## Integration with Watermarking System

The limited repository access approach works in conjunction with the code watermarking system:

1. Each frontend team receives a uniquely watermarked version of the frontend code
2. Watermarks are applied to the specific repositories/branches they have access to
3. The watermarking detection system can identify the source of any leaked code
4. Access logs provide additional verification of which teams had access to specific code

## Security Considerations

### Preventing Code Exfiltration

Even with limited repository access, implement these additional safeguards:

1. Disable or limit `git clone` depth to prevent full history access
2. Remove sensitive information from Git history
3. Use Git hooks to prevent committing sensitive data
4. Implement network monitoring for large data transfers
5. Disable USB storage on development workstations

### Code Review Security

Enforce security during the code review process:

1. Require multiple reviewers for sensitive changes
2. Use automated scanning tools to detect security issues
3. Validate that changes remain within authorized scope
4. Document all review decisions

## Conclusion

By implementing a robust limited repository access strategy for frontend developers and their teams, TuneMantra can effectively protect its intellectual property while still enabling productive development workflows. This approach, combined with code watermarking and proper legal agreements, creates multiple layers of protection for the company's valuable source code.

## Related Documentation

- [Code Watermarking Guide](CODE_WATERMARKING_GUIDE.md)
- [Developer NDA](DEVELOPER_NDA.md)
- [Software Development Contractor Agreement](SOFTWARE_DEVELOPMENT_CONTRACTOR_AGREEMENT.md)
- [Outsourced Developer Guidelines](OUTSOURCED_DEVELOPER_GUIDELINES.md)