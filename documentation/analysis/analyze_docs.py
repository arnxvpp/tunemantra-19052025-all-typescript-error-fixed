#!/usr/bin/env python3
import os
import re
import glob
from collections import defaultdict

# Define major categories
CATEGORIES = {
    "overview": ["overview", "introduction", "about", "readme", "executive-summary", "project-status"],
    "architecture": ["architecture", "system", "structure", "design"],
    "api": ["api", "endpoint", "reference", "rest"],
    "database": ["database", "schema", "data-model", "db"],
    "blockchain": ["blockchain", "smart-contract", "nft", "token", "crypto", "web3"],
    "rights": ["rights", "royalty", "licensing", "copyright"],
    "user": ["user", "guide", "manual", "tutorial"],
    "admin": ["admin", "management", "deployment", "operation"],
    "development": ["develop", "code", "implementation", "coding", "workflow"],
    "analytics": ["analytics", "metrics", "reporting", "dashboard"],
    "ai": ["ai", "machine-learning", "ml", "recommendation", "algorithm"],
    "security": ["security", "auth", "authentication", "privacy"],
    "testing": ["test", "qa", "quality"],
    "distribution": ["distribution", "delivery", "streaming", "dsp"],
    "integration": ["integration", "connection", "third-party"],
}

def categorize_file(filename):
    base = os.path.basename(filename).lower()
    
    # Extract the filename without extension
    name_only = os.path.splitext(base)[0]
    
    # Check if the name matches any category
    for category, keywords in CATEGORIES.items():
        for keyword in keywords:
            if keyword in name_only:
                return category
    
    # Default category
    return "other"

def main():
    # Define specific directories to search to ensure we catch everything
    root_dir = "/home/runner/workspace/"
    search_dirs = [
        f"{root_dir}.archive/archive_docs/**/*.md",
        f"{root_dir}.archive/archive_docs/advanced_features/**/*.md",
        f"{root_dir}.archive/archive_docs/blockchain_docs_backup/**/*.md",
        f"{root_dir}.archive/archive_docs/doc_backup/**/*.md",
        f"{root_dir}.archive/archive_docs/documentation/**/*.md",
        f"{root_dir}.archive/archive_docs/documentation_backup_20250330/**/*.md",
        f"{root_dir}.archive/archive_docs/essential_docs/**/*.md"
    ]
    
    # Get all markdown files from all directories
    md_files = []
    for search_pattern in search_dirs:
        found_files = glob.glob(search_pattern, recursive=True)
        print(f"Found {len(found_files)} files in {search_pattern}")
        md_files.extend(found_files)
    
    # Remove duplicates by converting to a set and back to a list
    md_files = list(set(md_files))
    
    # Categorize files
    categorized = defaultdict(list)
    for file in md_files:
        category = categorize_file(file)
        categorized[category].append(file)
    
    # Print statistics
    print(f"Found {len(md_files)} unique markdown files")
    print("\nCategory distribution:")
    for category, files in sorted(categorized.items()):
        print(f"  {category}: {len(files)} files")
        
    # Print the first few files in each category to verify
    print("\nSample files by category:")
    for category, files in sorted(categorized.items()):
        print(f"  {category}:")
        for file in sorted(files)[:3]:  # Show first 3 files
            print(f"    - {file}")
        if len(files) > 3:
            print(f"    - ... and {len(files) - 3} more files")
    
    # Save categorized files to disk for merging
    with open("categorized_files.txt", "w") as f:
        for category, files in sorted(categorized.items()):
            f.write(f"# {category.upper()}\n")
            for file in sorted(files):
                f.write(f"{file}\n")
            f.write("\n")
    
    print("\nCategories saved to temp/categorized_files.txt")

if __name__ == "__main__":
    main()