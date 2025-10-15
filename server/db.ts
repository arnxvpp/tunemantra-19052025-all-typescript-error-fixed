/**
 * Database Configuration Module
 *
 * This module sets up the connection to the PostgreSQL database using the standard node-postgres driver.
 * It creates and exports a connection pool and a Drizzle ORM instance that will be used
 * throughout the application to interact with the database.
 *
 * For beginners:
 * - A database is used to store all the data for our application (users, music, etc.)
 * - PostgreSQL is a powerful open-source database system
 * - An ORM (Object-Relational Mapper) helps us work with the database using JavaScript objects
 * - node-postgres (pg) is the standard Node.js driver for PostgreSQL
 */

// Import required dependencies
// ------------------------------------------------------------------------------------------

// Import standard PostgreSQL client - this allows us to connect to our database
import pg from 'pg';
const { Pool } = pg;

// Import Drizzle ORM - this gives us nice TypeScript support for database queries
// Use the node-postgres adapter
import { drizzle } from 'drizzle-orm/node-postgres';

// Import our database schema (tables definition) from the shared folder
import * as schema from "@shared/schema";

// WebSocket is not needed for standard node-postgres
// import ws from "ws";

/**
 * Verify that the DATABASE_URL environment variable is set
 *
 * The application requires a PostgreSQL database connection string to function.
 * This check ensures the application fails fast with a clear error message if
 * the database connection string is missing.
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * Create a database connection pool
 *
 * A connection pool maintains a set of database connections that can be
 * reused across requests, improving performance by avoiding the overhead
 * of creating new connections for each database operation.
 * This pool is used by Drizzle and connect-pg-simple.
 */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Error handling for the connection pool
 *
 * This logs any errors that occur on idle clients in the pool.
 */
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Consider if process.exit is appropriate or if error should be handled differently
  // process.exit(-1);
});

/**
 * Initialize Drizzle ORM
 *
 * Drizzle is a lightweight TypeScript ORM that provides:
 * - Type-safe database queries
 * - Query building with autocompletion
 * - Schema management
 *
 * By passing our schema to Drizzle, it knows the structure of our database
 * and can provide type checking for our queries.
 * We initialize it with the node-postgres pool.
 */
export const db = drizzle(pool, { schema });

/**
 * Execute a raw SQL query with parameter handling
 *
 * @param query - SQL query string with $1, $2, etc. for parameters
 * @param params - Parameter(s) for the query
 * @returns Promise resolving to query result
 */
export async function executeQuery(query: string, params?: any[] | any) {
  if (params === undefined) {
    return await pool.query(query);
  }

  // If params is not an array, convert it to an array
  const paramsArray = Array.isArray(params) ? params : [params];
  return await pool.query(query, paramsArray);
}
