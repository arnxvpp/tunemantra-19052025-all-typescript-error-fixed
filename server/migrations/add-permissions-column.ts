/**
 * This migration script adds the permissions column to the users table if it doesn't exist
 */
import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function runMigration() {
  console.log("Running migration: add-permissions-column");
  
  try {
    // Check if permissions column exists
    const checkPermissions = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'permissions'
    `);
    
    if (checkPermissions.rows.length === 0) {
      // Add the permissions column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb
      `);
      console.log("Added permissions column to users table");
    } else {
      console.log("permissions column already exists in users table");
    }
    
    return true;
  } catch (error) {
    console.error("Error running add-permissions-column migration:", error);
    return false;
  }
}