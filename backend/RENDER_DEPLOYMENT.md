# Render Deployment Guide for Placement Portal Backend

## Prerequisites
1. GitHub account with your code pushed to a repository
2. Render account (free tier available)
3. MongoDB Atlas cluster (already configured)

## Step-by-Step Deployment

### 1. Prepare Your Repository
Ensure your backend code is pushed to GitHub with these files:
- `server-mongodb.js` (main server file)
- `package.json` (updated with correct start script)
- `Dockerfile` (optional, for containerized deployment)
- `.env.render` (template for environment variables)

### 2. Create Render Web Service

1. **Login to Render Dashboard**
   - Go to https://render.com
   - Sign in with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your backend code

3. **Configure Service Settings**
   - **Name**: `placement-portal-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend` (if backend is in subdirectory)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Set Environment Variables

In the Render dashboard, add these environment variables:

**Required Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://placement-portal-user:UWaLa3a1iygV3cZ8@placement-portal-cluste.0zhp6cb.mongodb.net/placement-portal?retryWrites=true&w=majority&appName=placement-portal-cluster
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
CORS_ORIGINS=https://placement-portal.vercel.app,https://placement--portal.vercel.app
```

**Important Notes:**
- **DO NOT set PORT** - Render automatically provides the PORT environment variable
- Replace `JWT_SECRET` with a secure random string in production
- Add your actual frontend domain to `CORS_ORIGINS`
- Your server code should use `process.env.PORT || 5000` (already configured)

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your application
   - Provide a public URL

### 5. Verify Deployment

Once deployed, test your API:
- Health check: `https://your-app-name.onrender.com/api/health`
- Should return JSON with status information

### 6. Update Frontend

Update your frontend `.env` file to use the new Render URL:
```
REACT_APP_API_URL=https://your-app-name.onrender.com
```

## Important Notes

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down may take 30+ seconds
- 750 hours/month limit (sufficient for development)

### Production Considerations
- Upgrade to paid plan for production use
- Set up custom domain
- Configure proper monitoring
- Set up database backups

### Troubleshooting

1. **Build Fails**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Service Won't Start**
   - Check service logs
   - Verify environment variables
   - Test MongoDB connection string

3. **Port Binding Issues**
   - **DO NOT** manually set PORT in environment variables
   - Render automatically provides PORT (usually 10000)
   - Your code should use `process.env.PORT || 5000`
   - Remove any hardcoded port numbers

4. **CORS Issues**
   - Update CORS origins in server code
   - Add your frontend domain to allowed origins

5. **"Port already in use" Error**
   - This means you set PORT manually - remove it
   - Let Render handle port assignment automatically

### Monitoring

- Use Render dashboard to monitor:
  - Service status
  - Logs
  - Metrics
  - Deployments

### Auto-Deploy

Render automatically redeploys when you push to your connected branch.

## Support

- Render Documentation: https://render.com/docs
- Community Forum: https://community.render.com
