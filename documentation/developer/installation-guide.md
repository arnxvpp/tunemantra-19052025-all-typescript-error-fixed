# TuneMantra Installation Guide

*Version: 1.0.0 (March 27, 2025)*

## Table of Contents

- [Introduction](#introduction)
- [System Requirements](#system-requirements)
- [Development Environment Setup](#development-environment-setup)
- [Production Environment Setup](#production-environment-setup)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [External Service Integration](#external-service-integration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Appendix](#appendix)

## Introduction

This guide provides comprehensive instructions for setting up both development and production environments for the TuneMantra platform. It covers environment preparation, component installation, configuration, and verification procedures.

### Purpose and Scope

This document is intended for:

- Developers setting up local development environments
- DevOps engineers deploying to production environments
- System administrators maintaining TuneMantra installations
- Quality assurance teams establishing testing environments

### Prerequisites

To complete this installation guide, you should have:

- Basic understanding of web application architecture
- Familiarity with command-line operations
- Knowledge of database management
- Understanding of containerization concepts
- Access to necessary infrastructure and credentials

## System Requirements

### Development Environment

Minimum requirements for a development environment:

- **Operating System**: macOS 12+, Windows 10/11, or Linux (Ubuntu 20.04+, Debian 11+)
- **CPU**: 4+ cores
- **Memory**: 16GB RAM
- **Storage**: 40GB available space (SSD recommended)
- **Database**: PostgreSQL 14+
- **Node.js**: v18.18+ or v20.10+
- **Git**: 2.30+
- **Docker**: 24.0+ (for containerized services)
- **Display**: 1920x1080 resolution (for UI development)

### Production Environment

Recommended specifications for production deployment:

- **Infrastructure**: Cloud-based or on-premises with high availability
- **Application Servers**:
  - Minimum 4 vCPUs, 16GB RAM per instance
  - Autoscaling group with 2+ instances
  - Load balancer with SSL termination
- **Database**:
  - PostgreSQL 14+ with high availability
  - Minimum 8 vCPUs, 32GB RAM
  - 500GB+ storage with backup capability
- **File Storage**:
  - Object storage service (S3-compatible)
  - CDN for media content delivery
- **Caching Layer**:
  - Redis 6.2+ cluster
  - Minimum 8GB memory allocation
- **Message Queue**:
  - Kafka 3.0+ or equivalent
  - Minimum 3-node cluster

### Network Requirements

Connectivity requirements:

- **Development**:
  - Internet access for package downloads
  - GitHub access for source repositories
  - Local ports 3000-3010 available for services
- **Production**:
  - Inbound ports 80/443 for web traffic
  - Outbound access to external APIs
  - Secure internal network for service communication
  - VPN or bastion host for administrative access

## Development Environment Setup

### Initial Setup

#### 1. Install System Dependencies

**macOS (using Homebrew)**:

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required dependencies
brew update
brew install node@20 postgresql@14 redis git
brew install --cask docker

# Start services
brew services start postgresql@14
brew services start redis
```

**Ubuntu/Debian**:

```bash
# Update package lists
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql-14 postgresql-contrib-14

# Install Redis
sudo apt install -y redis-server

# Install Git
sudo apt install -y git

# Install Docker
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
```

**Windows (using PowerShell as Administrator)**:

```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install required dependencies
choco install nodejs-lts postgresql redis git docker-desktop -y

# Start PostgreSQL service
Start-Service postgresql

# Start Redis service
Start-Service redis
```

#### 2. Clone Repository

```bash
# Clone the main repository
git clone https://github.com/tunemantra/platform.git tunemantra
cd tunemantra

# Initialize submodules if any
git submodule update --init --recursive
```

#### 3. Install Application Dependencies

```bash
# Install Node.js dependencies
npm install

# Install development tools
npm install -g typescript ts-node nodemon
```

### Database Setup

#### 1. Configure PostgreSQL

```bash
# Create database and user
psql -U postgres -c "CREATE USER tunemantra WITH PASSWORD 'development_password';"
psql -U postgres -c "CREATE DATABASE tunemantra_dev OWNER tunemantra;"
psql -U postgres -c "CREATE DATABASE tunemantra_test OWNER tunemantra;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE tunemantra_dev TO tunemantra;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE tunemantra_test TO tunemantra;"
```

#### 2. Initialize Database Schema

```bash
# Run database migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed
```

### Configuration Setup

#### 1. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env.development

# Edit the environment file with your local settings
# Update database connection string and other necessary values
```

Key environment variables to configure:

- `NODE_ENV=development`
- `PORT=3000`
- `DATABASE_URL=postgresql://tunemantra:development_password@localhost:5432/tunemantra_dev`
- `REDIS_URL=redis://localhost:6379`
- `SESSION_SECRET=your_local_session_secret`
- `API_BASE_URL=http://localhost:3000/api`

#### 2. External Service Mocks

For development without external API dependencies:

```bash
# Start mock services
npm run mocks:start
```

### Starting the Development Server

```bash
# Start the development server
npm run dev

# Or start with specific options
npm run dev:watch  # With file watching
```

The development server will be available at `http://localhost:3000`.

## Production Environment Setup

### Infrastructure Provisioning

#### Cloud Environment (AWS Example)

1. **Network Setup**:
   - VPC with public and private subnets across multiple availability zones
   - NAT Gateways for outbound connectivity from private subnets
   - Security groups for application, database, and cache tiers

2. **Compute Resources**:
   - EC2 Auto Scaling Group or ECS/EKS cluster for application servers
   - Application Load Balancer with HTTPS listener
   - Elastic IP addresses for stable entry points

3. **Database Setup**:
   - RDS PostgreSQL with Multi-AZ deployment
   - Parameter group configured for application requirements
   - Subnet group spanning multiple availability zones

4. **Caching and Messaging**:
   - ElastiCache Redis cluster for caching
   - Amazon MSK (Managed Streaming for Kafka) for event streaming

5. **Storage Resources**:
   - S3 buckets for media and file storage
   - CloudFront distribution for content delivery

#### On-Premises Deployment

1. **Server Preparation**:
   - Physical or virtual servers with required specifications
   - Network configuration with appropriate VLANs and firewall rules
   - Load balancer configuration with SSL termination

2. **High Availability Setup**:
   - Server clustering for application tier
   - Database replication and failover configuration
   - Redundant network paths and equipment

### Application Deployment

#### Container-based Deployment

1. **Build Application Images**:

```bash
# Build Docker images
docker build -t tunemantra/api:latest -f docker/api/Dockerfile .
docker build -t tunemantra/web:latest -f docker/web/Dockerfile .
docker build -t tunemantra/worker:latest -f docker/worker/Dockerfile .
```

2. **Deploy with Docker Compose** (for simpler deployments):

```bash
# Start the application stack
docker-compose -f docker-compose.production.yml up -d
```

3. **Deploy with Kubernetes** (for complex deployments):

```bash
# Apply Kubernetes configurations
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secrets.yaml
kubectl apply -f kubernetes/database.yaml
kubectl apply -f kubernetes/redis.yaml
kubectl apply -f kubernetes/api.yaml
kubectl apply -f kubernetes/web.yaml
kubectl apply -f kubernetes/worker.yaml
kubectl apply -f kubernetes/ingress.yaml
```

#### Traditional Deployment

1. **Prepare Application**:

```bash
# Install production dependencies only
npm ci --only=production

# Build application
npm run build
```

2. **Configure Process Manager**:

```bash
# Install PM2
npm install -g pm2

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration for startup
pm2 save
pm2 startup
```

### Database Migration

```bash
# Run production database migrations
NODE_ENV=production npm run db:migrate

# Seed initial data if needed
NODE_ENV=production npm run db:seed:production
```

### SSL Certificate Setup

```bash
# Install Certbot for Let's Encrypt certificates
sudo apt install -y certbot

# Obtain certificates
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com -d www.yourdomain.com

# Configure web server with certificates
# For Nginx:
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /etc/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /etc/nginx/ssl/
```

## Configuration

### Core Configuration

Key configuration files:

- `.env.production`: Environment variables for production
- `config/default.js`: Default configuration values
- `config/production.js`: Production-specific overrides
- `nginx/tunemantra.conf`: Web server configuration

Essential production environment variables:

```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgresql://username:password@database-host:5432/tunemantra
REDIS_URL=redis://redis-host:6379
SESSION_SECRET=strong_random_secret
API_BASE_URL=https://api.yourdomain.com
STORAGE_BUCKET=your-media-bucket
```

### Security Configuration

Security-related settings:

1. **API Rate Limiting**:
   - Edit `config/security.js` to set rate limits
   - Default: 60 requests per minute per IP

2. **CORS Settings**:
   - Configure allowed origins in `config/cors.js`
   - Production should use explicit domain lists

3. **Content Security Policy**:
   - Edit headers in `config/security.js`
   - Restrict resource loading to trusted domains

### Scaling Configuration

Settings for high-load environments:

1. **Connection Pooling**:
   - Database: `config/database.js`
   - Default: min=5, max=20 connections

2. **Worker Processes**:
   - Node.js: Set in process manager configuration
   - Recommended: 1 worker per CPU core

3. **Caching Configuration**:
   - Control TTL values in `config/cache.js`
   - Adjust memory allocation based on usage patterns

## Database Setup

### Schema Management

TuneMantra uses Drizzle ORM for database schema management.

```bash
# Run database migrations
NODE_ENV=production npm run db:migrate

# Generate a new migration
npm run db:generate:migration -- --name add_new_feature
```

### Backup and Restore

Regular backup procedures:

```bash
# Backup database to file
pg_dump -U username -h hostname -d tunemantra > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U username -h hostname -d tunemantra < backup_file.sql
```

Automated backup with cron:

```
# Add to crontab
0 2 * * * /usr/bin/pg_dump -U username -h hostname -d tunemantra | gzip > /backup/tunemantra_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

### Replication Setup

For high-availability database:

1. Configure primary server in `postgresql.conf`:
   ```
   wal_level = replica
   max_wal_senders = 10
   wal_keep_segments = 64
   ```

2. Configure replication permissions in `pg_hba.conf`:
   ```
   host replication replicator 192.168.1.0/24 md5
   ```

3. Set up replica server to connect to primary.

## External Service Integration

### Streaming Platform Connections

Configure API credentials for music platforms:

1. **Spotify**:
   - Register application in Spotify Developer Dashboard
   - Add credentials to environment variables:
     ```
     SPOTIFY_CLIENT_ID=your_client_id
     SPOTIFY_CLIENT_SECRET=your_client_secret
     ```

2. **Apple Music**:
   - Generate private key in Apple Developer portal
   - Configure in environment variables:
     ```
     APPLE_MUSIC_KEY_ID=your_key_id
     APPLE_MUSIC_TEAM_ID=your_team_id
     APPLE_MUSIC_PRIVATE_KEY=path_to_private_key_file
     ```

3. **Amazon Music**:
   - Register application in Amazon Developer Console
   - Add credentials to environment:
     ```
     AMAZON_MUSIC_CLIENT_ID=your_client_id
     AMAZON_MUSIC_CLIENT_SECRET=your_client_secret
     ```

### Payment Processing

Set up payment provider integration:

1. **Stripe**:
   - Create Stripe account and obtain API keys
   - Configure in environment:
     ```
     STRIPE_PUBLIC_KEY=your_public_key
     STRIPE_SECRET_KEY=your_secret_key
     STRIPE_WEBHOOK_SECRET=your_webhook_secret
     ```

2. **PayPal**:
   - Register application in PayPal Developer Dashboard
   - Configure in environment:
     ```
     PAYPAL_CLIENT_ID=your_client_id
     PAYPAL_CLIENT_SECRET=your_client_secret
     PAYPAL_ENVIRONMENT=production
     ```

### Email Service

Configure email delivery service:

1. **SendGrid**:
   - Create SendGrid account and generate API key
   - Configure in environment:
     ```
     EMAIL_PROVIDER=sendgrid
     SENDGRID_API_KEY=your_api_key
     EMAIL_FROM=noreply@yourdomain.com
     ```

2. **Amazon SES**:
   - Configure AWS credentials and SES access
   - Set environment variables:
     ```
     EMAIL_PROVIDER=ses
     AWS_ACCESS_KEY_ID=your_access_key
     AWS_SECRET_ACCESS_KEY=your_secret_key
     AWS_REGION=us-east-1
     EMAIL_FROM=noreply@yourdomain.com
     ```

## Verification

### System Verification

Steps to verify successful installation:

1. **Service Status Check**:
   ```bash
   # Check running services
   pm2 status  # For traditional deployment
   docker ps   # For container deployment
   kubectl get pods  # For Kubernetes deployment
   ```

2. **Application Health Check**:
   - Access `https://yourdomain.com/health`
   - Verify response: `{"status":"ok","version":"x.y.z"}`

3. **Database Connectivity**:
   - Access `https://yourdomain.com/health/database`
   - Verify response: `{"status":"connected"}`

4. **External Service Check**:
   - Access `https://yourdomain.com/health/integrations`
   - Verify all integrations show `"status":"connected"`

### Security Verification

Security checks to perform:

1. **SSL Configuration**:
   ```bash
   # Check SSL configuration
   nmap --script ssl-enum-ciphers -p 443 yourdomain.com
   
   # Alternative using SSL Labs
   # Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
   ```

2. **Headers Security**:
   ```bash
   # Check security headers
   curl -I https://yourdomain.com
   
   # Verify presence of:
   # - Strict-Transport-Security
   # - Content-Security-Policy
   # - X-Content-Type-Options
   # - X-Frame-Options
   ```

3. **Permission Verification**:
   - Ensure file permissions are correct
   - Check database user has minimal required privileges

### Performance Verification

Basic performance checks:

1. **Load Testing**:
   ```bash
   # Install k6 load testing tool
   # Run basic load test
   k6 run load-tests/basic-performance.js
   ```

2. **Response Time Check**:
   ```bash
   # Check API response time
   curl -w "Connect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null -s https://yourdomain.com/api/health
   ```

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Symptom**: Application fails to start with database connection errors.

**Solutions**:
1. Verify database server is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check connection parameters:
   ```bash
   psql -U username -h hostname -p port -d database
   ```

3. Verify firewall allows connections:
   ```bash
   sudo iptables -L | grep 5432
   ```

#### Permission Issues

**Symptom**: Application cannot write to files or directories.

**Solutions**:
1. Check ownership of application directories:
   ```bash
   ls -la /path/to/application
   ```

2. Set correct permissions:
   ```bash
   sudo chown -R appuser:appgroup /path/to/application
   sudo chmod -R 755 /path/to/application
   ```

#### Memory Limitations

**Symptom**: Application crashes with "out of memory" errors.

**Solutions**:
1. Increase Node.js memory limit:
   ```bash
   # In PM2 ecosystem.config.js
   "node_args": "--max-old-space-size=4096"
   ```

2. Check system memory usage:
   ```bash
   free -m
   ```

3. Add swap space if needed:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### Logging and Monitoring

#### Accessing Logs

```bash
# Application logs (PM2)
pm2 logs

# Application logs (Docker)
docker logs container_name

# Application logs (Kubernetes)
kubectl logs pod_name

# System logs
sudo journalctl -u tunemantra

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Monitoring Tools

1. **System Monitoring**:
   ```bash
   # Install Netdata for real-time monitoring
   bash <(curl -Ss https://my-netdata.io/kickstart.sh)
   
   # Access dashboard at http://localhost:19999
   ```

2. **Application Performance Monitoring**:
   - Configure New Relic or DataDog APM
   - See `config/monitoring.js` for integration points

## Appendix

### Environment Variables Reference

Complete list of supported environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | HTTP server port | `3000` | Yes |
| `LOG_LEVEL` | Logging verbosity | `info` | No |
| `DATABASE_URL` | PostgreSQL connection URL | - | Yes |
| `REDIS_URL` | Redis connection URL | - | Yes |
| `SESSION_SECRET` | Secret for session cookies | - | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | No |
| `API_RATE_LIMIT` | Requests per minute | `60` | No |
| `STORAGE_BUCKET` | Media storage bucket | - | Yes |
| `STORAGE_REGION` | Storage service region | `us-east-1` | No |
| `KAFKA_BROKERS` | Comma-separated Kafka brokers | - | No |
| `EMAIL_PROVIDER` | Email service provider | `sendgrid` | No |
| `EMAIL_FROM` | Default sender address | - | Yes |
| `SENTRY_DSN` | Error tracking endpoint | - | No |
| `API_BASE_URL` | Base URL for API requests | - | Yes |

### Deployment Checklist

Pre-deployment verification checklist:

- [ ] Environment variables configured for production
- [ ] Database migrations applied and verified
- [ ] External service credentials validated
- [ ] SSL certificates installed and configured
- [ ] Firewall rules and network security verified
- [ ] Backup procedures established
- [ ] Monitoring systems configured
- [ ] Load testing completed
- [ ] Security scanning performed
- [ ] Documentation updated

### Reference Commands

Useful commands for administration:

```bash
# Start application
npm run start

# Run database migrations
npm run db:migrate

# Generate new migration
npm run db:generate:migration -- --name migration_name

# Seed database
npm run db:seed

# Run tests
npm test

# Check for lint errors
npm run lint

# Fix lint errors
npm run lint:fix

# Build for production
npm run build
```

---

© 2023-2025 TuneMantra. All rights reserved.