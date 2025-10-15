/**
 * Migration to add table for storing account approval details
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function runMigration() {
  console.log('Running migration: add-approval-details');

  try {
    // Create approvalDetails table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "approval_details" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL UNIQUE,
        "approved_by" INTEGER,
        "approval_date" TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "notes" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Successfully created approval_details table');
    return { success: true };
  } catch (error) {
    console.error('Error running migration:', error);
    return { success: false, error };
  }
}