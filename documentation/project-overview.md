# TuneMantra Project Overview

## Introduction

TuneMantra is a comprehensive music distribution platform that empowers artists and labels to distribute their music globally while efficiently managing their rights and royalties. The platform leverages modern technology, including blockchain integration, to provide a transparent, secure, and artist-centric approach to music distribution. This document provides a high-level overview of the project.

## Core Technology Stack

TuneMantra is built on a modern technology stack:

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Security**: JWT authentication, role-based access control
- **Blockchain Integration**: Smart contracts on Polygon and Ethereum networks for enhanced rights management
- **Testing**: Comprehensive test coverage with Jest and React Testing Library

## Key Features

TuneMantra includes several key features:

1. **Content Distribution**: Multi-channel digital music distribution to all major streaming platforms
2. **Artist Portal**: User-friendly interface for artists to manage releases, track performance, and receive payments
3. **Label Management**: Comprehensive tools for label administrators to manage artists, releases, and royalties
4. **Royalty Management**: Automated royalty calculations and distributions to all rights holders
5. **Analytics Dashboard**: Comprehensive performance tracking across all distribution channels
6. **Rights Management**: Secure and transparent music rights administration
7. **Blockchain Rights Verification**: Optional immutable recording and verification of music rights using blockchain
8. **Smart Contract Integration**: Enhanced rights management through blockchain technology

## Documentation Structure

This repository contains comprehensive documentation organized into logical sections:

- **[Admin](admin/)**: Documentation for platform administrators
- **[Developer](developer/)**: Documentation for developers working on the platform
- **[User](user/)**: Documentation for platform users (artists, labels)
- **[Technical](technical/)**: Detailed technical documentation
- **[Reference](reference/)**: API reference and other reference materials
- **[Diagrams](diagrams/)**: Visual representations of the system
- **[Guides](guides/)**: Step-by-step guides for common tasks
- **[Resources](resources/)**: Additional resources and templates

## Getting Started

- For platform users, start with the [User Guide](user/user-guide.md)
- For developers, refer to the [Developer Onboarding Guide](developer/onboarding-guide.md)
- For system administrators, see the [Admin Guide](admin/README.md)

## Enhanced Rights Management with Blockchain

While TuneMantra's core functionality revolves around music distribution, the platform offers enhanced rights management through optional blockchain integration. This advanced feature provides additional transparency and security for rights holders who desire it. Key blockchain components include:

- **Rights Registry Contract**: Provides optional immutable recording of music rights
- **Music NFT Contract**: Enables creation of verifiable digital assets representing music ownership
- **Royalty Splitter Contract**: Offers an alternative method for transparent royalty distribution

Blockchain integration is entirely optional and complementary to TuneMantra's traditional rights management system, offering artists and labels additional options for managing their intellectual property.

For detailed information about the blockchain integration, see the [Blockchain Documentation](technical/blockchain/README.md).

## Project Status

TuneMantra is in active development with regular feature additions and improvements. For the latest development roadmap, see the [Implementation Roadmap](technical/IMPLEMENTATION_ROADMAP.md).