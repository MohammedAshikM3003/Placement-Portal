# 🚨 Backend Deployment Fix

## Current Issue
- Frontend: ✅ Working on Vercel
- Backend: ❌ "Cannot GET /api" error
- Login: ❌ API Error 404

## Root Cause
1. Backend environment variables not set on Vercel
2. CORS configuration needs to include your frontend URL

## 🔧 Step-by-Step Fix

### Option 1: Deploy Backend via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Import your GitHub repository** (backend folder)
3. **Set Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://placement-portal-user:UWaLa3a1iygV3cZ8@placement-portal-cluste.0zhp6cb.mongodb.net/placement-portal?retryWrites=true&w=majority&appName=placement-portal-cluster
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
   NODE_ENV=production
   ```
4. **Deploy**

### Option 2: Deploy via CLI

```bash
# In backend folder
cd backend
vercel --prod

# Follow prompts and set environment variables
```

### Option 3: Push Backend Changes to GitHub

```bash
# Add backend changes
git add backend/
git commit -m "Fix backend CORS and add production env"
git push origin main

# Then redeploy on Vercel dashboard
```

## 🔍 Testing Your Fix

1. **Check Backend Health:**
   Visit: `https://your-backend.vercel.app/api/health`
   Should return: `{"status": "OK", "database": "Connected"}`

2. **Test Login Endpoint:**
   Visit: `https://your-backend.vercel.app/api/students/login`
   Should return: Method not allowed (POST required)

3. **Test Frontend Login:**
   - Go to your frontend URL
   - Try logging in with valid credentials
   - Should work without API Error 404

## 🚨 Common Issues & Solutions

### Issue: Still getting "Cannot GET /api"
**Solution:** 
- Check Vercel deployment logs
- Ensure environment variables are set
- Verify MongoDB connection string

### Issue: CORS errors
**Solution:** 
- Backend CORS now includes all Vercel URLs
- Make sure frontend URL matches pattern

### Issue: MongoDB connection failed
**Solution:** 
- Check MongoDB Atlas whitelist (allow all IPs: 0.0.0.0/0)
- Verify connection string is correct
- Check MongoDB Atlas cluster status

## 📋 Environment Variables Checklist

On Vercel Backend Deployment, set these:
- ✅ `MONGODB_URI` - Your MongoDB Atlas connection string
- ✅ `JWT_SECRET` - Your JWT secret key  
- ✅ `NODE_ENV` - Set to "production"

## 🔄 Quick Test Commands

```bash
# Test backend health
curl https://your-backend.vercel.app/api/health

# Test login endpoint (should return method not allowed)
curl https://your-backend.vercel.app/api/students/login
```
