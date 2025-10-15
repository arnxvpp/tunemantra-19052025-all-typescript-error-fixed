import { pool } from "../db";

/**
 * This migration adds role-based access control fields to the users table
 */
export async function runMigration() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    console.log("Creating user_role enum type if it doesn't exist...");
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('admin', 'label', 'artist_manager', 'artist', 'team_member');
        END IF;
      END$$;
    `);

    console.log("Checking if users table exists and has required columns...");
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      );
    `);
    
    if (tableResult.rows[0].exists) {
      console.log("Users table exists, checking for role column...");
      
      // Check if role column exists
      const roleColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'role'
        );
      `);
      
      if (!roleColumnResult.rows[0].exists) {
        console.log("Adding role column to users table...");
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN role user_role DEFAULT 'artist'
        `);
      } else {
        console.log("Role column already exists in users table.");
      }
      
      // Check if permissions column exists
      const permissionsColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'permissions'
        );
      `);
      
      if (!permissionsColumnResult.rows[0].exists) {
        console.log("Adding permissions column to users table...");
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN permissions jsonb DEFAULT '{}'::jsonb
        `);
      } else {
        console.log("Permissions column already exists in users table.");
      }
      
      // Check if parentId column exists
      const parentIdColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'parent_id'
        );
      `);
      
      if (!parentIdColumnResult.rows[0].exists) {
        console.log("Adding parent_id column to users table...");
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN parent_id integer REFERENCES users(id)
        `);
      } else {
        console.log("parent_id column already exists in users table.");
      }
      
      // Check if subscriptionInfo column exists
      const subscriptionInfoColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'subscription_info'
        );
      `);
      
      if (!subscriptionInfoColumnResult.rows[0].exists) {
        console.log("Adding subscription_info column to users table...");
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN subscription_info jsonb DEFAULT '{}'::jsonb
        `);
      } else {
        console.log("subscription_info column already exists in users table.");
      }
      
      // Check if subscriptionEndDate column exists
      const subscriptionEndDateColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'subscription_end_date'
        );
      `);
      
      if (!subscriptionEndDateColumnResult.rows[0].exists) {
        console.log("Adding subscription_end_date column to users table...");
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN subscription_end_date timestamp
        `);
      } else {
        console.log("subscription_end_date column already exists in users table.");
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log("Migration successful - Added role-based access control fields");
    } else {
      console.log("Users table doesn't exist yet. It will be created with these fields by DrizzleORM.");
      await client.query('COMMIT');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}