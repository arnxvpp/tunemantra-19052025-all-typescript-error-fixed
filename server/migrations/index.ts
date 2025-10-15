import { runMigration as runEnhancedMetadataMigration } from './add-enhanced-metadata';
import { runMigration as runRoleBasedAccessMigration } from './add-role-based-access';
import { runMigration as runAddPermissionsColumnMigration } from './add-permissions-column';
import { runMigration as runAddApprovalDetailsMigration } from './add-approval-details';

/**
 * Execute all database migrations in the correct order
 */
export async function runAllMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Run migrations in sequence
    await runEnhancedMetadataMigration();
    await runRoleBasedAccessMigration();
    await runAddPermissionsColumnMigration();
    await runAddApprovalDetailsMigration();
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration process failed:', error);
    throw error;
  }
}

// For ES modules, we don't need to check if this is the main module
// This code will be executed by the run-db-migrations.ts script
// runAllMigrations()
//   .then(() => {
//     console.log('All migrations executed successfully!');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Failed to run migrations:', error);
//     process.exit(1);
//   });