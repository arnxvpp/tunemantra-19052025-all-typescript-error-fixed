# TuneMantra Coding Standards and Best Practices

*Version: 1.0.0 (March 27, 2025)*

## Table of Contents

- [Introduction](#introduction)
- [General Principles](#general-principles)
- [Code Formatting](#code-formatting)
- [Naming Conventions](#naming-conventions)
- [TypeScript and JavaScript](#typescript-and-javascript)
- [React Best Practices](#react-best-practices)
- [Node.js and Express](#nodejs-and-express)
- [Database and ORM](#database-and-orm)
- [API Design](#api-design)
- [Testing Standards](#testing-standards)
- [Security Best Practices](#security-best-practices)
- [Performance Considerations](#performance-considerations)
- [Documentation](#documentation)
- [Version Control](#version-control)
- [Code Review](#code-review)
- [Resources](#resources)

## Introduction

This document defines the coding standards and best practices for the TuneMantra platform. Consistent code quality is essential for maintainability, readability, and collaboration. All developers working on the TuneMantra codebase should adhere to these standards.

### Purpose

The purpose of these coding standards is to:

1. Ensure code consistency across the entire codebase
2. Improve code readability and maintainability
3. Reduce the cognitive load when switching between different parts of the codebase
4. Facilitate effective collaboration between team members
5. Minimize bugs and security vulnerabilities
6. Establish a framework for code reviews

### Enforcement

These standards are enforced through:

1. ESLint and Prettier configuration in the repository
2. Pre-commit hooks that run linting and formatting checks
3. CI/CD pipeline checks that fail if standards are not met
4. Code review process
5. Pair programming sessions

## General Principles

### Code Quality

1. **Readability**: Write code that is easy to read and understand
2. **Simplicity**: Prefer simple solutions over complex ones
3. **Modularity**: Break code into small, focused modules with clear responsibilities
4. **DRY (Don't Repeat Yourself)**: Avoid code duplication
5. **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until it's necessary
6. **SOLID Principles**: Follow object-oriented design principles when applicable

### Clean Code

1. **Single Responsibility**: Each function or class should have a single, well-defined responsibility
2. **Meaningful Names**: Use descriptive names for variables, functions, classes, and files
3. **Small Functions**: Keep functions small and focused on a single task
4. **Comments**: Write comments to explain "why" not "what" the code does
5. **Error Handling**: Handle errors appropriately and provide meaningful error messages
6. **No Side Effects**: Functions should not have hidden side effects

## Code Formatting

### Style Guide

We follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with some modifications. The specific rules are defined in the ESLint and Prettier configurations.

### Indentation and Spacing

1. Use 2 spaces for indentation (not tabs)
2. Add blank lines to improve readability and group related code
3. Limit line length to 100 characters
4. Use spaces around operators and after commas

```typescript
// Good
const sum = (a: number, b: number): number => {
  return a + b;
};

// Bad
const sum=(a:number,b:number):number=>{return a+b};
```

### Brackets and Braces

1. Opening braces should be on the same line as the statement
2. Always use braces for control statements, even for single-line blocks
3. Place closing braces on a new line

```typescript
// Good
if (condition) {
  doSomething();
}

// Bad
if (condition)
  doSomething();

// Also bad
if (condition) { doSomething(); }
```

### Semicolons

Always use semicolons at the end of statements.

```typescript
// Good
const x = 5;
const y = 10;

// Bad
const x = 5
const y = 10
```

### Quotes

Use single quotes for string literals, use template literals for string interpolation.

```typescript
// Good
const name = 'John';
const greeting = `Hello, ${name}!`;

// Bad
const name = "John";
const greeting = "Hello, " + name + "!";
```

## Naming Conventions

### General Rules

1. Use meaningful and descriptive names
2. Be consistent with naming patterns
3. Avoid abbreviations unless they are well-known
4. Use pronounceable names
5. Optimize for readability, not brevity

### Case Styles

1. **camelCase**: Variables, functions, methods, private properties
2. **PascalCase**: Classes, interfaces, types, enums, components
3. **UPPER_CASE**: Constants, enum values
4. **kebab-case**: File names, directory names, URLs

### Prefixes and Suffixes

1. Interface names should not have a prefix (no `I` prefix)
2. Type names should be descriptive of their purpose, not implementation
3. Boolean variables should use prefixes like `is`, `has`, `should` when appropriate
4. Handler functions should use the `handle` prefix (e.g., `handleSubmit`)

### Examples

```typescript
// Variables
const userName = 'John';
const isActive = true;
const MAX_RETRY_COUNT = 3;

// Functions
function calculateTotal(items) { ... }
const handleSubmit = () => { ... }

// Classes and interfaces
class UserService { ... }
interface AuthenticationOptions { ... }
type UserProfile = { ... }

// React components
function UserProfile() { ... }
```

### File and Directory Naming

1. React component files should be named with PascalCase (e.g., `UserProfile.tsx`)
2. Other TypeScript/JavaScript files should use kebab-case (e.g., `api-client.ts`)
3. Test files should have the same name as the file they're testing with a `.test` or `.spec` suffix
4. Directory names should be kebab-case and descriptive of their contents

## TypeScript and JavaScript

### TypeScript Usage

1. Use TypeScript for all new code
2. Define explicit return types for functions
3. Use interfaces for object shapes and API responses
4. Utilize TypeScript's type system to prevent errors
5. Avoid using `any` type whenever possible

```typescript
// Good
function getUserById(id: string): Promise<User> {
  return api.get(`/users/${id}`);
}

// Bad
function getUserById(id) {
  return api.get('/users/' + id);
}
```

### Type Declarations

1. Create types for all data structures
2. Use interfaces for object types that can be implemented or extended
3. Use type aliases for unions, intersections, and simple object types
4. Use enums for fixed sets of related values
5. Use generics for reusable components and functions

```typescript
// Interface example
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
}

// Enum example
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// Generic example
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### Type Safety

1. Use proper type guards to narrow types
2. Leverage TypeScript's control flow analysis
3. Use non-null assertion (`!`) only when you're absolutely sure
4. Use optional chaining (`?.`) and nullish coalescing (`??`) operators

```typescript
// Type guard example
function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string';
}

// Control flow analysis
function processUser(user: User | null) {
  if (!user) {
    return;
  }
  
  // TypeScript knows user is non-null here
  console.log(user.firstName);
}
```

### Async Code

1. Use `async/await` for asynchronous code
2. Handle errors with try/catch blocks
3. Be mindful of Promise chains and potential unhandled rejections
4. Avoid nested callbacks

```typescript
// Good
async function fetchData() {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// Bad
function fetchData() {
  return api.get('/data')
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error('Failed to fetch data:', error);
      throw error;
    });
}
```

## React Best Practices

### Component Structure

1. Prefer functional components with hooks over class components
2. Keep components small and focused on a single responsibility
3. Extract reusable logic into custom hooks
4. Split large components into smaller, more manageable pieces
5. Use the component composition pattern to combine components

```tsx
// Good - Small, focused component
function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="user-profile">
      <h2>{user.firstName} {user.lastName}</h2>
      <p>{user.email}</p>
      <UserStatus status={user.status} />
    </div>
  );
}

// Bad - Component doing too much
function UserDashboard({ userId }: UserDashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Fetch user, posts, comments
  // Render complex UI with all this data
}
```

### Props and State

1. Use TypeScript interfaces for prop types
2. Keep props simple and avoid deeply nested objects
3. Use default props when appropriate
4. Use React's state management hooks for component state
5. Consider context API for state that needs to be shared among components

```tsx
// Props interface
interface UserProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
  showDetails?: boolean;
}

// Component with default props
function UserProfile({
  user,
  onUpdateUser,
  showDetails = false
}: UserProfileProps) {
  // Component implementation
}

// State management
function Counter() {
  const [count, setCount] = useState(0);
  
  const increment = () => setCount(prev => prev + 1);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### Performance Optimization

1. Use React.memo for components that render often with the same props
2. Use useCallback for functions passed as props
3. Use useMemo for expensive calculations
4. Avoid unnecessary re-renders by keeping component state minimal
5. Use virtualization for long lists (react-window or react-virtualized)

```tsx
// Memoized component
const UserItem = React.memo(function UserItem({ user, onSelect }: UserItemProps) {
  return (
    <div onClick={() => onSelect(user.id)}>
      {user.name}
    </div>
  );
});

// useCallback and useMemo example
function UserList({ users }: UserListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);
  
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);
  
  return (
    <div>
      {sortedUsers.map(user => (
        <UserItem
          key={user.id}
          user={user}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

### React Query and State Management

1. Use React Query for server state management
2. Use the appropriate caching strategy for different data types
3. Handle loading, error, and success states properly
4. Implement proper query invalidation strategies
5. Use query keys that reflect the semantics of the data being fetched

```tsx
// React Query example
function UserDetails({ userId }: UserDetailsProps) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;
  
  return (
    <div>
      <h1>{user.name}</h1>
      {/* Rest of component */}
    </div>
  );
}

// Mutation example
function UserForm({ user }: UserFormProps) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (updatedUser: User) => updateUser(updatedUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      toast.success('User updated successfully');
    },
  });
  
  const handleSubmit = (formData: UserFormData) => {
    mutation.mutate({ ...user, ...formData });
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </Button>
    </Form>
  );
}
```

### React Hooks

1. Follow the rules of hooks
2. Keep custom hooks focused on a single concern
3. Name hooks with a `use` prefix
4. Keep hooks pure (avoid side effects outside of appropriate lifecycle hooks)
5. Handle cleanup in useEffect when necessary

```tsx
// Custom hook example
function useUserStatus(userId: string) {
  const [status, setStatus] = useState<UserStatus | null>(null);
  
  useEffect(() => {
    const subscription = userStatusService.subscribe(userId, (newStatus) => {
      setStatus(newStatus);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);
  
  return status;
}

// Using the custom hook
function UserStatusIndicator({ userId }: UserStatusIndicatorProps) {
  const status = useUserStatus(userId);
  
  if (!status) return null;
  
  return (
    <div className={`status-indicator status-${status}`}>
      {status}
    </div>
  );
}
```

## Node.js and Express

### Project Structure

1. Organize code by feature or domain, not by technical role
2. Keep controllers thin, move business logic to services
3. Separate route definitions from controller implementations
4. Use middleware for cross-cutting concerns
5. Centralize error handling

```
server/
├── api/                     # API routes and controllers
│   ├── users/               # User-related functionality
│   │   ├── user.controller.ts
│   │   ├── user.routes.ts
│   │   ├── user.validation.ts
│   │   └── user.test.ts
│   └── index.ts             # API route registration
├── services/                # Business logic
│   ├── user.service.ts
│   └── auth.service.ts
├── middleware/              # Express middleware
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── db/                      # Database models and queries
│   ├── schema.ts
│   └── migrations/
├── utils/                   # Utility functions
│   ├── logger.ts
│   └── validation.ts
├── config/                  # Configuration
│   ├── env.ts
│   └── db.ts
└── app.ts                   # Express application setup
```

### API Controllers

1. Keep controllers focused on HTTP concerns
2. Validate request data before processing
3. Return consistent response structures
4. Handle errors and pass them to the error handling middleware
5. Don't perform business logic in controllers

```typescript
// Controller example
export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
}
```

### Middleware

1. Use middleware for cross-cutting concerns
2. Keep middleware focused on a single responsibility
3. Use middleware composition for complex functionality
4. Handle async operations properly in middleware
5. Pass errors to the next function for centralized error handling

```typescript
// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req);
  
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
}

// Error handling middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      details: err.details
    });
  }
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      status: 'error',
      message: err.message
    });
  }
  
  // Default error response
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}
```

### Services

1. Implement business logic in service classes or functions
2. Make services responsible for data access and business rules
3. Keep services stateless when possible
4. Use dependency injection for service dependencies
5. Write unit tests for services

```typescript
// Service example
export class UserService {
  constructor(private readonly db: Database) {}
  
  async getUserById(id: string): Promise<User | null> {
    return this.db.users.findUnique({
      where: { id }
    });
  }
  
  async createUser(data: CreateUserDto): Promise<User> {
    const existingUser = await this.db.users.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }
    
    const hashedPassword = await hashPassword(data.password);
    
    return this.db.users.create({
      data: {
        ...data,
        password: hashedPassword
      }
    });
  }
}
```

### Error Handling

1. Use custom error classes for different error types
2. Include relevant information in error messages
3. Log errors with appropriate severity levels
4. Handle async errors properly (try/catch or .catch())
5. Use a centralized error handling middleware

```typescript
// Custom error classes
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly details: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
```

## Database and ORM

### Schema Design

1. Use meaningful and consistent naming for tables and columns
2. Define appropriate data types for columns
3. Create proper indexes for frequently queried columns
4. Use foreign key constraints to maintain referential integrity
5. Include created_at and updated_at timestamps on all tables

```typescript
// Drizzle schema example
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  status: userStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
```

### Query Construction

1. Use the ORM's query builder for type safety
2. Keep queries efficient and focused
3. Use transactions when multiple operations need to be atomic
4. Specify only the fields you need in SELECT queries
5. Be mindful of N+1 query problems by using proper joins or eager loading

```typescript
// Query example
async function getUsersWithOrganizations() {
  return db.query.users.findMany({
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true
    },
    with: {
      organizations: {
        columns: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    where: eq(users.status, 'active')
  });
}

// Transaction example
async function transferFunds(fromAccountId: string, toAccountId: string, amount: number) {
  return db.transaction(async (tx) => {
    // Deduct from source account
    await tx.update(accounts)
      .set({ balance: sql`balance - ${amount}` })
      .where(eq(accounts.id, fromAccountId));
    
    // Add to destination account
    await tx.update(accounts)
      .set({ balance: sql`balance + ${amount}` })
      .where(eq(accounts.id, toAccountId));
    
    // Record the transaction
    await tx.insert(transactions)
      .values({
        fromAccountId,
        toAccountId,
        amount,
        type: 'transfer'
      });
  });
}
```

### Data Access Layer

1. Abstract database access behind a repository or data access layer
2. Keep SQL queries out of business logic
3. Implement proper error handling for database operations
4. Use pagination for large data sets
5. Consider performance implications of queries on large tables

```typescript
// Repository pattern example
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return db.query.users.findFirst({
      where: eq(users.id, id)
    });
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return db.query.users.findFirst({
      where: eq(users.email, email)
    });
  }
  
  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users)
      .values(data)
      .returning();
    return user;
  }
  
  async update(id: string, data: Partial<User>): Promise<User | null> {
    const [user] = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }
  
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }
}
```

### Migrations

1. Use migration tools to manage database schema changes
2. Keep migrations small and focused
3. Ensure migrations are reversible when possible
4. Test migrations on a staging environment before production
5. Document breaking changes in migrations

```typescript
// Migration example
export async function up(db: Pool) {
  await db.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX idx_users_email ON users(email);
  `);
}

export async function down(db: Pool) {
  await db.query(`
    DROP TABLE IF EXISTS users;
  `);
}
```

## API Design

### RESTful Principles

1. Use resource-based URLs
2. Use appropriate HTTP methods (GET, POST, PUT, DELETE)
3. Use HTTP status codes correctly
4. Make APIs stateless
5. Use versioning for API endpoints

```
# Resource-based URLs example
GET /api/v1/users                   # List users
GET /api/v1/users/{id}              # Get user by ID
POST /api/v1/users                  # Create user
PUT /api/v1/users/{id}              # Update user
DELETE /api/v1/users/{id}           # Delete user
GET /api/v1/users/{id}/organizations # Get organizations for user
```

### Request and Response Format

1. Use JSON for request and response bodies
2. Use consistent response structures
3. Include metadata in responses (pagination, status, etc.)
4. Use snake_case for JSON field names
5. Validate request data using schemas

```typescript
// Response structure example
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, string>;
  };
  meta?: {
    page?: number;
    per_page?: number;
    total_pages?: number;
    total_count?: number;
  };
}

// Response example
{
  "status": "success",
  "data": {
    "id": "c0a80121-7ac0-4e3d-b906-79a5e5757a9f",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@example.com",
    "status": "active",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-03-20T15:45:00Z"
  }
}
```

### API Documentation

1. Document all API endpoints
2. Include request parameters, response structure, and error responses
3. Provide example requests and responses
4. Use OpenAPI (Swagger) for API documentation
5. Keep documentation in sync with the codebase

```typescript
/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves a user by their unique identifier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

### API Security

1. Use HTTPS for all API endpoints
2. Implement proper authentication and authorization
3. Validate and sanitize all input data
4. Protect against common web vulnerabilities (CSRF, XSS, etc.)
5. Implement rate limiting and request throttling

```typescript
// API security middleware example
export function securityMiddleware(app: Express) {
  // Set security headers
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  }));
  
  // Body parser with size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
}
```

## Testing Standards

### Test Coverage

1. Aim for high test coverage (80%+ for business logic)
2. Prioritize testing critical paths and complex logic
3. Use different types of tests (unit, integration, end-to-end)
4. Track coverage metrics in CI/CD pipeline
5. Don't optimize solely for coverage percentage

### Unit Tests

1. Test individual functions and components in isolation
2. Mock external dependencies
3. Focus on business logic and edge cases
4. Keep tests fast and independent
5. Follow the AAA pattern (Arrange, Act, Assert)

```typescript
// Unit test example
describe('UserService', () => {
  let userService: UserService;
  let mockDb: MockDatabase;
  
  beforeEach(() => {
    mockDb = createMockDatabase();
    userService = new UserService(mockDb);
  });
  
  describe('getUserById', () => {
    it('should return a user when found', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = { id: userId, firstName: 'John', lastName: 'Doe' };
      mockDb.users.findUnique.mockResolvedValue(mockUser);
      
      // Act
      const result = await userService.getUserById(userId);
      
      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDb.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });
    
    it('should return null when user not found', async () => {
      // Arrange
      const userId = 'non-existent';
      mockDb.users.findUnique.mockResolvedValue(null);
      
      // Act
      const result = await userService.getUserById(userId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### Integration Tests

1. Test interactions between multiple components
2. Use test databases instead of mocking the database
3. Focus on API endpoints and database operations
4. Isolate tests from external services when possible
5. Clean up test data after tests complete

```typescript
// Integration test example
describe('User API', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });
  
  afterEach(async () => {
    await db.table('users').delete();
  });
  
  afterAll(async () => {
    await db.destroy();
  });
  
  describe('GET /api/v1/users/:id', () => {
    it('should return 200 and user data when user exists', async () => {
      // Arrange - Create test user
      const user = await db.table('users').insert({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        passwordHash: 'hashed_password'
      }).returning('*');
      
      // Act
      const response = await request(app)
        .get(`/api/v1/users/${user[0].id}`)
        .set('Authorization', `Bearer ${testToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toMatchObject({
        id: user[0].id,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com'
      });
    });
    
    it('should return 404 when user does not exist', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`);
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });
});
```

### End-to-End Tests

1. Test complete user flows from UI to database
2. Test critical business processes end-to-end
3. Use tools like Cypress or Playwright
4. Keep E2E tests focused on high-value scenarios
5. Prefer targeted tests over comprehensive coverage

```typescript
// Cypress E2E test example
describe('User Management', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password');
  });
  
  it('should allow creating a new user', () => {
    // Navigate to user creation page
    cy.visit('/admin/users');
    cy.get('[data-testid=add-user-button]').click();
    
    // Fill out the form
    cy.get('[data-testid=user-first-name]').type('New');
    cy.get('[data-testid=user-last-name]').type('User');
    cy.get('[data-testid=user-email]').type('new.user@example.com');
    cy.get('[data-testid=user-role]').select('editor');
    cy.get('[data-testid=user-status]').select('active');
    
    // Submit the form
    cy.get('[data-testid=submit-button]').click();
    
    // Verify success
    cy.url().should('include', '/admin/users');
    cy.contains('User created successfully').should('be.visible');
    cy.contains('New User').should('be.visible');
  });
});
```

### Testing React Components

1. Test component rendering and interactions
2. Use React Testing Library instead of Enzyme
3. Test what the user sees and does, not implementation details
4. Mock API calls and external dependencies
5. Test accessibility when relevant

```typescript
// React component test example
describe('UserList', () => {
  const mockUsers = [
    { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
  ];
  
  it('should render a list of users', async () => {
    // Mock API response
    jest.spyOn(api, 'getUsers').mockResolvedValue(mockUsers);
    
    // Render component
    render(<UserList />);
    
    // Wait for data to load
    await screen.findByText('John Doe');
    
    // Assertions
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
  
  it('should show loading state while fetching data', () => {
    // Mock a pending API call
    jest.spyOn(api, 'getUsers').mockImplementation(() => new Promise(() => {}));
    
    // Render component
    render(<UserList />);
    
    // Assertions
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('should handle errors gracefully', async () => {
    // Mock API error
    jest.spyOn(api, 'getUsers').mockRejectedValue(new Error('Failed to fetch'));
    
    // Render component
    render(<UserList />);
    
    // Wait for error message
    await screen.findByText('Failed to load users');
    
    // Assertions
    expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
```

## Security Best Practices

### Authentication and Authorization

1. Use industry-standard authentication methods (OAuth, JWT)
2. Implement proper password hashing (bcrypt or Argon2)
3. Enforce strong password policies
4. Implement role-based access control (RBAC)
5. Use multi-factor authentication for sensitive operations

```typescript
// Password hashing example
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}

// Authorization middleware
export function requireRole(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
}
```

### Input Validation

1. Validate all user input on the server side
2. Use schema validation libraries (Zod, Joi, etc.)
3. Sanitize user inputs to prevent XSS attacks
4. Use parameterized queries to prevent SQL injection
5. Implement content security policies

```typescript
// Input validation example with Zod
const createUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
});

// Validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.reduce((acc, curr) => {
          const path = curr.path.join('.');
          acc[path] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          details
        });
      }
      next(error);
    }
  };
}
```

### Data Protection

1. Encrypt sensitive data at rest
2. Use HTTPS for all communications
3. Implement proper access controls for data
4. Follow data minimization principles
5. Comply with relevant data protection regulations

```typescript
// Encrypting sensitive data example
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  
  constructor() {
    // In production, use a proper key management solution
    this.key = Buffer.from(process.env.ENCRYPTION_KEY as string, 'hex');
  }
  
  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(data: EncryptedData): string {
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Security Headers

1. Implement appropriate security headers
2. Use CSP to prevent XSS attacks
3. Use HSTS to enforce HTTPS
4. Use X-Content-Type-Options to prevent MIME type sniffing
5. Use X-Frame-Options to prevent clickjacking

```typescript
// Security headers middleware
export function securityHeaders(app: Express) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.example.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://assets.tunemantra.com"],
        connectSrc: ["'self'", "https://api.tunemantra.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  }));
}
```

## Performance Considerations

### Frontend Performance

1. Minimize bundle size with code splitting
2. Optimize images and media assets
3. Implement lazy loading for components and routes
4. Use performance monitoring tools
5. Follow React's performance optimization guidelines

```typescript
// Code splitting with React.lazy
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Router>
      <React.Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/settings" element={<Settings />} />
          {/* Other routes */}
        </Routes>
      </React.Suspense>
    </Router>
  );
}
```

### Backend Performance

1. Implement proper caching strategies
2. Optimize database queries
3. Use connection pooling for database connections
4. Implement pagination for large data sets
5. Use worker threads or queues for CPU-intensive tasks

```typescript
// Caching middleware example
export function cachingMiddleware(duration: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `__cache__${req.originalUrl || req.url}`;
    
    // Try to get from cache
    cacheClient.get(key, (err, data) => {
      if (data) {
        return res.status(200).json(JSON.parse(data));
      }
      
      // Modify response to cache the result
      const originalSend = res.send;
      res.send = function(body): Response {
        if (res.statusCode === 200) {
          cacheClient.set(key, body, 'EX', duration);
        }
        return originalSend.call(this, body);
      };
      
      next();
    });
  };
}

// Pagination example
async function getUsers(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  
  const [users, totalCount] = await Promise.all([
    db.query.users.findMany({
      limit: pageSize,
      offset,
      orderBy: (users, { desc }) => [desc(users.createdAt)]
    }),
    db.select({ count: count() }).from(users)
  ]);
  
  return {
    users,
    pagination: {
      page,
      pageSize,
      totalCount: totalCount[0].count,
      totalPages: Math.ceil(totalCount[0].count / pageSize)
    }
  };
}
```

### Database Optimization

1. Create proper indexes for frequently queried columns
2. Optimize table structure and data types
3. Use query execution plans to identify slow queries
4. Consider database sharding for large datasets
5. Implement database connection pooling

```typescript
// Create indexes example
export async function up(db: Pool) {
  // Create index for email lookups
  await db.query(`
    CREATE INDEX idx_users_email ON users(email);
  `);
  
  // Create index for foreign key lookups
  await db.query(`
    CREATE INDEX idx_tracks_release_id ON tracks(release_id);
  `);
  
  // Create composite index for common query pattern
  await db.query(`
    CREATE INDEX idx_revenue_content_platform_period ON revenue(content_type, content_id, platform_id, period_start);
  `);
}
```

## Documentation

### Code Documentation

1. Use JSDoc comments for functions, classes, and interfaces
2. Document parameters, return values, and thrown exceptions
3. Include examples for complex functions
4. Document edge cases and limitations
5. Keep documentation in sync with code changes

```typescript
/**
 * Calculates royalties based on revenue and ownership percentages.
 * 
 * @param {object} options - Calculation options
 * @param {number} options.revenue - The total revenue amount
 * @param {number} options.rate - The royalty rate (between 0 and 1)
 * @param {number} [options.minimumGuarantee] - Optional minimum guarantee amount
 * @param {string} options.territory - Territory code for region-specific calculations
 * @returns {number} The calculated royalty amount
 * @throws {ValidationError} If any parameter is invalid
 * 
 * @example
 * // Calculate royalty with standard rate
 * const royalty = calculateRoyalty({
 *   revenue: 1000,
 *   rate: 0.15,
 *   territory: 'US'
 * });
 * // Returns 150
 * 
 * @example
 * // Calculate royalty with minimum guarantee
 * const royalty = calculateRoyalty({
 *   revenue: 100,
 *   rate: 0.15,
 *   minimumGuarantee: 50,
 *   territory: 'US'
 * });
 * // Returns 50 (since 15 would be less than minimum)
 */
export function calculateRoyalty(options: RoyaltyOptions): number {
  // Implementation...
}
```

### README Files

1. Include a comprehensive README.md for each project and major component
2. Document project purpose, setup instructions, and usage examples
3. Include information about testing, deployment, and contribution
4. Keep README files up to date with project changes
5. Consider using markdown formatting for better readability

### System Documentation

1. Document system architecture and components
2. Maintain up-to-date diagrams (architecture, database schema, etc.)
3. Document deployment procedures and requirements
4. Document third-party integrations and dependencies
5. Keep documentation accessible to all team members

## Version Control

### Commit Messages

1. Follow the Conventional Commits specification
2. Write meaningful commit messages that explain the change
3. Reference issue numbers in commit messages
4. Keep commits focused on a single change
5. Break large changes into smaller, logical commits

```
# Format
<type>(<scope>): <subject>

<body>

<footer>

# Examples
feat(auth): implement multi-factor authentication

Add support for TOTP-based multi-factor authentication.
This includes:
- New user settings for enabling MFA
- QR code generation for TOTP setup
- Verification flow during login

Closes #123

# Another example
fix(api): resolve timeout issue in distribution endpoints

Increased request timeout and improved pagination to handle
large distribution requests more efficiently.

Fixes #456
```

### Branching Strategy

1. Follow the GitFlow branching model with modifications
2. Create feature branches from `develop` for new features
3. Create hotfix branches from `main` for critical fixes
4. Use descriptive branch names with issue numbers
5. Ensure branches are short-lived and focused

```
# Branch naming convention
feature/TM-123-add-multi-factor-authentication
bugfix/TM-456-fix-distribution-timeout
hotfix/TM-789-security-vulnerability
release/v2.3.0
```

### Pull Requests

1. Create focused pull requests for individual features or fixes
2. Provide comprehensive descriptions in pull requests
3. Include testing steps and screenshots when relevant
4. Link to relevant issues or documentation
5. Address review comments promptly

## Code Review

### Review Process

1. All code changes must go through code review
2. Reviews should focus on correctness, readability, and maintainability
3. Use a "approve", "request changes", or "comment" workflow
4. Address all review comments before merging
5. Seek understanding when there are disagreements

### Review Checklist

1. **Functionality**: Does the code work as expected?
2. **Security**: Are there any security concerns?
3. **Performance**: Are there any performance issues?
4. **Maintainability**: Is the code easy to understand and maintain?
5. **Testing**: Are there appropriate tests?
6. **Documentation**: Is the code properly documented?
7. **Standards**: Does the code follow our coding standards?

### Giving Feedback

1. Be constructive and respectful
2. Focus on the code, not the person
3. Explain your reasoning for suggestions
4. Provide specific examples when possible
5. Acknowledge good code and practices

### Receiving Feedback

1. Be open to feedback and suggestions
2. Ask for clarification if needed
3. Explain your reasoning when appropriate
4. Implement suggested changes promptly
5. Use code reviews as a learning opportunity

## Resources

### Official Documentation

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/reference/react)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express Documentation](https://expressjs.com/en/api.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

### Style Guides

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [React Patterns](https://reactpatterns.com/)

### Tools

- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Books

- "Clean Code" by Robert C. Martin
- "Refactoring" by Martin Fowler
- "TypeScript in 50 Lessons" by Stefan Baumgartner
- "React Design Patterns and Best Practices" by Michele Bertoli
- "Node.js Design Patterns" by Mario Casciaro

---

© 2023-2025 TuneMantra. All rights reserved.