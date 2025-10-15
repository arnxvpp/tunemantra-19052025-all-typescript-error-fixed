# TuneMantra - Local Development Setup

This guide will help you set up the TuneMantra application on your local machine.

## Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Git (for cloning the repository)

## Setup Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd tunemantra
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Create a PostgreSQL database for the application. You can use a local PostgreSQL instance or a service like [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).

### 4. Environment Variables

Create a `.env.development` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tunemantra

# Authentication
JWT_SECRET=your_jwt_secret_key
ADMIN_REGISTRATION_CODE=your_admin_registration_code
SESSION_SECRET=your_session_secret

# For Blockchain Features (Optional)
MUMBAI_RPC_URL=https://polygon-mumbai-bor.publicnode.com
MUMBAI_PRIVATE_KEY=your_private_key
MUMBAI_NFT_CONTRACT_ADDRESS=your_nft_contract_address
MUMBAI_RIGHTS_CONTRACT_ADDRESS=your_rights_contract_address

# For ACR Cloud Music Identification (Optional)
ACR_HOST=your_acr_host
ACR_ACCESS_KEY=your_acr_access_key
ACR_ACCESS_SECRET=your_acr_access_secret
```

Replace the placeholder values with your actual configuration.

### 5. Initialize the Database

```bash
npm run db:push
```

This will create the necessary database tables based on the Drizzle schema.

### 6. Start the Development Server

```bash
npm run dev
```

The application should be running at [http://localhost:5000](http://localhost:5000).

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express server
- `/shared` - Shared TypeScript types and utilities
- `/documentation` - Project documentation

## Security Notes

- This project has been updated to address security vulnerabilities in dependencies
- The vulnerable `xlsx` library has been replaced with `ExcelJS`
- See `documentation/security-updates.md` for details

## Common Issues and Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify your DATABASE_URL is correct
2. Ensure PostgreSQL is running 
3. Check if the database exists and is accessible

### Build Errors

If you encounter build errors:

1. Make sure all dependencies are installed (`npm install`)
2. Clear the build cache: `rm -rf node_modules/.vite`
3. Restart the development server

## Local Development Tips

1. Use the admin account to access all features
2. For blockchain features, you'll need to configure the proper environment variables
3. The application uses Vite for fast development reloading
4. API endpoints are available at `/api/*` paths

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Run the production build
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push schema changes to the database

## Learning More

Check the documentation directory for more information:
- `documentation/dependencies.md` - List of all project dependencies
- `documentation/security-updates.md` - Security updates and vulnerability fixes