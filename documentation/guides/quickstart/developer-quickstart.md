# Developer Quickstart Guide

<div align="center">
  <img src="../diagrams/developer-quickstart-header.svg" alt="Developer Quickstart" width="600"/>
  <p><strong>Get up and running with TuneMantra development in 15 minutes</strong></p>
</div>

## Quick Setup

This guide will get you up and running with a development environment for TuneMantra as quickly as possible. For more detailed information, refer to the [comprehensive developer guide](../developer/getting-started.md).

### Prerequisites

Ensure you have these installed:

- **Node.js**: v20.x or later
- **npm**: v9.x or later (comes with Node.js)
- **Git**: Latest version
- **PostgreSQL**: v14.x or later

### 1. Clone the Repository

```bash
git clone https://github.com/tunemantra/platform.git
cd platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database connection details:

```
DATABASE_URL=postgresql://username:password@localhost:5432/tunemantra
PORT=3000
NODE_ENV=development
```

### 4. Set Up Database

```bash
# Create database
createdb tunemantra

# Push schema
npm run db:push

# Seed test data (optional)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application running.

## Project Structure Overview

```
tunemantra/
├── client/                   # Frontend code
│   ├── public/               # Static assets
│   └── src/                  # React components & logic
├── server/                   # Backend code
│   ├── auth.ts               # Authentication
│   ├── routes.ts             # API endpoints
│   ├── storage.ts            # Database interface
│   └── services/             # Business logic
├── shared/                   # Shared code
│   └── schema.ts             # Database schema
└── scripts/                  # Utility scripts
```

## Key Documentation

For a deeper understanding, refer to these docs:

- [Full Developer Guide](../developer/getting-started.md) - Complete setup and concepts
- [Code Style Guide](../developer/code-style.md) - Coding standards
- [API Reference](../technical/api/api-reference.md) - API endpoint details
- [Technical Specifications](../technical/platform/project-technical-specification.md) - Complete tech specs
- [Frontend Architecture](../technical/frontend.md) - Frontend architecture details
- [Developer Handoff Guide](../developer/handoff-guide.md) - Comprehensive guide for new developers

## Quick Development Tasks

### Create a New API Endpoint

Add to `server/routes.ts`:

```typescript
app.get('/api/example', async (req, res) => {
  // Implementation
  res.json({ success: true });
});
```

### Add a Database Model

Update `shared/schema.ts`:

```typescript
export const examples = pgTable("examples", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export type Example = typeof examples.$inferSelect;
export const insertExampleSchema = createInsertSchema(examples).omit({
  id: true,
  createdAt: true
});
export type InsertExample = z.infer<typeof insertExampleSchema>;
```

### Create a React Component

Add to `client/src/components/Example.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card";

export function ExampleComponent({ title }: { title: string }) {
  return (
    <Card>
      <CardContent>
        <h3>{title}</h3>
      </CardContent>
    </Card>
  );
}
```

## Need Help?

- Check the [Developer FAQ](../resources/developer-faq.md)
- Review the [Common Issues](../developer/common-issues.md) section
- For more in-depth guidance, see the full [Developer Guide](../developer/getting-started.md)