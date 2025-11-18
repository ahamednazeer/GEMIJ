# Deployment Guide

This guide covers different deployment options for the Academic Journal Platform.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL database
- SMTP server for email notifications
- Stripe account for payments (optional)
- AWS S3 bucket for file storage (optional)

## Environment Variables

Copy the `.env.example` file to `.env` and configure the following variables:

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@yourjournal.com"
FROM_NAME="Your Journal Name"

# Journal Settings
JOURNAL_NAME="Your Journal Name"
JOURNAL_ABBREVIATION="YJN"
JOURNAL_ISSN="1234-5678"
JOURNAL_URL="https://yourjournal.com"
```

### Optional Variables

```bash
# Stripe Payment Processing
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
APC_AMOUNT="299.00"
APC_CURRENCY="USD"

# AWS S3 File Storage
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# DOI Configuration
DOI_PREFIX="10.12345"
CROSSREF_USERNAME="your-username"
CROSSREF_PASSWORD="your-password"
```

## Docker Deployment (Recommended)

### 1. Quick Start with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd academic-journal-platform

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec api npm run db:migrate

# Seed the database with initial data
docker-compose exec api npm run db:seed
```

### 2. Production Docker Deployment

For production, create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      # Add other environment variables
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    restart: unless-stopped

volumes:
  postgres_data:
```

## Manual Deployment

### 1. Server Setup

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2
```

### 2. Database Setup

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE journal_db;
CREATE USER journal_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE journal_db TO journal_user;
\q
```

### 3. Backend Deployment

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build the application
npm run build

# Start with PM2
pm2 start dist/index.js --name "journal-api"
pm2 save
pm2 startup
```

### 4. Frontend Deployment

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Build for production
npm run build

# Serve with nginx or any static file server
sudo cp -r dist/* /var/www/html/
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/journal`:

```nginx
server {
    listen 80;
    server_name yourjournal.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourjournal.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads/ {
        alias /path/to/uploads/;
        expires 1y;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/journal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Cloud Deployment Options

### 1. AWS Deployment

#### Using AWS ECS with Fargate

1. **Build and push Docker images to ECR**
2. **Create ECS cluster and task definitions**
3. **Set up Application Load Balancer**
4. **Configure RDS for PostgreSQL**
5. **Use S3 for file storage**

#### Using AWS Elastic Beanstalk

1. **Create application and environment**
2. **Upload Docker Compose file**
3. **Configure environment variables**
4. **Set up RDS database**

### 2. Google Cloud Platform

#### Using Google Cloud Run

1. **Build and push to Container Registry**
2. **Deploy services to Cloud Run**
3. **Set up Cloud SQL for PostgreSQL**
4. **Use Cloud Storage for files**

### 3. DigitalOcean

#### Using App Platform

1. **Connect GitHub repository**
2. **Configure build and run commands**
3. **Set up managed database**
4. **Configure environment variables**

## SSL/TLS Configuration

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourjournal.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs journal-api
```

### 2. Database Monitoring

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### 3. Nginx Monitoring

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U journal_user journal_db > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
rm backup_$DATE.sql
```

### 2. File Backup

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
aws s3 cp uploads_backup_*.tar.gz s3://your-backup-bucket/
```

## Security Considerations

1. **Use HTTPS in production**
2. **Keep dependencies updated**
3. **Use strong JWT secrets**
4. **Implement rate limiting**
5. **Regular security audits**
6. **Database connection encryption**
7. **File upload restrictions**
8. **CORS configuration**

## Performance Optimization

1. **Enable gzip compression**
2. **Use CDN for static assets**
3. **Database indexing**
4. **Caching strategies**
5. **Image optimization**
6. **Bundle size optimization**

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL format
   - Verify database credentials
   - Ensure database is running

2. **Email sending failures**
   - Verify SMTP credentials
   - Check firewall settings
   - Test SMTP connection

3. **File upload issues**
   - Check upload directory permissions
   - Verify file size limits
   - Check available disk space

4. **Payment processing errors**
   - Verify Stripe keys
   - Check webhook endpoints
   - Review Stripe dashboard

### Logs and Debugging

```bash
# Application logs
docker-compose logs api

# Database logs
docker-compose logs postgres

# Nginx logs
docker-compose logs nginx
```

## Maintenance

### Regular Tasks

1. **Update dependencies**
2. **Database maintenance**
3. **Log rotation**
4. **Security updates**
5. **Backup verification**
6. **Performance monitoring**

### Database Maintenance

```bash
# Analyze and vacuum
psql -d journal_db -c "ANALYZE; VACUUM;"

# Update statistics
psql -d journal_db -c "ANALYZE;"
```