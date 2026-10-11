# Deployment Guide

This guide covers deploying Lintas to production using Vercel (recommended) or self-hosting with Docker.

## Prerequisites

- Node.js 18+
- PostgreSQL database (hosted or self-hosted)
- (Optional) S3-compatible storage for file uploads

## Option 1: Vercel + Hosted Database (Recommended)

### 1. Prepare Database

Choose a PostgreSQL provider:
- **Neon** (recommended): https://neon.tech (Free tier available)
- **Supabase**: https://supabase.com (Free tier available)
- **Railway**: https://railway.app
- **DigitalOcean**: Managed PostgreSQL

Create a database and copy the connection string.

### 2. Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Add environment variables:
   ```
   DATABASE_URL=<your-postgres-connection-string>
   AUTH_SECRET=<generate-32-char-random-string>
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_APP_NAME=Lintas
   ```

4. Deploy

### 3. Run Database Migrations

After first deploy:

```bash
# Install Vercel CLI
npm i -g vercel

# Run migrations
vercel env pull .env.production
npm run db:migrate:deploy
```

Or use Vercel's Terminal in the dashboard.

### 4. Verify Deployment

1. Visit your deployed URL
2. Check `/api/health` endpoint
3. Test user registration and login
4. Create a workspace and project
5. Verify board functionality

### 5. Custom Domain (Optional)

1. Go to Vercel Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your custom domain

## Option 2: Docker Self-Host

### 1. Prepare Server

Requirements:
- Ubuntu 20.04+ or similar
- Docker & Docker Compose installed
- Domain name pointed to server IP

### 2. Clone Repository

```bash
git clone <your-repo-url> /var/www/lintas
cd /var/www/lintas
```

### 3. Configure Environment

```bash
cp .env.example .env.production
nano .env.production
```

Set production values:
```
DATABASE_URL=postgresql://lintas:secure_password@postgres:5432/lintas
AUTH_SECRET=<generate-32-char-random-string>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Lintas
```

### 4. Build and Deploy

```bash
# Build production image
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose -f docker-compose.prod.yml exec app npm run db:migrate:deploy

# Seed database (optional)
docker compose -f docker-compose.prod.yml exec app npm run db:seed
```

### 5. Configure Caddy (Reverse Proxy)

Caddy is included in `docker-compose.prod.yml` and auto-configures HTTPS.

Edit `Caddyfile`:
```
your-domain.com {
    reverse_proxy app:3000
}
```

### 6. Verify

```bash
# Check services
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Check health
curl https://your-domain.com/api/health
```

## Post-Deployment

### Monitoring

- Set up Vercel Analytics or self-host with Plausible
- Configure error tracking (Sentry)
- Set up uptime monitoring (UptimeRobot, Pingdom)

### Backups

**Vercel + Hosted DB:**
- Most providers (Neon, Supabase) auto-backup
- Verify backup schedule in provider dashboard

**Self-Hosted:**
```bash
# Daily backup script
0 2 * * * docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U lintas lintas > /backups/lintas_$(date +\%Y\%m\%d).sql
```

### Security

1. **Set strong AUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

2. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```

3. **Enable rate limiting** (already configured in production)

4. **Use HTTPS only** (Vercel auto, Caddy auto for self-host)

5. **Restrict database access** to application only

### Performance

1. **Enable caching** (Vercel auto-configures)
2. **Optimize images** (Next.js Image component used throughout)
3. **Monitor metrics** via Vercel Analytics or self-hosted solution
4. **Scale database** if needed (increase connection pool, read replicas)

## Troubleshooting

### Build Fails

```bash
# Check logs
vercel logs <deployment-url>

# Or for self-host
docker compose -f docker-compose.prod.yml logs app
```

### Database Connection Issues

```bash
# Test connection
npm run db:studio

# Check migrations
npm run db:migrate:status
```

### "Invalid credentials" errors

- Verify `AUTH_SECRET` is set and consistent
- Check `NEXTAUTH_URL` matches your actual domain
- Clear browser cookies and try again

### Performance Issues

- Check database query performance with Prisma Studio
- Enable query logging: `DATABASE_URL="...?connection_limit=10&pool_timeout=10"`
- Scale Vercel plan or increase server resources

## Updating Production

### Vercel
Push to `main` branch — auto-deploys.

### Self-Host
```bash
cd /var/www/lintas
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec app npm run db:migrate:deploy
```

## Support

For deployment issues:
1. Check [CHANGELOG.md](../CHANGELOG.md) for breaking changes
2. Review [GitHub Issues](../../issues)
3. Join our Discord community
4. Contact support@lintas.app

---

Last Updated: 2026-10-10