# Deployment Guide - The Passover System

This guide covers deploying The Passover System to an on-premise server.

## Prerequisites

- Node.js 18+ and npm installed
- PostgreSQL 15+ database server
- PM2 or similar process manager (recommended)
- Nginx or similar reverse proxy (optional but recommended)
- SSL certificate (for HTTPS)

## Server Setup

### 1. Install Dependencies

```bash
# Install Node.js dependencies
cd backend
npm install --production

cd ../frontend
npm install --production
```

### 2. Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE passover;
CREATE USER passover_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE passover TO passover_user;
```

2. Update `backend/.env`:
```env
DATABASE_URL="postgresql://passover_user:your_secure_password@localhost:5432/passover?schema=public"
JWT_SECRET="generate-a-strong-random-secret-here"
JWT_REFRESH_SECRET="generate-another-strong-random-secret-here"
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://your-domain.com"
```

3. Run migrations:
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate deploy
```

### 3. Build Frontend

```bash
cd frontend
npm run build
```

### 4. Build Backend

```bash
cd backend
npm run build
```

## Process Management with PM2

1. Install PM2:
```bash
npm install -g pm2
```

2. Create `ecosystem.config.js` in project root:
```javascript
module.exports = {
  apps: [
    {
      name: 'passover-backend',
      script: './backend/dist/index.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      instances: 1,
      exec_mode: 'fork',
    },
    {
      name: 'passover-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
```

3. Start applications:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Nginx Configuration

Create `/etc/nginx/sites-available/passover`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/passover /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong random secret for JWT tokens
- `JWT_REFRESH_SECRET`: Strong random secret for refresh tokens
- `PORT`: Backend port (default: 3001)
- `NODE_ENV`: Set to `production`
- `FRONTEND_URL`: Full URL of frontend application

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Full URL of backend API (e.g., `https://your-domain.com/api`)

## Security Considerations

1. **Firewall**: Only allow necessary ports (80, 443, 22)
2. **Database**: Use strong passwords and limit network access
3. **JWT Secrets**: Generate strong, random secrets (use `openssl rand -base64 32`)
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure CORS to only allow your domain
6. **Rate Limiting**: Consider adding rate limiting to API endpoints
7. **Backups**: Set up regular database backups

## Monitoring

1. **PM2 Monitoring**:
```bash
pm2 monit
pm2 logs
```

2. **Database Monitoring**: Use PostgreSQL's built-in monitoring tools

3. **Application Logs**: Check logs in `./logs/` directory

## Backup Strategy

1. **Database Backup**:
```bash
pg_dump -U passover_user passover > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Automated Backups**: Set up cron job for daily backups

3. **File Backups**: Backup environment files and configuration

## Updates and Maintenance

1. **Update Code**:
```bash
git pull
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart all
```

2. **Database Migrations**:
```bash
cd backend
npm run prisma:migrate deploy
```

3. **Rollback**: Keep previous versions and database backups

## Troubleshooting

1. **Check PM2 Status**: `pm2 status`
2. **View Logs**: `pm2 logs`
3. **Check Database Connection**: Verify DATABASE_URL in .env
4. **Check Ports**: Ensure ports 3000 and 3001 are not blocked
5. **Check Nginx**: `sudo nginx -t` and check error logs

## Initial Admin User

After deployment, create the first admin user:

1. Connect to PostgreSQL
2. Manually insert admin user or use a setup script
3. Or use the admin registration endpoint (ensure it's properly secured)

## Support

For issues or questions, refer to the main README.md or contact the development team.

