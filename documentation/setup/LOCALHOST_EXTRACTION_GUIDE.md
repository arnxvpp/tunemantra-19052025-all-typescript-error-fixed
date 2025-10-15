# TuneMantra - Localhost Extraction Guide

This guide provides step-by-step instructions for setting up TuneMantra after extracting the zip file.

## Step 1: Extract the Zip File

Extract the `tunemantra-localhost.zip` file to a directory of your choice:

### Windows:
Right-click the zip file and select "Extract All..."

### macOS:
Double-click the zip file to extract it automatically

### Linux:
```bash
unzip tunemantra-localhost.zip -d tunemantra
```

## Step 2: Install Dependencies

Navigate to the extracted directory and install the required dependencies:

```bash
cd tunemantra
npm install
```

This will install all the dependencies listed in `package.json`. The installation may take several minutes depending on your internet connection.

## Step 3: Configure the Environment

1. Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

2. Edit the `.env` file to include your database connection and other required variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/tunemantra
PORT=3000
NODE_ENV=development
```

3. If you're using PostgreSQL, create a new database:

```bash
psql -c "CREATE DATABASE tunemantra;"
```

## Step 4: Initialize the Database

Run the database migration to set up the required tables:

```bash
npm run db:push
```

This command uses Drizzle to push the schema to your database.

## Step 5: Start the Development Server

Start the application in development mode:

```bash
npm run dev
```

This will start both the backend API server and the frontend development server.

## Step 6: Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

You should now see the TuneMantra application running locally.

## Troubleshooting

### Database Connection Issues

If you encounter database connection problems:

1. Verify your DATABASE_URL in the .env file
2. Ensure the PostgreSQL service is running
3. Confirm the database user has proper permissions

### Dependency Errors

If you see errors related to missing dependencies:

```bash
npm cache clean --force
npm install
```

### Port Already in Use

If port 3000 is already in use:

1. Change the PORT value in your .env file
2. Restart the application

## Additional Configuration

### ISRC Management

For ISRC (International Standard Recording Code) functionality, no additional configuration is needed as we've updated the code to use ExcelJS for Excel file handling.

### Blockchain Integration

If you plan to use the blockchain features:

1. Set `BLOCKCHAIN_SIMULATION=true` in your .env file for testing
2. For production, configure the blockchain network details in your .env

## Resources

- [ExcelJS Documentation](https://github.com/exceljs/exceljs#readme)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [TuneMantra Documentation](./README.md)