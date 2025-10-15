#!/usr/bin/env python3
import os
import re
import hashlib
from collections import defaultdict, OrderedDict

# Define the category display order and titles for the book
CATEGORY_ORDER = [
    ("overview", "1. Project Overview"),
    ("architecture", "2. System Architecture"),
    ("blockchain", "3. Blockchain Technology"),
    ("rights", "4. Rights Management"),
    ("database", "5. Database Schema"),
    ("api", "6. API Reference"),
    ("user", "7. User Guides"),
    ("admin", "8. Administration"),
    ("development", "9. Development"),
    ("integration", "10. Integrations"),
    ("analytics", "11. Analytics & Reporting"),
    ("distribution", "12. Distribution Systems"),
    ("ai", "13. AI & Machine Learning"),
    ("security", "14. Security"),
    ("testing", "15. Testing & Quality Assurance"),
    ("other", "16. Additional Documentation"),
]

# Content cache to detect duplicates
content_hashes = {}
seen_titles = set()

def clean_markdown_content(content):
    """Clean and standardize markdown content"""
    # Remove HTML comments
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    # Standardize heading levels (make sure they're properly nested)
    lines = content.split('\n')
    result_lines = []
    
    for line in lines:
        # Skip empty lines or just whitespace
        if not line.strip():
            result_lines.append('')
            continue
        
        # Process headings
        if line.strip().startswith('#'):
            # Count the number of hash symbols
            match = re.match(r'^(#+)', line.strip())
            if match:
                heading_level = len(match.group(1))
                heading_text = line.strip()[heading_level:].strip()
                
                # Adjust heading level based on position in document
                if heading_level == 1:
                    # Keep top-level headings as h2 (we'll have a h1 for the category)
                    result_lines.append(f"## {heading_text}")
                else:
                    # Increase other heading levels by 1
                    result_lines.append(f"{'#' * (heading_level + 1)} {heading_text}")
            else:
                # If for some reason the regex match fails, just add the line as is
                result_lines.append(line)
        else:
            result_lines.append(line)
    
    return '\n'.join(result_lines)

def extract_title(filename, content):
    """Extract a title from the file content or filename"""
    # Try to find the first heading in the content
    match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if match:
        title = match.group(1).strip()
        return title
    
    # Fall back to filename
    base = os.path.basename(filename)
    title = os.path.splitext(base)[0]
    # Convert kebab-case or snake_case to Title Case
    title = re.sub(r'[-_]', ' ', title).title()
    return title

def is_duplicate_content(content):
    """Check if content is a duplicate based on hash"""
    # Create a hash of the content
    content_hash = hashlib.md5(content.encode('utf-8')).hexdigest()
    
    if content_hash in content_hashes:
        return True
    
    content_hashes[content_hash] = True
    return False

def is_duplicate_title(title):
    """Check if a title is a duplicate"""
    if title.lower() in seen_titles:
        return True
    
    seen_titles.add(title.lower())
    return False

def process_file(filename):
    """Process a single markdown file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip empty files
        if not content.strip():
            return None
            
        # Get title
        title = extract_title(filename, content)
        
        # Clean and standardize content
        processed_content = clean_markdown_content(content)
        
        # Check for duplicate content
        if is_duplicate_content(processed_content):
            return None
            
        # Check for duplicate title and modify if needed
        original_title = title
        counter = 1
        while is_duplicate_title(title):
            counter += 1
            title = f"{original_title} ({counter})"
        
        # Return processed content with appropriate section title
        return {
            "title": title,
            "content": processed_content,
            "source": filename
        }
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        return None

def process_category(category, files):
    """Process all files in a category"""
    results = []
    duplicate_content_count = 0
    duplicate_title_count = 0
    empty_file_count = 0
    processed_count = 0
    
    print(f"Processing {len(files)} files in category: {category}")
    
    for file in files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if file is empty
            if not content.strip():
                empty_file_count += 1
                print(f"  - Skipping empty file: {file}")
                continue
                
            # Get title
            title = extract_title(file, content)
            
            # Clean and standardize content
            processed_content = clean_markdown_content(content)
            
            # Check for duplicate content
            if is_duplicate_content(processed_content):
                duplicate_content_count += 1
                # print(f"  - Skipping duplicate content: {file}")
                continue
                
            # Check for duplicate title and modify if needed
            original_title = title
            counter = 1
            if is_duplicate_title(title):
                duplicate_title_count += 1
                while is_duplicate_title(title):
                    counter += 1
                    title = f"{original_title} ({counter})"
                # print(f"  - Renamed duplicate title: {original_title} → {title}")
            
            # Add to results
            results.append({
                "title": title,
                "content": processed_content,
                "source": file
            })
            processed_count += 1
            
        except Exception as e:
            print(f"  - Error processing {file}: {e}")
    
    print(f"Category '{category}' summary:")
    print(f"  - Total files: {len(files)}")
    print(f"  - Empty files skipped: {empty_file_count}")
    print(f"  - Duplicate content skipped: {duplicate_content_count}")
    print(f"  - Duplicate titles renamed: {duplicate_title_count}")
    print(f"  - Successfully processed: {processed_count}")
    
    return results

def main():
    # Read the categorized files
    categorized_files = defaultdict(list)
    current_category = None
    
    with open("categorized_files.txt", "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith("# "):
                current_category = line[2:].lower()
            elif current_category and os.path.exists(line):
                categorized_files[current_category].append(line)
    
    # Process each category
    book_sections = OrderedDict()
    for category, title in CATEGORY_ORDER:
        if category in categorized_files:
            book_sections[title] = process_category(category, categorized_files[category])
    
    # Create the merged markdown document
    with open("TuneMantra_Comprehensive_Documentation.md", "w", encoding='utf-8') as out:
        # Write the book title
        out.write("# TuneMantra: Comprehensive Documentation\n\n")
        out.write("*A blockchain-powered music distribution platform revolutionizing artist empowerment through intelligent rights management and comprehensive content delivery systems.*\n\n")
        
        # Write the table of contents
        out.write("## Table of Contents\n\n")
        for section_title in book_sections.keys():
            out.write(f"- [{section_title}](#{section_title.lower().replace(' ', '-').replace(':', '').replace('&', 'and')})\n")
        out.write("\n---\n\n")
        
        # Write each section
        for section_title, section_docs in book_sections.items():
            out.write(f"# {section_title}\n\n")
            
            # Write each document in the section
            for doc in section_docs:
                out.write(f"## {doc['title']}\n\n")
                out.write(f"{doc['content']}\n\n")
                out.write(f"*Source: {doc['source']}*\n\n")
                out.write("---\n\n")
            
        # Write book metadata
        out.write("\n## Document Information\n\n")
        out.write("This comprehensive documentation was automatically generated by merging multiple markdown files from the TuneMantra project archive.\n\n")
        out.write(f"- Total source files: {sum(len(docs) for docs in book_sections.values())}\n")
        out.write(f"- Total categories: {len(book_sections)}\n")
        out.write(f"- Generation date: {os.popen('date').read().strip()}\n\n")
        
        # Count files from each source directory
        directory_counts = defaultdict(int)
        for section_docs in book_sections.values():
            for doc in section_docs:
                source = doc['source']
                # Extract the source directory path
                if ".archive/archive_docs/" in source:
                    # Get the first directory after .archive/archive_docs/
                    path_parts = source.split(".archive/archive_docs/")[1].split("/")
                    if len(path_parts) > 0:
                        main_dir = path_parts[0]
                        directory_counts[main_dir] += 1
                else:
                    directory_counts["other"] += 1
        
        # Write directory distribution
        out.write("### Source Directory Distribution\n\n")
        out.write("This document includes files from the following directories:\n\n")
        for directory, count in sorted(directory_counts.items(), key=lambda x: x[1], reverse=True):
            out.write(f"- **{directory}**: {count} files\n")
        out.write("\n")
    
    print(f"Merged documentation created successfully: TuneMantra_Comprehensive_Documentation.md")
    print(f"Total sections: {len(book_sections)}")
    print(f"Total documents included: {sum(len(docs) for docs in book_sections.values())}")

if __name__ == "__main__":
    main()