# TuneMantra - Zip Creation Instructions

This document explains how to create a zip file of the TuneMantra project for localhost development.

## Project Summary

TuneMantra is a blockchain-powered music distribution platform with the following components:
- TypeScript full-stack architecture (React/Node.js)
- Multi-network blockchain integration
- Advanced access control and content protection
- NFT-based content distribution
- PostgreSQL-powered content management

## Files to Include

The project contains approximately 654 files distributed as follows:

| Directory       | File Count | Description                          |
|-----------------|------------|--------------------------------------|
| client          | 302        | Frontend React application           |
| documentation   | 176        | Project documentation                |
| server          | 93         | Backend Express server               |
| scripts         | 61         | Utility scripts                      |
| shared          | 4          | Shared types and schemas             |
| Root directory  | 17         | Configuration files                  |

A complete manifest of files is available in `tmp/localhost-manifest.txt`.

## Step 1: Download the Project Files

The best way to create the zip file is to:

1. Clone the repository from the source control system
2. Remove any sensitive or unnecessary files

## Step 2: Exclude Unnecessary Files

When creating the zip file, exclude the following directories:
- `node_modules/` - These will be installed by npm
- `.git/` - Git repository data
- `dist/` - Build output
- `.cache/` - Cache files
- `.upm/` - Package manager cache
- `.config/` - Configuration data
- `.archive/` - Archived files
- `tmp/` - Temporary files
- `.local/` - Local user data
- `uploads/` - User uploaded files

Also exclude these files:
- `.env`
- `.env.development`
- `.env.production`
- `.replit`
- `.breakpoints`
- `replit.nix`

## Step 3: Create the Zip File

### On Windows:
1. Select all the files to include
2. Right-click and select "Send to > Compressed (zipped) folder"
3. Name the zip file `tunemantra-localhost.zip`

### On macOS:
1. Select all the files to include
2. Right-click and select "Compress Items"
3. Rename the zip file to `tunemantra-localhost.zip`

### On Linux (Command Line):
```bash
zip -r tunemantra-localhost.zip . -x "node_modules/*" ".git/*" "dist/*" ".cache/*" ".upm/*" ".config/*" ".archive/*" "tmp/*" ".local/*" "uploads/*" ".env" ".env.development" ".env.production" ".replit" ".breakpoints" "replit.nix"
```

## Step 4: Verify the Zip File

After creating the zip file:
1. Extract it to a temporary directory
2. Check that the structure matches the original project
3. Verify that `package.json` and key config files are present
4. Ensure that the documentation files are included

## Step 5: Distribute the Zip File

Now you can share the zip file with developers who need to run the project locally.

## Setting Up After Extraction

After extracting the zip file, users should follow the instructions in:
- `LOCALHOST_SETUP.md` - Basic setup instructions
- `documentation/LOCALHOST_EXTRACTION_GUIDE.md` - Detailed post-extraction setup

## Troubleshooting

If there are issues with the zip file:
1. Check that no essential files were excluded
2. Verify that the folder structure is maintained
3. Ensure that binary files (like images) were properly included