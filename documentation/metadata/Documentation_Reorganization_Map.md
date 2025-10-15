# Documentation Reorganization Map

This document provides a mapping between the previous documentation organization and the updated unified documentation structure. It helps users find information that may have been relocated or renamed during the documentation reorganization.

## Section Renaming Map

| Previous Section Name | New Section Name | Notes |
|----------------------|------------------|-------|
| Blockchain Technology | Enhanced Security with Blockchain | Repositioned as section 13 instead of section 3 |
| Rights Management | Rights Management | Maintained as important feature but positioned after distribution |
| Distribution Systems | Distribution Systems | Moved up to section 3 to reflect primary focus |
| Audio Processing | Music Asset Management | Renamed to better reflect its role in the platform |
| API Reference | API Reference | Maintained same name and focus |
| AI & Machine Learning | AI & Machine Learning | Maintained same name but positioned after core features |
| Project History & Evolution | Operational Guidelines | Updated to focus on operational aspects |

## File Location Changes

| Previous File Path | New File Path | Notes |
|-------------------|---------------|-------|
| technical/blockchain/README.md | technical/blockchain/README.md | File maintained but content updated |
| technical/blockchain/contracts.md | technical/blockchain/contracts.md | Technical details preserved |
| technical/blockchain/integration.md | technical/blockchain/integration.md | Technical details preserved |
| technical/audio/processing.md | technical/audio/asset-management.md | Renamed to reflect function |
| technical/rights_management/blockchain.md | technical/rights_management/enhanced-security.md | Renamed to reflect function |

## Directory Structure Changes

The overall directory structure has been maintained with updated content:

```
documentation/
├── admin/                       # Admin documentation (unchanged)
├── analysis/                    # Documentation analysis tools (unchanged)
├── developer/                   # Developer documentation (unchanged)
├── diagrams/                    # System diagrams (unchanged)
├── features/                    # Feature documentation (unchanged)
├── guides/                      # User guides (updated content)
├── metadata/                    # Documentation about documentation (new files added)
│   ├── Comprehensive_Documentation_Update_Guide.md  # New file
│   ├── Documentation_Reorganization_Map.md          # This file
│   ├── Unified_Documentation_Guide.md               # New file
├── project/                     # Project documentation (unchanged)
├── reference/                   # API reference (unchanged)
├── resources/                   # Additional resources (unchanged)
├── technical/                   # Technical documentation (reorganized content)
│   ├── advanced/                # Advanced features (unchanged)
│   ├── analytics/               # Analytics documentation (moved up)
│   ├── api/                     # API documentation (unchanged)
│   ├── architecture/            # System architecture (unchanged)
│   ├── audio/                   # Audio processing (renamed files)
│   ├── blockchain/              # Blockchain integration (unchanged location)
│   ├── core/                    # Core functionality (unchanged)
│   ├── database/                # Database documentation (unchanged)
│   ├── distribution/            # Distribution system (expanded)
│   ├── integration/             # Integration documentation (unchanged)
│   ├── operations/              # Operations documentation (unchanged)
│   ├── platforms/               # Platform-specific documentation (unchanged)
│   ├── repository/              # Repository structure (unchanged)
│   ├── rights_management/       # Rights management (updated)
│   ├── royalty/                 # Royalty management (unchanged)
│   ├── security/                # Security documentation (unchanged)
│   └── services/                # Services documentation (unchanged)
├── testing/                     # Testing documentation (unchanged)
├── user/                        # User documentation (updated)
├── MASTER_INDEX.md              # Updated to reflect new organization
└── project-overview.md          # Updated to reflect primary focus
```

## Finding Specific Information

If you're looking for specific information and can't find it in its previous location, use one of these approaches:

1. **Consult the Master Index**: The [MASTER_INDEX.md](../MASTER_INDEX.md) file has been updated with cross-references between the comprehensive documentation and directory locations.

2. **Use the Documentation Search Tool**: Run the documentation search utility to find content by keyword:
   ```
   node scripts/utils/doc_search.js "your search term"
   ```

3. **Check the Comprehensive Documentation**: All historical information remains in the comprehensive documentation file, searchable using standard text search tools.

4. **Refer to the Content Comparison**: The content comparison tools in the analysis directory can help identify unique content in either documentation system.

## Preserving All Information

This reorganization focuses on properly positioning TuneMantra's features while preserving all technical details. No information has been removed - it has only been reorganized to better reflect the platform's primary focus as a music distribution system with blockchain as an enhancing technology.