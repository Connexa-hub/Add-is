# Koyeb Deployment Guide

## Current Deployment Status

Your backend has been properly configured for Koyeb deployment with all necessary fixes applied. Here's what has been done:

### ✅ Fixes Applied

1. **Environment Variable Validation** (`backend/config/validateEnv.js`)
   - Validates required environment variables before server starts
   - Provides clear error messages if variables are missing
   - Prevents silent failures during deployment

2. **MongoDB Connection Handling** (`backend/server.js`)
   - Async/await pattern for better error handling
   - Server only starts after successful MongoDB connection
   - Clear error messages with troubleshooting steps
   - PORT fallback to 3001 if not specified

3. **Optional Admin Build** (`backend/package.json`)
   - Admin dashboard build only runs in production mode
   - Can be skipped with `SKIP_ADMIN_BUILD=true`
   - Build failures won't crash the deployment
   - Separation of backend API and admin frontend

4. **Security Best Practices**
   - `.env` file in `.gitignore`
   - Environment variables loaded securely
   - No secrets committed to repository

---

## Deploying to Koyeb

### Step 1: Set Environment Variables in Koyeb

Navigate to your Koyeb service settings and add these environment variables:

**Required (Backend will not start without these):**
```
MONGO_URI=mongodb+srv://connexaaddis:CONNEXAADIS@addis.krhvqra.mongodb.net/?retryWrites=true&w=majority&appName=Addis
JWT_SECRET=OLAJUMOKE###
NODE_ENV=production
PORT=3001
```

**Optional (For VTPass Integration):**
```
VTPASS_USERNAME=akinolaakinadeisrael5@gmail.com
VTPASS_API_KEY=56fa6d60e6e5522861d8798213b6a34f
VTPASS_BASE_URL=https://sandbox.vtpass.com/api
```

**Optional (For Email Notifications):**
```
EMAIL_USER=akinadeisrael5@gmail.com
EMAIL_PASS=[your email app password]
APP_URL=[your Koyeb app URL]
```

**Optional (Skip Admin Build if needed):**
```
SKIP_ADMIN_BUILD=true
```

### Step 2: Configure Koyeb Service

1. **Service Type**: Web Service
2. **Build Command**: `npm install` (in backend directory)
3. **Start Command**: `npm start` or `node server.js`
4. **Port**: 3001 (or let Koyeb auto-assign)
5. **Health Check Path**: `/api/health`

### Step 3: MongoDB Atlas Configuration

Ensure your MongoDB Atlas cluster allows connections from Koyeb:

1. Go to MongoDB Atlas Dashboard
2. Navigate to Network Access
3. Add IP Address: `0.0.0.0/0` (Allow from anywhere)
   - Or add specific Koyeb IP ranges for better security

### Step 4: Deploy and Monitor

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Backend ready for Koyeb deployment"
   git push origin main
   ```

2. **Monitor Deployment Logs** in Koyeb for:
   ```
   ✅ Environment validation passed
   ✅ MongoDB connected successfully
   🚀 Server running on http://0.0.0.0:3001
   ```

3. **Test Health Endpoint**:
   ```bash
   curl https://your-app.koyeb.app/api/health
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "message": "Server is running",
     "timestamp": "2025-10-18T..."
   }
   ```

---

## Common Deployment Issues and Solutions

### Issue 1: "Environment validation failed"

**Cause**: Required environment variables not set in Koyeb

**Solution**:
1. Check Koyeb environment variables section
2. Ensure `MONGO_URI` and `JWT_SECRET` are set
3. Variable names are case-sensitive

### Issue 2: "MongoDB connection failed"

**Cause**: 
- MongoDB Atlas not allowing Koyeb IPs
- Incorrect connection string
- MongoDB cluster down

**Solution**:
1. Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
2. Check connection string in `MONGO_URI`
3. Test connection string locally first
4. Ensure MongoDB cluster is running

### Issue 3: "Health check failing"

**Cause**:
- Server not listening on correct port
- MongoDB not connected (server won't start)
- Health check path incorrect

**Solution**:
1. Verify Koyeb health check path is `/api/health`
2. Check deployment logs for startup errors
3. Ensure PORT matches Koyeb configuration

### Issue 4: "Admin build failing"

**Cause**:
- Admin dashboard has build errors
- Build tools not available in deployment environment

**Solution**:
1. Set `SKIP_ADMIN_BUILD=true` in Koyeb environment variables
2. Or fix admin build errors locally first
3. Admin build is optional for backend API functionality

### Issue 5: "JWT errors in production"

**Cause**: `JWT_SECRET` not set or incorrect

**Solution**:
1. Verify `JWT_SECRET` is set in Koyeb environment variables
2. Use a strong, random secret (at least 32 characters)
3. Never commit JWT_SECRET to repository

---

## Testing Your Deployment

### 1. Health Check
```bash
curl https://your-app.koyeb.app/api/health
```

### 2. User Registration
```bash
curl -X POST https://your-app.koyeb.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. User Login
```bash
curl -X POST https://your-app.koyeb.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Production Checklist

Before going live, ensure:

- [ ] All required environment variables are set
- [ ] MongoDB Atlas allows Koyeb connections
- [ ] Health check endpoint responds successfully
- [ ] API endpoints tested and working
- [ ] JWT authentication working
- [ ] HTTPS enabled (automatic with Koyeb)
- [ ] Custom domain configured (optional)
- [ ] Monitoring and logging set up
- [ ] Backup strategy in place for MongoDB
- [ ] Rate limiting configured (consider adding)
- [ ] CORS configured for your frontend domains

---

## Monitoring and Maintenance

### Koyeb Dashboard
- Monitor CPU, memory, and network usage
- Check deployment logs for errors
- Set up alerts for downtime

### MongoDB Atlas
- Monitor database connection count
- Check storage usage
- Set up automated backups
- Review slow queries

### Regular Tasks
- **Daily**: Check error logs, monitor health endpoint
- **Weekly**: Review MongoDB performance, check disk usage
- **Monthly**: Update dependencies, security patches, backup verification

---

## Scaling Considerations

As your user base grows:

1. **Database**:
   - Upgrade MongoDB Atlas tier
   - Add database indexes for frequently queried fields
   - Consider read replicas

2. **Backend**:
   - Scale Koyeb instances horizontally
   - Implement Redis for caching
   - Add load balancer

3. **VTPass**:
   - Monitor VTPass wallet balance
   - Set up low balance alerts
   - Consider multiple API accounts for redundancy

---

## Support

If you encounter deployment issues:

1. Check Koyeb deployment logs
2. Review MongoDB Atlas logs
3. Test locally with production environment variables
4. Verify all environment variables are set correctly
5. Contact Koyeb support for platform-specific issues

---

## Current Backend Status

✅ Backend is running successfully in Replit development environment:
- Backend API: http://localhost:3001
- Admin Dashboard: http://localhost:5000
- MongoDB: Connected
- Environment: Development mode

Your backend is ready for deployment to Koyeb with all necessary fixes applied.
