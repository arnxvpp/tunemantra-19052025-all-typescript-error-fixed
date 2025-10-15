/**
 * Analyze Manifest Script
 * 
 * This script analyzes the localhost-manifest.txt file and provides
 * a summary of file types and counts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the manifest file
const manifestPath = path.join(__dirname, '..', 'tmp', 'localhost-manifest.txt');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');
const files = manifestContent.split('\n').filter(Boolean);

// Count files by extension
const extensionCounts = {};
files.forEach(file => {
  const ext = path.extname(file).toLowerCase() || '(no extension)';
  extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
});

// Count files by directory
const directoryCounts = {};
files.forEach(file => {
  const dir = path.dirname(file);
  if (dir === '.') {
    directoryCounts['root'] = (directoryCounts['root'] || 0) + 1;
  } else {
    const topDir = dir.split('/')[0];
    directoryCounts[topDir] = (directoryCounts[topDir] || 0) + 1;
  }
});

// Display summary
console.log('TuneMantra Localhost Package Analysis');
console.log('=====================================');
console.log(`Total files: ${files.length}`);

console.log('\nFiles by extension:');
console.log('------------------');
Object.entries(extensionCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([ext, count]) => {
    console.log(`${ext.padEnd(12)} ${count}`);
  });

console.log('\nFiles by top-level directory:');
console.log('---------------------------');
Object.entries(directoryCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([dir, count]) => {
    console.log(`${dir.padEnd(15)} ${count}`);
  });

console.log('\nThis analysis helps ensure all necessary files are included in the package.');