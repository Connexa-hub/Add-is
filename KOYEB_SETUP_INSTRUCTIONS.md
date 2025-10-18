# Koyeb Auto-Deployment Setup Instructions

## Overview
Your backend is now configured for automatic deployment to Koyeb whenever you push changes to GitHub. The configuration file `.koyeb/koyeb.yaml` defines the deployment settings.

## Step 1: Create Koyeb Account
1. Go to https://www.koyeb.com
2. Sign up for a free account
3. Verify your email

## Step 2: Connect GitHub Repository
1. In Koyeb dashboard, click "Create App"
2. Select "GitHub" as the deployment method
3. Authorize Koyeb to access your GitHub account
4. Select your repository
5. Choose the branch: `main`

## Step 3: Configure Secrets in Koyeb
Before deployment, you must add all required secrets in Koyeb:

### Navigate to Settings → Secrets and add:

**Required Secrets:**
```
MONGO_URI=mongodb+srv://connexaaddis:CONNEXAADIS@addis.krhvqra.mongodb.net/?retryWrites=true&w=majority&appName=Addis
JWT_SECRET=OLAJUMOKE
```

**VTPass Secrets:**
```
VTPASS_API_KEY=56fa6d60e6e5522861d8798213b6a34f
VTPASS_PUBLIC_KEY=PK_516fdf7cbc5fafffd0afc9245ac781448ff63d914fc
VTPASS_BASE_URL=https://sandbox.vtpass.com/api
VTPASS_USERNAME=akinolaakinadeisrael5@gmail.com
VTPASS_SECRET_KEY=SK_660fb766ca277c384b933a5b9eba9541d8d2b8055e1
```

**Monnify Secrets:**
```
MONNIFY_API_KEY=MK_TEST_5XDLQVCRNP
MONNIFY_SECRET_KEY=95UELE71N39B0941JBTBFR7UC21BRFKP
MONNIFY_BASE_URL=https://sandbox.monnify.com
MONNIFY_CONTRACT_CODE=8652326301
```

**Email Secrets:**
```
EMAIL_USER=akinadeisrael5@gmail.com
EMAIL_PASS=cmnk fioa ravv nxyi
```

## Step 4: Deploy with Koyeb YAML
1. In the Koyeb app creation wizard, look for "Use Koyeb YAML"
2. Enable it - Koyeb will automatically detect `.koyeb/koyeb.yaml`
3. Click "Deploy"

## Step 5: Verify Deployment
Once deployed:

1. **Check Health Endpoint:**
   ```
   curl https://YOUR-APP-NAME.koyeb.app/api/health
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "message": "Server is running",
     "timestamp": "2025-10-18T..."
   }
   ```

2. **Access Admin Dashboard:**
   - Open: `https://YOUR-APP-NAME.koyeb.app`
   - Login with: `admin@example.com` / `Admin123!`

## Step 6: Configure MongoDB Atlas Network Access
1. Go to MongoDB Atlas dashboard
2. Navigate to "Network Access"
3. Click "Add IP Address"
4. Add: `0.0.0.0/0` (Allow from anywhere)
   - Or for better security, add specific Koyeb IP ranges

## Auto-Deployment
Once set up, any push to the `main` branch will automatically trigger a new deployment:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Koyeb will:
1. Detect the push
2. Pull latest code
3. Run build command: `npm install && npm run build:admin`
4. Start server: `npm start`
5. Monitor health endpoint: `/api/health`

## Monitoring

### View Logs:
1. Go to Koyeb dashboard
2. Select your app
3. Click "Logs" tab
4. Watch for:
   - `✅ Environment validation passed`
   - `✅ MongoDB connected successfully`
   - `🚀 Server running on http://0.0.0.0:8000`

### Metrics:
- CPU usage
- Memory usage
- Request count
- Response times

## Troubleshooting

### Deployment Fails
1. Check Koyeb build logs for errors
2. Verify all secrets are set correctly
3. Ensure MongoDB Atlas allows connections from 0.0.0.0/0

### Health Check Fails
1. Verify server is listening on port 8000
2. Check `/api/health` endpoint responds correctly
3. Review server logs for startup errors

### Database Connection Fails
1. Verify `MONGO_URI` secret is correct
2. Check MongoDB Atlas network access settings
3. Ensure database credentials are valid

## Production Checklist

Before going live:

- [ ] All secrets configured in Koyeb
- [ ] MongoDB Atlas network access configured
- [ ] Health endpoint responding successfully
- [ ] Admin dashboard accessible
- [ ] API endpoints tested
- [ ] Custom domain configured (optional)
- [ ] SSL/TLS enabled (automatic with Koyeb)
- [ ] Monitoring and alerts set up

## Custom Domain (Optional)

To use your own domain:

1. In Koyeb dashboard, go to your app
2. Click "Domains"
3. Click "Add domain"
4. Enter your domain name
5. Add the provided DNS records to your domain registrar:
   - CNAME record pointing to Koyeb

## Scaling

To increase capacity:

1. Go to Koyeb dashboard
2. Select your app
3. Click "Settings"
4. Under "Autoscaling", adjust:
   - Minimum instances (currently 1)
   - Maximum instances (currently 1)
   - Instance type (currently nano)

## Cost Management

**Free Tier:**
- Includes 1 free nano instance
- Perfect for testing and small apps

**Paid Plans:**
- Scale up when ready for production
- Pay only for what you use

## Support

If you encounter issues:
1. Check Koyeb documentation: https://www.koyeb.com/docs
2. Review deployment logs in Koyeb dashboard
3. Contact Koyeb support through dashboard

---

## Current Status

✅ **Ready for Deployment**

Your backend is fully configured and ready to be deployed to Koyeb. Simply follow the steps above to set up auto-deployment from GitHub.

**What happens on each push:**
1. Code pushed to GitHub main branch
2. Koyeb detects the change
3. Pulls latest code
4. Builds admin dashboard
5. Starts backend server
6. Serves both API and admin web on single port
7. Monitors health and restarts if needed

**Your app will be accessible at:**
- API: `https://YOUR-APP-NAME.koyeb.app/api/*`
- Admin Dashboard: `https://YOUR-APP-NAME.koyeb.app`
