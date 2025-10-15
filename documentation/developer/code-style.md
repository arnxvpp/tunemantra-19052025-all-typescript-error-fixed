# TuneMantra Code Style Guide

This document outlines the coding style and best practices for the TuneMantra codebase. Following these guidelines ensures consistency, maintainability, and readability across the project.

## General Guidelines

### File Organization

- One component/class/function per file when it exceeds 200 lines
- Group related files in appropriate directories
- Place tests adjacent to the code they test with `.test.ts` or `.test.tsx` suffix
- Use index files for exporting multiple components from a directory

### File Naming

- **React Components**: PascalCase (`UserProfile.tsx`)
- **Utility Functions**: camelCase (`formatDate.ts`)
- **Constants/Enums**: SNAKE_CASE for values, PascalCase for files (`ColorScheme.ts`)
- **Types/Interfaces**: PascalCase (`UserInterface.ts`)
- **CSS Modules**: camelCase, suffixed with `.module.css` (`button.module.css`)

### Import Order

Imports should be grouped in the following order with a blank line between groups:

1. External libraries and frameworks
2. Internal modules and components
3. Types and interfaces
4. Assets (images, styles, etc.)

```typescript
// External dependencies
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal components and modules
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

// Types and interfaces
import type { User, UserPreferences } from '@/types';

// Styles and assets
import styles from './UserProfile.module.css';
import avatarPlaceholder from '@/assets/avatar-placeholder.svg';
```

## TypeScript Guidelines

### Type Declarations

- Prefer interfaces for public APIs and object shapes
- Use type for unions, intersections, and utility types
- Define reusable types in dedicated files
- Export all public types

```typescript
// Good
interface User {
  id: number;
  name: string;
  email: string;
  preferences?: UserPreferences;
}

type UserRole = 'admin' | 'editor' | 'viewer';

// Avoid
type User = {
  id: number;
  name: string;
  email: string;
  preferences?: UserPreferences;
};
```

### Type Annotations

- Use type inference when it's clear and concise
- Add explicit type annotations for function parameters and return types
- Use explicit types for variables when inference isn't obvious
- Include generic type parameters when necessary

```typescript
// Good - Type is clear from initialization
const count = 0;

// Good - Explicit annotation for clarity
const users: User[] = getUsers();

// Good - Function types are explicit
function addUser(user: User): Promise<User> {
  // implementation
}

// Good - Generic type parameters
function getEntityById<T extends Entity>(id: number): Promise<T | null> {
  // implementation
}
```

### Type Safety

- Avoid using `any` whenever possible
- Use `unknown` instead of `any` when the type is uncertain
- Create proper type guards for narrowing types
- Use non-null assertion (`!`) only when you're absolutely certain

```typescript
// Avoid
function processData(data: any) {
  return data.value;
}

// Better
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data format');
}

// Best
interface DataWithValue {
  value: string;
}

function isDataWithValue(data: unknown): data is DataWithValue {
  return (
    typeof data === 'object' && 
    data !== null && 
    'value' in data && 
    typeof (data as any).value === 'string'
  );
}

function processData(data: unknown): string {
  if (isDataWithValue(data)) {
    return data.value;
  }
  throw new Error('Invalid data format');
}
```

## React Guidelines

### Component Structure

- Use functional components with hooks
- Destructure props at the top level
- Keep components focused on a single responsibility
- Extract complex logic into custom hooks

```typescript
// Good component structure
import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface UserProfileProps {
  userId: number;
  showDetails?: boolean;
}

export function UserProfile({ userId, showDetails = false }: UserProfileProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => fetchUser(userId),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <NotFound />;

  return (
    <div className="user-profile">
      <h2>{data.name}</h2>
      {showDetails && <UserDetails user={data} />}
    </div>
  );
}
```

### Props and State

- Define prop types with interfaces
- Provide default values for optional props
- Use appropriate state management based on complexity
- Avoid over-using React context for simple state needs

```typescript
// Props with defaults
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  children,
}: ButtonProps) {
  // implementation
}
```

### Hooks

- Follow the Rules of Hooks strictly
- Keep custom hooks focused and reusable
- Use appropriate dependency arrays for useEffect, useMemo, and useCallback
- Extract complex logic into custom hooks

```typescript
// Good custom hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### Event Handling

- Use the `handleEventName` convention for event handlers
- Prefer arrow functions for event handlers to avoid binding issues
- Implement proper event types from React

```typescript
function SearchForm() {
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchAPI(query);
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={query} 
        onChange={handleQueryChange} 
        placeholder="Search..." 
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

## API and Data Fetching

### TanStack Query Usage

- Use consistent query key structure
- Implement error handling for all queries
- Use appropriate stale times and caching strategies
- Properly type query responses

```typescript
// Good Query implementation
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUserData(userId: number) {
  return useQuery<User, Error>({
    queryKey: ['/api/users', userId],
    queryFn: () => apiRequest(`/api/users/${userId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Partial<User> & { id: number }) => 
      apiRequest(`/api/users/${userData.id}`, {
        method: 'PATCH',
        data: userData,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', data.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });
}
```

### API Request Structure

- Use consistent error handling
- Implement request timeouts
- Add proper type annotations for responses
- Use appropriate HTTP methods

```typescript
// Good API request function
async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, headers = {}, timeout = 10000 } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.statusText,
        response.status,
        errorData
      );
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw new Error(`API request failed: ${error.message}`);
  }
}
```

## Backend Guidelines

### Route Structure

- Group routes by resource or functionality
- Use consistent path naming (kebab-case for paths)
- Implement appropriate middleware for authentication and validation
- Use HTTP methods correctly (GET, POST, PUT, PATCH, DELETE)

```typescript
// Good route structure
router.get('/users', authenticate, validateQuery(userQuerySchema), getUsers);
router.get('/users/:id', authenticate, validateParams(userParamsSchema), getUser);
router.post('/users', authenticate, authorize('admin'), validateBody(createUserSchema), createUser);
router.patch('/users/:id', authenticate, authorize('admin', 'self'), validateBody(updateUserSchema), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
```

### Middleware Implementation

- Keep middleware focused on a single responsibility
- Chain middleware for complex requirements
- Implement proper error handling
- Use consistent next() calls

```typescript
// Good middleware pattern
function validateRequest(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: error.errors
          }
        });
      }
      next(error);
    }
  };
}
```

### Controller Implementation

- Keep controllers thin, delegating business logic to services
- Return consistent response formats
- Implement proper error handling
- Follow the Single Responsibility Principle

```typescript
// Good controller implementation
async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(req.params.id);
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'RESOURCE_NOT_FOUND'
        }
      });
    }
    
    return res.json({
      data: user,
      meta: {}
    });
  } catch (error) {
    next(error);
  }
}
```

### Database Queries

- Use parameterized queries to prevent SQL injection
- Implement appropriate error handling for database operations
- Add type annotations for query results
- Optimize queries for performance

```typescript
// Good database query pattern
async function getUserById(id: number): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

async function searchUsers(query: string, limit: number = 20): Promise<User[]> {
  return db.select()
    .from(users)
    .where(
      or(
        like(users.name, `%${query}%`),
        like(users.email, `%${query}%`)
      )
    )
    .limit(limit);
}
```

## CSS and Styling

### Tailwind CSS Usage

- Use Tailwind utility classes for consistent styling
- Group related utilities
- Extract common patterns to components
- Use appropriate responsive prefixes

```jsx
// Good Tailwind usage
<div className="flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-lg shadow">
  <div className="flex items-center gap-4">
    <img 
      src={profile.avatar} 
      alt={profile.name} 
      className="w-12 h-12 rounded-full object-cover"
    />
    <div>
      <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
      <p className="text-sm text-gray-500">{profile.email}</p>
    </div>
  </div>
  <div className="mt-4 md:mt-0">
    <Button variant="primary">Edit Profile</Button>
  </div>
</div>
```

### Component-Specific Styles

- Use CSS modules for component-specific styles
- Keep selectors simple and specific
- Avoid global styles when possible
- Use BEM-like naming for CSS classes

```css
/* UserProfile.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.bio {
  color: var(--color-text-secondary);
  line-height: 1.5;
}
```

## Testing

### Unit Tests

- Test one concept per test
- Use descriptive test names
- Implement proper setup and teardown
- Mock external dependencies

```typescript
// Good unit test
describe('calculateRoyalties', () => {
  it('should calculate correct royalties for standard rates', () => {
    const streams = 1000;
    const rate = 0.004;
    
    const result = calculateRoyalties(streams, rate);
    
    expect(result).toBe(4);
  });
  
  it('should handle zero streams', () => {
    const streams = 0;
    const rate = 0.004;
    
    const result = calculateRoyalties(streams, rate);
    
    expect(result).toBe(0);
  });
  
  it('should round to two decimal places', () => {
    const streams = 1234;
    const rate = 0.003;
    
    const result = calculateRoyalties(streams, rate);
    
    expect(result).toBe(3.7);
  });
});
```

### React Component Tests

- Test component rendering and behavior
- Use React Testing Library's user-centric approach
- Test accessibility when applicable
- Mock API calls and external dependencies

```typescript
// Good component test
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    mockLogin.mockClear();
  });
  
  it('should render the login form', () => {
    render(<LoginForm onLogin={mockLogin} />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
  
  it('should call onLogin with username and password when form is submitted', () => {
    render(<LoginForm onLogin={mockLogin} />);
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    expect(mockLogin).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
  });
  
  it('should display validation errors when form is submitted with empty fields', () => {
    render(<LoginForm onLogin={mockLogin} />);
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
```

### API Tests

- Test API endpoints for correct behavior
- Implement proper setup and teardown for database
- Test different request scenarios
- Verify response format and status codes

```typescript
// Good API test
describe('GET /api/users/:id', () => {
  let testUserId: number;
  
  beforeAll(async () => {
    await setupTestDatabase();
    const user = await createTestUser({
      username: 'apitest',
      email: 'apitest@example.com'
    });
    testUserId = user.id;
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  it('should return a user when valid ID is provided', async () => {
    const response = await request(app)
      .get(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id', testUserId);
    expect(response.body.data).toHaveProperty('username', 'apitest');
    expect(response.body.data).not.toHaveProperty('password');
  });
  
  it('should return 404 when user does not exist', async () => {
    const response = await request(app)
      .get('/api/users/99999')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
  });
  
  it('should return 401 when not authenticated', async () => {
    const response = await request(app).get(`/api/users/${testUserId}`);
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
  });
});
```

## Documentation

### Code Comments

- Use JSDoc for public functions, classes, and interfaces
- Keep comments concise and focused
- Update comments when code changes
- Add examples for complex functions

```typescript
/**
 * Calculates royalties based on stream count and rate
 * 
 * @param streamCount - Number of streams
 * @param rate - Royalty rate per stream
 * @param options - Optional calculation parameters
 * @returns Calculated royalty amount rounded to two decimal places
 * 
 * @example
 * // Returns 4.25
 * calculateRoyalties(1000, 0.00425);
 * 
 * @example
 * // Returns 4.25 with custom rounding
 * calculateRoyalties(1000, 0.00425, { roundingMethod: 'ceiling' });
 */
function calculateRoyalties(
  streamCount: number,
  rate: number,
  options?: RoyaltyOptions
): number {
  // implementation
}
```

### README Guidelines

- Include clear installation instructions
- Document available scripts
- Explain project structure
- Provide examples of common tasks
- Include links to more detailed documentation

## Error Handling

### Frontend Error Handling

- Use try/catch blocks for async operations
- Implement error boundaries for React components
- Display user-friendly error messages
- Log detailed errors for debugging

```typescript
// Good error handling in component
function UserProfile({ userId }: UserProfileProps) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => fetchUserData(userId),
    retry: 2,
  });
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        title="Failed to load user profile" 
        message={getErrorMessage(error)}
        onRetry={() => refetch()}
      />
    );
  }
  
  return (
    <div className="user-profile">
      {/* Profile content */}
    </div>
  );
}
```

### Backend Error Handling

- Use a centralized error handler
- Implement custom error classes
- Return consistent error formats
- Include appropriate HTTP status codes

```typescript
// Custom error classes
class ApiError extends Error {
  status: number;
  code: string;
  
  constructor(message: string, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

class ValidationError extends ApiError {
  details: any;
  
  constructor(message: string, details: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

// Global error handler
function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  
  // API error with status and code
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err instanceof ValidationError ? { details: err.details } : {})
      }
    });
  }
  
  // Database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      error: {
        message: 'Database constraint violation',
        code: 'DB_CONSTRAINT_ERROR'
      }
    });
  }
  
  // Default error response
  return res.status(500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      code: 'INTERNAL_ERROR'
    }
  });
}
```

## Performance Optimization

### React Component Optimization

- Use proper dependency arrays in hooks
- Memoize expensive calculations with useMemo
- Optimize renders with React.memo
- Use virtualization for long lists

```typescript
// Good component optimization
import { useMemo } from 'react';
import { VirtualList } from '@/components/VirtualList';

function TrackList({ tracks, onTrackSelect }: TrackListProps) {
  // Memoize expensive calculation
  const sortedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => b.streams - a.streams);
  }, [tracks]);
  
  // Memoize callback to prevent unnecessary rerenders
  const handleTrackSelect = useCallback((id: number) => {
    onTrackSelect(id);
  }, [onTrackSelect]);
  
  return (
    <div className="track-list">
      <h2>Your Tracks ({tracks.length})</h2>
      
      {/* Use virtualization for long lists */}
      <VirtualList
        items={sortedTracks}
        height={500}
        itemHeight={80}
        renderItem={(track) => (
          <TrackItem 
            key={track.id}
            track={track}
            onSelect={handleTrackSelect}
          />
        )}
      />
    </div>
  );
}

// Memoize component to prevent unnecessary rerenders
const TrackItem = React.memo(function TrackItem({ 
  track, 
  onSelect 
}: TrackItemProps) {
  return (
    <div className="track-item" onClick={() => onSelect(track.id)}>
      {/* Track item content */}
    </div>
  );
});
```

### Bundle Optimization

- Use dynamic imports for code splitting
- Optimize image assets
- Implement proper tree-shaking
- Analyze bundle size regularly

```typescript
// Good code splitting with dynamic imports
import React, { lazy, Suspense } from 'react';
import { Loading } from '@/components/Loading';

// Lazy load complex components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Settings = lazy(() => import('@/pages/Settings'));

function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

## Accessibility (A11y)

### Semantic HTML

- Use appropriate HTML elements for their intended purpose
- Implement proper heading hierarchy
- Use landmarks for page structure
- Ensure interactive elements are keyboard accessible

```jsx
// Good semantic HTML
<main>
  <header>
    <h1>User Dashboard</h1>
    <nav aria-label="Main Navigation">
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/profile">Profile</a></li>
        <li><a href="/settings">Settings</a></li>
      </ul>
    </nav>
  </header>
  
  <section aria-labelledby="recent-activity-heading">
    <h2 id="recent-activity-heading">Recent Activity</h2>
    <ul>
      {activities.map(activity => (
        <li key={activity.id}>{activity.description}</li>
      ))}
    </ul>
  </section>
  
  <aside aria-labelledby="quick-stats-heading">
    <h2 id="quick-stats-heading">Quick Stats</h2>
    {/* Stats content */}
  </aside>
  
  <footer>
    <p>&copy; {new Date().getFullYear()} TuneMantra</p>
  </footer>
</main>
```

### ARIA Attributes

- Use ARIA attributes appropriately
- Don't override native semantics
- Ensure proper relationships with aria-labelledby and aria-describedby
- Test with screen readers

```jsx
// Good ARIA usage
<div role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-desc">
  <h2 id="dialog-title">Confirm Deletion</h2>
  <p id="dialog-desc">Are you sure you want to delete this track? This action cannot be undone.</p>
  
  <div className="dialog-buttons">
    <button 
      onClick={onCancel}
      aria-label="Cancel deletion"
    >
      Cancel
    </button>
    <button 
      onClick={onConfirm}
      aria-label="Confirm deletion"
    >
      Delete
    </button>
  </div>
</div>
```

### Focus Management

- Ensure keyboard focus is managed properly
- Use tabIndex appropriately
- Implement keyboard navigation for custom components
- Trap focus in modals and dialogs

```jsx
// Good focus management
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocus.current = document.activeElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Trap focus inside modal
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }
        
        if (e.key === 'Tab') {
          // Trap focus inside modal
          // Implementation omitted for brevity
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore focus when modal closes
        previousFocus.current?.focus();
      };
    }
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="modal"
    >
      {children}
    </div>
  );
}
```

## Conclusion

Following these coding standards will help maintain a consistent, high-quality codebase for TuneMantra. Remember that these guidelines are meant to help, not hinder, the development process. When in doubt, prioritize readability, maintainability, and consistency over rigid adherence to rules.

For questions or suggestions regarding these standards, please contact the development team or submit a pull request with proposed changes to this document.