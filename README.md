# TuneMantra

TuneMantra is a comprehensive music distribution platform that empowers artists and labels to distribute their music globally while efficiently managing their rights and royalties. The platform leverages modern technology, including optional blockchain integration, to provide a transparent, secure, and artist-centric approach to music distribution.

## Core Features

- **Music Distribution** - Distribute music to 150+ streaming platforms worldwide
- **Release Management** - Create and manage professional releases across platforms
- **Performance Analytics** - Track streams, downloads, and audience engagement
- **Royalty Management** - Calculate, track, and distribute royalties automatically
- **Content Management** - Upload, organize, and manage music assets efficiently
- **Rights Administration** - Securely manage music rights and ownership
- **Enhanced Security** - Optional blockchain integration for additional rights protection

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Distribution APIs**: Integrations with major streaming platforms
- **Authentication**: JWT, session-based authentication
- **Storage**: Scalable audio file storage with cloud integration
- **Analytics**: Real-time performance tracking and data visualization
- **Blockchain (Optional)**: Rights verification on Ethereum, Polygon networks

## Development Status

The platform is currently in active development with core features implemented and tested. See the [Implementation Roadmap](documentation/technical/IMPLEMENTATION_ROADMAP.md) for current status and future plans.

## Documentation

TuneMantra provides three complementary documentation systems to meet different needs:

### 1. Directory-based Documentation

Organized documentation is available in the [documentation](documentation/README.md) directory:

- [Project Documentation](documentation/project/README.md)
- [Technical Documentation](documentation/technical/README.md)
- [User Documentation](documentation/user/README.md)
- [Developer Documentation](documentation/developer/README.md)
- [Admin Documentation](documentation/admin/README.md)
- [API Reference](documentation/reference/api/README.md)

### 2. Topic-Based Documentation (Archived)

For better performance and navigation, we've created topic-based documentation that splits the comprehensive documentation into manageable topic files. This is accessible through the [Topic Documentation Index](documentation/indexes/TOPIC_DOCUMENTATION_INDEX.md). The topic files are stored in the `documentation/archive/sections/topics/` directory.

### 3. Comprehensive Documentation (Archived)

A complete historical archive is available in the [TuneMantra_Comprehensive_Documentation.md](documentation/archive/TuneMantra_Comprehensive_Documentation.md) file, stored in the archive directory. Note that this is a very large file (8.9MB) and may cause browser performance issues. A reference guide is also available in the [TuneMantra_Documentation_Reference.md](documentation/references/TuneMantra_Documentation_Reference.md) file.

### 4. Setup and Security Documentation

- **Setup Documentation**: [LOCALHOST_SETUP.md](documentation/setup/LOCALHOST_SETUP.md), [ZIP_CREATION_INSTRUCTIONS.md](documentation/setup/ZIP_CREATION_INSTRUCTIONS.md)
- **Security Updates**: [security-updates.md](documentation/security/security-updates.md)
- **Dependencies**: [dependencies.md](documentation/dependencies/dependencies.md)

### Navigation Between Systems

A [Documentation Index](documentation/DOCUMENTATION_INDEX.md) provides an overview of the reorganized documentation structure. The [Master Index](documentation/indexes/MASTER_INDEX.md) is available to help navigate between all documentation systems. For more information about the documentation organization, see [Documentation Systems](documentation/metadata/DOCUMENTATION_SYSTEMS.md).

## Getting Started

1. Clone the repository
2. Install dependencies using `npm install`
3. Configure environment variables (see `.env.example`)
4. Start the application using `npm run dev`

## Contributing

Please refer to the [Technical Implementation](documentation/technical/core/README.md) document for guidance on the codebase structure and development practices.

## License

© 2025 TuneMantra. All rights reserved.