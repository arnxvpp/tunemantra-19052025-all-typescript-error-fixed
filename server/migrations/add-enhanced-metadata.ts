import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * This migration script enhances our database schema with rich metadata fields
 * for music distribution. It adds enum types for categorization and extends
 * existing tables with nullable columns to ensure backward compatibility.
 */
export async function runMigration() {
  console.log('Starting enhanced metadata migration...');

  try {
    // Start a transaction for all schema changes
    await db.transaction(async (tx) => {
      console.log('Creating enum types...');
      
      // Check if enum types exist before creating them
      const checkEnumType = async (typeName: string) => {
        const result = await tx.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM pg_type
            JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
            WHERE pg_type.typname = ${typeName}
          ) as exists
        `);
        return result.rows[0].exists;
      };
      
      // Create content type enum if it doesn't exist
      if (!await checkEnumType('content_type_enum')) {
        await tx.execute(sql`
          CREATE TYPE content_type_enum AS ENUM (
            'single', 'album', 'ep', 'compilation', 'remix', 'live'
          );
        `);
      }

      // Create audio format enum if it doesn't exist
      if (!await checkEnumType('audio_format_enum')) {
        await tx.execute(sql`
          CREATE TYPE audio_format_enum AS ENUM (
            'mp3', 'wav', 'flac', 'aac', 'ogg', 'alac', 'aiff'
          );
        `);
      }

      // Create language enum with comprehensive options if it doesn't exist
      if (!await checkEnumType('language_enum')) {
        await tx.execute(sql`
          CREATE TYPE language_enum AS ENUM (
            'english', 'spanish', 'french', 'german', 'hindi', 'japanese', 'korean', 
            'portuguese', 'russian', 'mandarin', 'cantonese', 'arabic', 'instrumental'
          );
        `);
      }

      // Create genre category enum if it doesn't exist
      if (!await checkEnumType('genre_category_enum')) {
        await tx.execute(sql`
          CREATE TYPE genre_category_enum AS ENUM (
            'pop', 'rock', 'hip_hop', 'electronic', 'rb', 'country', 'latin', 
            'jazz', 'classical', 'folk', 'blues', 'metal', 'reggae', 'world'
          );
        `);
      }

      // Create distribution status enum if it doesn't exist
      if (!await checkEnumType('distribution_status_enum')) {
        await tx.execute(sql`
          CREATE TYPE distribution_status_enum AS ENUM (
            'pending', 'processing', 'distributed', 'failed', 'scheduled', 'canceled'
          );
        `);
      }

      // Create royalty type enum if it doesn't exist
      if (!await checkEnumType('royalty_type_enum')) {
        await tx.execute(sql`
          CREATE TYPE royalty_type_enum AS ENUM (
            'performance', 'mechanical', 'synchronization', 'print', 'digital'
          );
        `);
      }

      // Create ownership type enum if it doesn't exist
      if (!await checkEnumType('ownership_type_enum')) {
        await tx.execute(sql`
          CREATE TYPE ownership_type_enum AS ENUM (
            'original', 'licensed', 'public_domain', 'sample_cleared', 'remix_authorized'
          );
        `);
      }

      // Function to check if a column exists in a table
      const columnExists = async (tableName: string, columnName: string) => {
        const result = await tx.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = ${tableName} AND column_name = ${columnName}
          ) as exists
        `);
        return result.rows[0].exists;
      };

      // Function to add a column if it doesn't exist
      const addColumnIfNotExists = async (tableName: string, columnDefinition: string) => {
        const [columnName, ...rest] = columnDefinition.trim().split(' ');
        if (!await columnExists(tableName, columnName)) {
          await tx.execute(sql`ALTER TABLE ${sql.raw(tableName)} ADD COLUMN ${sql.raw(columnDefinition)}`);
          return true;
        }
        return false;
      };

      console.log('Enhancing releases table...');
      
      // Check if releases table exists
      const releasesExists = await tx.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'releases'
        ) as exists
      `);
      
      if (releasesExists.rows[0].exists) {
        // Add new columns to releases table if they don't exist
        const releaseColumns = [
          "catalog_number TEXT",
          "original_release_date TIMESTAMP",
          "digital_release_date TIMESTAMP",
          "recording_year INTEGER",
          "p_line TEXT",
          "c_line TEXT",
          "rights_holder TEXT",
          "copyright_year INTEGER",
          "sub_genre TEXT",
          "parental_advisory BOOLEAN DEFAULT FALSE",
          "keywords TEXT[]",
          "primary_genre_category genre_category_enum",
          "publishing_rights TEXT",
          "licensing_confirmed BOOLEAN DEFAULT FALSE",
          "royalty_clearance_confirmed BOOLEAN DEFAULT FALSE",
          "territory_restrictions TEXT[]",
          "moods JSONB DEFAULT '[]'",
          "themes JSONB DEFAULT '[]'",
          "quality_score INTEGER",
          "artwork_url TEXT",
          "artwork_metadata JSONB DEFAULT '{}'",
          "additional_images JSONB DEFAULT '[]'",
          "credits JSONB DEFAULT '{}'",
          "primary_distribution_platforms TEXT[]",
          "exclusivity_details JSONB DEFAULT '{}'",
          "promotional_instructions TEXT",
          "marketing_materials JSONB DEFAULT '[]'",
          "source_quality TEXT",
          "master_reference TEXT",
          "archived_at TIMESTAMP"
        ];
        
        for (const columnDef of releaseColumns) {
          try {
            await addColumnIfNotExists('releases', columnDef);
          } catch (error) {
            console.warn(`Error adding column to releases: ${columnDef}`, error);
          }
        }
      } else {
        console.log('Releases table does not exist. Skipping enhancement.');
      }

      console.log('Enhancing tracks table...');
      
      // Check if tracks table exists
      const tracksExists = await tx.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'tracks'
        ) as exists
      `);
      
      if (tracksExists.rows[0].exists) {
        // Add new columns to tracks table if they don't exist
        const trackColumns = [
          "release_id INTEGER",
          "version TEXT",
          "featured_artists TEXT[]",
          "track_number INTEGER",
          "disc_number INTEGER DEFAULT 1",
          "isrc TEXT",
          "sub_genre TEXT",
          "language language_enum",
          "duration INTEGER",
          "bpm INTEGER",
          "key TEXT",
          "time_signature TEXT",
          "explicit BOOLEAN DEFAULT FALSE",
          "songwriter TEXT[]",
          "composer TEXT[]",
          "publisher TEXT[]",
          "producer TEXT[]",
          "sample_clearance BOOLEAN DEFAULT FALSE",
          "sample_details JSONB DEFAULT '{}'",
          "ownership_type ownership_type_enum DEFAULT 'original'",
          "audio_format audio_format_enum",
          "file_path TEXT",
          "file_size NUMERIC",
          "bitrate INTEGER",
          "sample_rate INTEGER",
          "channels INTEGER",
          "stem_available BOOLEAN DEFAULT FALSE",
          "stems JSONB DEFAULT '{}'",
          "lyrics TEXT",
          "moods TEXT[]",
          "themes TEXT[]",
          "instruments TEXT[]",
          "ai_tags JSONB DEFAULT '{}'",
          "content_analysis JSONB DEFAULT '{}'",
          "workflow_status TEXT DEFAULT 'pending'",
          "updated_at TIMESTAMP DEFAULT NOW()"
        ];
        
        for (const columnDef of trackColumns) {
          try {
            await addColumnIfNotExists('tracks', columnDef);
          } catch (error) {
            console.warn(`Error adding column to tracks: ${columnDef}`, error);
          }
        }
      } else {
        console.log('Tracks table does not exist. Skipping enhancement.');
      }

      // Check if distribution_records table exists
      const distributionRecordsExists = await tx.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'distribution_records'
        ) as exists
      `);
      
      if (distributionRecordsExists.rows[0].exists) {
        console.log('Enhancing distribution_records table...');
        
        // Add new columns to distribution_records table if they don't exist
        const distributionColumns = [
          "platform_metadata JSONB DEFAULT '{}'",
          "platform_cover_art_url TEXT",
          "format_delivered TEXT",
          "delivery_method TEXT",
          "territories TEXT[] DEFAULT ARRAY['worldwide']",
          "exclusions TEXT[]",
          "pricing_tier TEXT",
          "release_date TIMESTAMP",
          "pre_order_date TIMESTAMP",
          "takedown_date TIMESTAMP",
          "visibility JSONB DEFAULT '{\"searchable\": true, \"featured\": false, \"playlistEligible\": true}'",
          "tracked_since TIMESTAMP",
          "last_checked TIMESTAMP",
          "validation_results JSONB DEFAULT '{}'",
          "retry_count INTEGER DEFAULT 0",
          "last_error TEXT",
          "error_date TIMESTAMP"
        ];
        
        for (const columnDef of distributionColumns) {
          try {
            await addColumnIfNotExists('distribution_records', columnDef);
          } catch (error) {
            console.warn(`Error adding column to distribution_records: ${columnDef}`, error);
          }
        }
      } else {
        console.log('Creating distribution_records table...');
        
        // Create distribution_records table if it doesn't exist
        await tx.execute(sql`
          CREATE TABLE distribution_records (
            id SERIAL PRIMARY KEY,
            release_id INTEGER,
            platform_id INTEGER,
            platform_name TEXT,
            distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status distribution_status_enum DEFAULT 'pending',
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            error_message TEXT,
            platform_specific_id TEXT,
            url TEXT,
            territories TEXT[] DEFAULT ARRAY['worldwide'],
            metadata JSONB,
            platform_metadata JSONB DEFAULT '{}',
            platform_cover_art_url TEXT,
            format_delivered TEXT,
            delivery_method TEXT,
            exclusions TEXT[],
            pricing_tier TEXT,
            release_date TIMESTAMP,
            pre_order_date TIMESTAMP,
            takedown_date TIMESTAMP,
            visibility JSONB DEFAULT '{"searchable": true, "featured": false, "playlistEligible": true}',
            tracked_since TIMESTAMP,
            last_checked TIMESTAMP,
            validation_results JSONB DEFAULT '{}',
            retry_count INTEGER DEFAULT 0,
            last_error TEXT,
            error_date TIMESTAMP
          );
        `);
      }

      // Check if rights_management table exists
      const rightsManagementExists = await tx.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'rights_management'
        ) as exists
      `);
      
      if (!rightsManagementExists.rows[0].exists) {
        console.log('Creating rights management table...');
        
        // Create rights_management table
        await tx.execute(sql`
          CREATE TABLE rights_management (
            id SERIAL PRIMARY KEY,
            release_id INTEGER,
            track_id INTEGER,
            rights_type TEXT NOT NULL,
            ownership_percentage NUMERIC NOT NULL,
            rights_holder TEXT NOT NULL,
            territory TEXT[] DEFAULT ARRAY['worldwide'],
            start_date TIMESTAMP,
            end_date TIMESTAMP,
            documentation_url TEXT,
            verification_status TEXT DEFAULT 'pending',
            verified_by INTEGER,
            verified_date TIMESTAMP,
            contract_id TEXT,
            contract_terms JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);
      }

      // Check if royalty_splits table exists
      const royaltySplitsExists = await tx.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'royalty_splits'
        ) as exists
      `);
      
      if (!royaltySplitsExists.rows[0].exists) {
        console.log('Creating royalty_splits table...');
        
        // Create royalty_splits table
        await tx.execute(sql`
          CREATE TABLE royalty_splits (
            id SERIAL PRIMARY KEY,
            release_id INTEGER,
            track_id INTEGER,
            participant_id INTEGER NOT NULL,
            participant_type TEXT NOT NULL,
            participant_name TEXT NOT NULL,
            share_percentage NUMERIC NOT NULL,
            royalty_type royalty_type_enum NOT NULL,
            status TEXT DEFAULT 'pending',
            is_confirmed BOOLEAN DEFAULT FALSE,
            confirmed_date TIMESTAMP,
            payment_method TEXT,
            payment_details JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);
      }

      // Function to check if a constraint exists
      const constraintExists = async (tableName: string, constraintName: string) => {
        const result = await tx.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = ${tableName} AND constraint_name = ${constraintName}
          ) as exists
        `);
        return result.rows[0].exists;
      };

      console.log('Adding foreign key relationships if they don\'t exist...');
      
      // Add foreign key constraints if they don't exist
      if (tracksExists.rows[0].exists && !await constraintExists('tracks', 'fk_tracks_release')) {
        try {
          await tx.execute(sql`
            ALTER TABLE tracks
            ADD CONSTRAINT fk_tracks_release
            FOREIGN KEY (release_id)
            REFERENCES releases(id)
            ON DELETE CASCADE;
          `);
        } catch (error) {
          console.warn('Error adding foreign key to tracks table:', error);
        }
      }

      if (!await constraintExists('rights_management', 'fk_rights_release')) {
        try {
          await tx.execute(sql`
            ALTER TABLE rights_management
            ADD CONSTRAINT fk_rights_release
            FOREIGN KEY (release_id)
            REFERENCES releases(id)
            ON DELETE CASCADE;
          `);
        } catch (error) {
          console.warn('Error adding foreign key to rights_management table:', error);
        }
      }

      if (!await constraintExists('rights_management', 'fk_rights_track')) {
        try {
          await tx.execute(sql`
            ALTER TABLE rights_management
            ADD CONSTRAINT fk_rights_track
            FOREIGN KEY (track_id)
            REFERENCES tracks(id)
            ON DELETE CASCADE;
          `);
        } catch (error) {
          console.warn('Error adding foreign key to rights_management table:', error);
        }
      }

      if (!await constraintExists('royalty_splits', 'fk_royalty_release')) {
        try {
          await tx.execute(sql`
            ALTER TABLE royalty_splits
            ADD CONSTRAINT fk_royalty_release
            FOREIGN KEY (release_id)
            REFERENCES releases(id)
            ON DELETE CASCADE;
          `);
        } catch (error) {
          console.warn('Error adding foreign key to royalty_splits table:', error);
        }
      }

      if (!await constraintExists('royalty_splits', 'fk_royalty_track')) {
        try {
          await tx.execute(sql`
            ALTER TABLE royalty_splits
            ADD CONSTRAINT fk_royalty_track
            FOREIGN KEY (track_id)
            REFERENCES tracks(id)
            ON DELETE CASCADE;
          `);
        } catch (error) {
          console.warn('Error adding foreign key to royalty_splits table:', error);
        }
      }
    });

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// For ES modules, we don't need to check if this is the main module
// This code will only run when imported through migrations/index.js
// runMigration()
//   .then(() => {
//     console.log('Migration executed successfully!');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Migration failed:', error);
//     process.exit(1);
//   });