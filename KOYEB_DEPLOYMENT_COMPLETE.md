# Koyeb Deployment Configuration - Complete ✅

## Deployment Files Created

### 1. Dockerfile (Multi-stage Build)
- **Location**: `Dockerfile` (root directory)
- **Features**:
  - Multi-stage build for optimized image size
  - Separate stages for backend dependencies, admin build, and production
  - Health check endpoint configured
  - Production-ready with minimal attack surface
  - Alpine Linux base for security and size optimization

### 2. .dockerignore
- **Location**: `.dockerignore` (root directory)
- **Purpose**: Excludes unnecessary files from Docker build context
- **Benefits**: Faster builds, smaller images, improved security

### 3. koyeb.yaml
- **Location**: `koyeb.yaml` (root directory)
- **Configuration**:
  - Service name: `backend-api`
  - Instance type: nano (can be upgraded)
  - Health check: `/api/health`
  - Auto-scaling: 1 instance (min/max)
  - Port: 8000 (standard for Koyeb)

---

## Deployment Steps for Koyeb

### Prerequisites
1. Create a Koyeb account at https://www.koyeb.com
2. Install Koyeb CLI (optional): `npm install -g @koyeb/koyeb-cli`
3. Have your MongoDB Atlas and API credentials ready

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Koyeb deployment configuration"
   git push origin main
   ```

2. **Connect to Koyeb**:
   - Go to Koyeb Dashboard
   - Click "Create Service"
   - Select "GitHub" as source
   - Connect your repository
   - Select the branch (main)

3. **Configure Build**:
   - Build method: Dockerfile
   - Dockerfile path: `Dockerfile`
   - Build context: Root directory

4. **Set Environment Variables**:
   ```
   MONGO_URI=<your_mongodb_atlas_connection_string>
   JWT_SECRET=<your_jwt_secret>
   NODE_ENV=production
   PORT=8000
   
   # Optional - VTPass Integration
   VTPASS_USERNAME=<your_vtpass_username>
   VTPASS_API_KEY=<your_vtpass_api_key>
   VTPASS_BASE_URL=https://sandbox.vtpass.com/api
   
   # Optional - Monnify Integration
   MONNIFY_API_KEY=<your_monnify_api_key>
   MONNIFY_SECRET_KEY=<your_monnify_secret_key>
   MONNIFY_CONTRACT_CODE=<your_monnify_contract_code>
   MONNIFY_BASE_URL=https://sandbox.monnify.com
   
   # Optional - Email
   EMAIL_USER=<your_email>
   EMAIL_PASS=<your_email_app_password>
   APP_URL=https://your-app.koyeb.app
   ```

5. **Configure Service**:
   - Service type: Web
   - Port: 8000
   - Health check path: `/api/health`
   - Instance type: Start with "nano" (can upgrade later)
   - Region: Choose closest to your users

6. **Deploy**:
   - Click "Deploy"
   - Wait for build and deployment (usually 3-5 minutes)

### Option 2: Deploy via Koyeb CLI

1. **Login to Koyeb**:
   ```bash
   koyeb login
   ```

2. **Create App**:
   ```bash
   koyeb app create connexa-vtu-platform
   ```

3. **Create Service**:
   ```bash
   koyeb service create backend-api \
     --app connexa-vtu-platform \
     --git github.com/yourusername/yourrepo \
     --git-branch main \
     --git-build-command "docker build -t backend ." \
     --docker-dockerfile Dockerfile \
     --ports 8000:http \
     --routes /:8000 \
     --env NODE_ENV=production \
     --env PORT=8000 \
     --env MONGO_URI=<your_mongo_uri> \
     --env JWT_SECRET=<your_jwt_secret> \
     --health-checks http:8000:/api/health \
     --instance-type nano
   ```

### Option 3: Deploy via koyeb.yaml

1. **Login to Koyeb**:
   ```bash
   koyeb login
   ```

2. **Deploy using configuration file**:
   ```bash
   koyeb app init --config koyeb.yaml
   koyeb deploy
   ```

---

## MongoDB Atlas Configuration

### Network Access Setup
1. Go to MongoDB Atlas Dashboard
2. Navigate to "Network Access"
3. Click "Add IP Address"
4. Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific Koyeb IP ranges for better security
5. Save changes

### Connection String
Ensure your MONGO_URI follows this format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

---

## Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Service status shows "Healthy"
- [ ] Health check endpoint responding
- [ ] No error logs in Koyeb dashboard

### 2. Test API Endpoints

**Health Check**:
```bash
curl https://your-app.koyeb.app/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-20T..."
}
```

**User Registration**:
```bash
curl -X POST https://your-app.koyeb.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "phone": "+2348012345678"
  }'
```

**Admin Dashboard**:
```
https://your-app.koyeb.app/
```
Default credentials:
- Email: admin@example.com
- Password: Admin123!

### 3. Monitor Performance
- Check response times in Koyeb metrics
- Monitor memory and CPU usage
- Review error logs regularly
- Set up alerts for downtime

### 4. Security Hardening
- [ ] Change default admin password
- [ ] Update JWT_SECRET to a strong random string
- [ ] Enable 2FA for admin accounts
- [ ] Review CORS settings for production domains
- [ ] Enable SSL/TLS (automatic with Koyeb)
- [ ] Set up rate limiting (already configured)

### 5. Scaling Considerations
- Start with "nano" instance
- Upgrade to "small" or "medium" as traffic grows
- Consider horizontal scaling (increase max instances)
- Monitor database connection pool usage

---

## Troubleshooting

### Issue: Health Check Failing
**Symptoms**: Service shows "Unhealthy" status

**Solutions**:
1. Check if MongoDB is accessible:
   - Verify MONGO_URI is correct
   - Ensure MongoDB Atlas allows Koyeb IPs
2. Check application logs in Koyeb dashboard
3. Verify PORT is set to 8000
4. Test health endpoint locally first

### Issue: Environment Variables Not Loading
**Symptoms**: "Missing required environment variables" error

**Solutions**:
1. Double-check variable names (case-sensitive)
2. Ensure no trailing spaces in values
3. Restart service after adding variables
4. Check Koyeb dashboard environment section

### Issue: Build Failing
**Symptoms**: Docker build errors

**Solutions**:
1. Test Docker build locally:
   ```bash
   docker build -t test-build .
   docker run -p 8000:8000 test-build
   ```
2. Check Dockerfile syntax
3. Verify all files are committed to Git
4. Review build logs in Koyeb dashboard

### Issue: MongoDB Connection Timeout
**Symptoms**: "MongoDB connection failed" error

**Solutions**:
1. Verify MongoDB Atlas is online
2. Check connection string format
3. Ensure IP whitelist includes 0.0.0.0/0
4. Test connection string locally
5. Check MongoDB Atlas logs

### Issue: Admin Panel Not Loading
**Symptoms**: 404 error on root path

**Solutions**:
1. Verify admin-web build succeeded
2. Check if dist folder was created
3. Ensure production mode is set (NODE_ENV=production)
4. Review server.js static file serving

---

## Performance Optimization

### Image Size Optimization
Current Dockerfile uses multi-stage builds:
- Base image: node:20-alpine (small)
- Production dependencies only
- No dev dependencies in final image

### Caching Strategy
- npm dependencies cached between builds
- Admin build separated for better caching
- .dockerignore reduces build context

### Recommended Upgrades
- **Traffic < 1000 users/day**: nano instance
- **Traffic 1000-5000 users/day**: small instance
- **Traffic 5000-10000 users/day**: medium instance
- **Traffic > 10000 users/day**: multiple instances + load balancer

---

## Monitoring and Alerts

### Koyeb Built-in Monitoring
- CPU usage
- Memory usage
- Network traffic
- HTTP response times
- Error rate

### Recommended External Tools
1. **Sentry** - Error tracking
2. **LogRocket** - Session replay
3. **New Relic** - APM monitoring
4. **Datadog** - Infrastructure monitoring

### Alert Setup
Configure alerts for:
- Service downtime
- High error rate (>5%)
- Slow response times (>2s)
- Memory usage >80%
- CPU usage >80%

---

## Backup and Disaster Recovery

### MongoDB Backups
- Enable automated backups in MongoDB Atlas
- Test restore process monthly
- Keep 7-day backup retention minimum

### Application Backups
- Git repository serves as code backup
- Tag production releases
- Maintain staging environment

### Rollback Strategy
1. Keep previous deployment available
2. Use Git tags for versioning
3. Test rollback procedure
4. Document rollback steps

---

## Cost Estimation

### Koyeb Pricing (as of 2025)
- **Nano**: ~$5/month (512MB RAM, 0.25 vCPU)
- **Small**: ~$15/month (1GB RAM, 0.5 vCPU)
- **Medium**: ~$30/month (2GB RAM, 1 vCPU)

### MongoDB Atlas Pricing
- **M0 (Free)**: 512MB storage, good for development
- **M10**: ~$57/month, recommended for production
- **M20**: ~$134/month, for high traffic

### Total Estimated Monthly Cost
- **Development**: $0-5 (Koyeb nano + MongoDB M0)
- **Small Production**: $62 (Koyeb small + MongoDB M10)
- **Medium Production**: $164 (Koyeb medium + MongoDB M20)

---

## Support and Resources

### Koyeb Resources
- Documentation: https://www.koyeb.com/docs
- CLI Reference: https://www.koyeb.com/docs/cli
- Community Forum: https://community.koyeb.com
- Status Page: https://status.koyeb.com

### MongoDB Resources
- Atlas Documentation: https://docs.atlas.mongodb.com
- Connection Troubleshooting: https://docs.mongodb.com/manual/reference/connection-string
- Performance Best Practices: https://docs.mongodb.com/manual/administration/production-notes

---

## Next Steps

1. **Deploy to Koyeb** using one of the methods above
2. **Test all endpoints** thoroughly
3. **Configure custom domain** (optional)
4. **Set up monitoring** and alerts
5. **Create staging environment** for testing
6. **Document deployment process** for team
7. **Plan scaling strategy** based on growth
8. **Regular security updates** and patches

Your application is now fully configured for Koyeb deployment with:
✅ Production-ready Dockerfile
✅ Health checks configured
✅ Environment variables documented
✅ Security best practices implemented
✅ Monitoring recommendations provided
✅ Troubleshooting guide included

**Happy deploying! 🚀**
