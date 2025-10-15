# TuneMantra Developer Guide

<div align="center">
  <img src="../diagrams/developer-header.svg" alt="TuneMantra Developer Guide" width="600"/>
</div>

## Introduction

This comprehensive guide will help you set up a development environment, understand the codebase, and start contributing to the TuneMantra platform. The guide is designed to be accessible to developers of all experience levels, with particular attention to helping junior developers get up to speed quickly.

## Development Environment Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or later
- **npm**: Version 9.x or later (comes with Node.js)
- **Git**: Latest stable version
- **PostgreSQL**: Version 14.x or later
- **Code Editor**: We recommend VS Code with the following extensions:
  - ESLint
  - Prettier
  - TypeScript + Plugin
  - Tailwind CSS IntelliSense
  - DotENV
  - PostgreSQL

### Step 1: Clone the Repository

```bash
git clone https://github.com/tunemantra/platform.git
cd platform
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Open `.env` in your editor and configure the following required variables:

```
# Database connection string
DATABASE_URL=postgresql://username:password@localhost:5432/tunemantra

# Server configuration
PORT=3000
NODE_ENV=development

# JWT secret for authentication
JWT_SECRET=your-jwt-secret-here

# File storage configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100000000

# External API keys (obtain these from the respective services)
STRIPE_API_KEY=sk_test_...
```

### Step 4: Database Setup

1. Create a PostgreSQL database:

```bash
createdb tunemantra
```

2. Push the schema to the database:

```bash
npm run db:push
```

3. (Optional) Seed the database with sample data:

```bash
npm run db:seed
```

### Step 5: Start the Development Server

```bash
npm run dev
```

This will start both the frontend and backend in development mode. The application will be accessible at `http://localhost:3000`.

## Project Structure

The TuneMantra platform follows a structured organization to keep the codebase maintainable and scalable:

```
tunemantra/
├── client/                   # Frontend code
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # React components
│       │   ├── ui/           # Shadcn UI components
│       │   └── [feature]/    # Feature-specific components
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Utility functions
│       ├── pages/            # Page components
│       ├── routes/           # Route definitions
│       ├── store/            # State management
│       ├── styles/           # CSS and styling
│       ├── types/            # TypeScript type definitions
│       ├── App.tsx           # Main application component
│       └── main.tsx          # Application entry point
├── server/                   # Backend code
│   ├── auth.ts               # Authentication logic
│   ├── db.ts                 # Database connection
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Storage interface implementation
│   ├── types.ts              # TypeScript type definitions
│   ├── vite.ts               # Vite server configuration
│   ├── lib/                  # Library code
│   ├── services/             # Business logic services
│   └── utils/                # Utility functions
├── shared/                   # Shared code between frontend and backend
│   ├── constants.ts          # Shared constants
│   ├── schema.ts             # Database schema definition
│   └── types.ts              # Shared TypeScript types
├── scripts/                  # Build and maintenance scripts
├── uploads/                  # File uploads directory
├── .env                      # Environment variables
├── .env.example              # Example environment variables
├── package.json              # npm package configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## Key Technologies

TuneMantra is built on a modern TypeScript stack:

### Frontend

- **React**: UI library for building component-based interfaces
- **TanStack Query**: Data fetching and caching library
- **Shadcn/UI**: Component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation
- **Recharts**: Charting library for data visualization

### Backend

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **Drizzle ORM**: Type-safe ORM for database access
- **PostgreSQL**: Relational database
- **Passport.js**: Authentication middleware
- **JSON Web Tokens (JWT)**: Secure authentication tokens
- **Zod**: Schema validation
- **Multer**: File upload handling

## Core Concepts

### Authentication Flow

The authentication system uses JWT tokens and session cookies for secure access:

1. User submits credentials via login form
2. Server validates credentials against the database
3. If valid, a session is created and a secure cookie is set
4. The cookie is sent with subsequent requests to maintain authentication
5. Protected routes check the session to verify authentication

Authentication logic is centralized in `server/auth.ts`.

### Database Access Pattern

All database operations follow a consistent pattern:

1. Schema is defined in `shared/schema.ts` using Drizzle ORM
2. Storage interface is defined in `server/types.ts`
3. Implementation of the storage interface is in `server/storage.ts`
4. Routes use the storage interface for data access in `server/routes.ts`

Example flow:

```typescript
// Define schema in shared/schema.ts
export const users = pgTable("users", { /* schema definition */ });

// Define type in shared/schema.ts
export type User = typeof users.$inferSelect;

// Implement in storage.ts
async getUserById(id: number): Promise<User | undefined> {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id)
  });
  return result;
}

// Use in routes.ts
app.get('/api/users/:id', async (req, res) => {
  const user = await storage.getUserById(parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});
```

### Frontend Data Fetching

Data fetching on the frontend uses TanStack Query for efficient caching and state management:

```typescript
// Define query hook
function useUser(userId: number) {
  return useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
    enabled: !!userId
  });
}

// Use in component
function UserProfile({ userId }: { userId: number }) {
  const { data: user, isLoading, error } = useUser(userId);
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;
  
  return <UserProfileDisplay user={user} />;
}
```

### Form Handling

Forms use React Hook Form with Zod validation:

```typescript
// Define validation schema
const userFormSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  fullName: z.string().min(1)
});

// Use in form component
function UserForm() {
  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      email: '',
      fullName: ''
    }
  });
  
  const onSubmit = async (data) => {
    // Submit form data
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## Common Development Tasks

### Creating a New API Endpoint

1. Define the route in `server/routes.ts`:

```typescript
app.get('/api/tracks/:id', async (req, res) => {
  const trackId = parseInt(req.params.id);
  const track = await storage.getTrackById(trackId);
  
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }
  
  return res.json(track);
});
```

2. Implement any required storage methods in `server/storage.ts`:

```typescript
async getTrackById(id: number): Promise<Track | undefined> {
  const result = await db.query.tracks.findFirst({
    where: eq(tracks.id, id),
    with: {
      release: true
    }
  });
  return result;
}
```

### Adding a New Database Table

1. Add the table definition to `shared/schema.ts`:

```typescript
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const playlistTracks = pgTable("playlist_tracks", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  trackId: integer("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  addedAt: timestamp("added_at").defaultNow()
});

// Also add types
export type Playlist = typeof playlists.$inferSelect;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;

// Create insert schemas
export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlaylistTrackSchema = createInsertSchema(playlistTracks).omit({
  id: true,
  addedAt: true
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;
```

2. Update the storage interface in `server/types.ts`:

```typescript
export interface IStorage {
  // ... existing methods
  
  // Playlist methods
  getPlaylistsByUserId(userId: number): Promise<Playlist[]>;
  getPlaylistById(id: number): Promise<Playlist | undefined>;
  createPlaylist(userId: number, playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: number, playlist: Partial<Playlist>): Promise<Playlist>;
  deletePlaylist(id: number): Promise<void>;
  
  // Playlist track methods
  getPlaylistTracks(playlistId: number): Promise<PlaylistTrack[]>;
  addTrackToPlaylist(data: InsertPlaylistTrack): Promise<PlaylistTrack>;
  removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<void>;
  updateTrackPosition(id: number, position: number): Promise<PlaylistTrack>;
}
```

3. Implement the methods in `server/storage.ts`:

```typescript
// Playlist methods
async getPlaylistsByUserId(userId: number): Promise<Playlist[]> {
  return await db.query.playlists.findMany({
    where: eq(playlists.userId, userId),
    orderBy: desc(playlists.createdAt)
  });
}

async getPlaylistById(id: number): Promise<Playlist | undefined> {
  return await db.query.playlists.findFirst({
    where: eq(playlists.id, id)
  });
}

// ... implement other methods
```

4. Push the schema changes to the database:

```bash
npm run db:push
```

### Creating a New Frontend Component

1. Create a new component file:

```typescript
// src/components/playlists/PlaylistCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Playlist } from "@/types";
import { Link } from "react-router-dom";

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete?: (id: number) => void;
}

export function PlaylistCard({ playlist, onDelete }: PlaylistCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{playlist.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">{playlist.description}</p>
        <div className="mt-4 flex justify-between">
          <Link to={`/playlists/${playlist.id}`}>
            <Button variant="outline">View</Button>
          </Link>
          {onDelete && (
            <Button variant="destructive" onClick={() => onDelete(playlist.id)}>
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

2. Create a new page component:

```typescript
// src/pages/PlaylistsPage.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Playlist } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "react-router-dom";

export function PlaylistsPage() {
  const queryClient = useQueryClient();
  const { data: playlists, isLoading } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/playlists/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
    }
  });
  
  if (isLoading) return <Spinner />;
  
  return (
    <div>
      <PageHeader 
        title="Your Playlists"
        action={
          <Link to="/playlists/new">
            <Button>Create Playlist</Button>
          </Link>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {playlists?.map(playlist => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
        
        {playlists?.length === 0 && (
          <p className="col-span-3 text-center text-gray-500">
            You don't have any playlists yet. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
}
```

3. Add the route to your router:

```typescript
// src/App.tsx
import { PlaylistsPage } from "@/pages/PlaylistsPage";

// In your router configuration
<Route path="/playlists" element={<PlaylistsPage />} />
```

## Advanced Development Topics

### Database Migrations

When changing the database schema, follow these steps:

1. Update the schema in `shared/schema.ts`
2. Use the following command to generate and apply migrations:

```bash
npm run db:push
```

For complex migrations that require data transformation:

1. Create a migration script in `scripts/migrations/`
2. Run the script with:

```bash
npm run migrate:custom scripts/migrations/your-migration.ts
```

### Performance Optimization

#### Frontend Optimization Techniques

1. **Memoization**: Use React's `useMemo` and `useCallback` for expensive computations and callbacks:

```typescript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

2. **Code Splitting**: Use dynamic imports to split your code:

```typescript
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
```

3. **Virtualization**: For long lists, use virtualization:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = React.useRef();
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Backend Optimization Techniques

1. **Query Optimization**: Use optimized queries with proper indexes:

```typescript
// Add index in schema.ts
export const tracksByUserIdIndex = pgIndex('idx_tracks_user_id').on(tracks).using('btree')([tracks.userId]);

// Optimize query in storage.ts
async getTracksByUserId(userId: number): Promise<Track[]> {
  return await db.query.tracks.findMany({
    where: eq(tracks.userId, userId),
    orderBy: desc(tracks.createdAt),
    limit: 100 // Add pagination to limit result size
  });
}
```

2. **Caching**: Implement caching for expensive operations:

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes TTL

async function getCachedData(key, fetchFn) {
  const cachedData = cache.get(key);
  if (cachedData) return cachedData;
  
  const freshData = await fetchFn();
  cache.set(key, freshData);
  return freshData;
}

// Usage in a service method
async getPopularTracks() {
  return getCachedData('popular_tracks', async () => {
    // Expensive database query or computation
    return await db.query.tracks.findMany({
      orderBy: desc(analytics.streams),
      limit: 20
    });
  });
}
```

### Testing Strategies

The project uses Jest for testing with the following types of tests:

#### Unit Tests

For testing individual functions and components:

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Integration Tests

For testing interactions between components:

```typescript
// Example integration test
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './LoginForm';
import { AuthProvider } from './AuthContext';

// Mock the API call
jest.mock('../api/auth', () => ({
  login: jest.fn(() => Promise.resolve({ user: { id: 1, username: 'testuser' } }))
}));

describe('LoginForm integration', () => {
  it('logs in the user and redirects', async () => {
    const queryClient = new QueryClient();
    const mockNavigate = jest.fn();
    
    // Mock the router
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Verify the result
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

#### API Tests

For testing API endpoints:

```typescript
// Example API test
import request from 'supertest';
import { app } from '../server';
import { db } from '../db';
import { users } from '../schema';

describe('User API', () => {
  beforeAll(async () => {
    // Set up test database
    await db.insert(users).values({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      fullName: 'Test User',
      role: 'artist'
    });
  });
  
  afterAll(async () => {
    // Clean up test database
    await db.delete(users).where(eq(users.username, 'testuser'));
  });
  
  it('gets a user by ID', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User'
      })
    );
    // Password should not be returned
    expect(response.body.password).toBeUndefined();
  });
});
```

### Debugging Tips

#### Frontend Debugging

1. **React DevTools**: Install React Developer Tools extension for Chrome or Firefox

2. **TanStack Query DevTools**: Use the built-in DevTools for debugging queries:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

3. **Component Debugging**: Use the `debug` function from testing library:

```typescript
import { render, screen } from '@testing-library/react';

const { debug } = render(<YourComponent />);
debug(); // Prints the DOM structure to the console
```

#### Backend Debugging

1. **Request Logging**: Enable detailed request logging:

```typescript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  const originalSend = res.send;
  res.send = function(body) {
    console.log('Response:', body);
    return originalSend.call(this, body);
  };
  next();
});
```

2. **Database Query Logging**: Log database queries for debugging:

```typescript
// Enhanced query logging for Drizzle
import { DefaultLogger } from 'drizzle-orm';

db.driver.devMode = true; // Enable dev mode for query logging
```

3. **Node.js Debugger**: Use the built-in Node.js debugger:

- Add a `debugger` statement in your code
- Run Node.js with the `--inspect` flag: `node --inspect server/index.js`
- Open Chrome and navigate to `chrome://inspect` to connect to the debugger

## Development Workflow

### Git Workflow

We follow a feature branch workflow:

1. Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:

```bash
git add .
git commit -m "Description of your changes"
```

3. Push your branch to the remote repository:

```bash
git push -u origin feature/your-feature-name
```

4. Create a pull request (PR) for code review

5. After approval, merge your PR into the main branch

### Code Review Guidelines

When submitting or reviewing code, follow these guidelines:

#### Submitting Code

1. **Keep PRs small and focused**: One feature or fix per PR
2. **Include tests**: Add tests for new features and bugfixes
3. **Provide a clear description**: Explain what the PR does and why
4. **Link relevant issues**: Reference related issues in the PR description
5. **Self-review**: Review your own code before submitting

#### Reviewing Code

1. **Be constructive**: Offer solutions, not just criticism
2. **Check functionality**: Verify the code works as intended
3. **Ensure test coverage**: Check that tests adequately cover the changes
4. **Verify code style**: Ensure the code follows project conventions
5. **Look for edge cases**: Consider potential failure scenarios

### Continuous Integration

The project uses GitHub Actions for CI/CD:

1. **Linting**: Ensure code style consistency
2. **Testing**: Run unit and integration tests
3. **Building**: Verify the project builds successfully
4. **Deployment**: Deploy to staging/production environments

## Troubleshooting Common Issues

### Database Connection Issues

If you encounter database connection problems:

1. Verify your PostgreSQL service is running:

```bash
sudo service postgresql status  # Linux
brew services list              # macOS
```

2. Check your `.env` file for correct database connection string:

```
DATABASE_URL=postgresql://username:password@localhost:5432/tunemantra
```

3. Ensure database exists and user has proper permissions:

```bash
psql -U postgres -c "CREATE DATABASE tunemantra;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE tunemantra TO yourusername;"
```

### Authentication Issues

If users can't log in or sessions aren't persisting:

1. Check JWT secret in `.env` file:

```
JWT_SECRET=your-jwt-secret-here
```

2. Verify cookie settings in `server/auth.ts`:

```typescript
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
  },
  store: sessionStore
}));
```

3. Check for CORS issues in `server/index.ts`:

```typescript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
```

### File Upload Issues

If file uploads are failing:

1. Check upload directory exists and has proper permissions:

```bash
mkdir -p uploads
chmod 755 uploads
```

2. Verify Multer configuration:

```typescript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10000000') // 10MB default
  }
});
```

## Resources

### Documentation

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Express Documentation](https://expressjs.com/)

### Tools

- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/) - API testing tool
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL management tool

### Learning Resources

- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [React Patterns](https://reactpatterns.com/)
- [Drizzle ORM Tutorials](https://orm.drizzle.team/learn/overview)
- [TanStack Query Course](https://ui.dev/react-query)

## Getting Help

If you need assistance while working on the TuneMantra platform:

1. **Documentation**: First, check the existing documentation
2. **Issue Tracker**: Search the project's GitHub issues
3. **Team Chat**: Ask in the development team's Slack channel
4. **Code Comments**: Look for comments in the relevant code files
5. **Ask for Help**: Don't hesitate to ask senior developers for guidance

Remember: There are no silly questions, and we all started somewhere!