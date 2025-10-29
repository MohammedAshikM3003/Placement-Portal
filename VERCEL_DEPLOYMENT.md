# 🚀 Vercel Deployment Guide

## **Prerequisites**
- GitHub account
- Vercel account (free)
- MongoDB Atlas database (already set up ✅)

## **Step 1: Push to GitHub**

### **Security Check Before Pushing:**
1. ✅ MongoDB password is commented out in `.env-atlas`
2. ✅ Hugging Face API key is commented out
3. ✅ All sensitive data is in `.gitignore`

### **Push Commands:**
```bash
git add .
git commit -m "Ready for Vercel deployment - secure version"
git push origin main
```

## **Step 2: Deploy to Vercel**

### **Frontend Deployment:**
1. **Go to**: https://vercel.com
2. **Login** with GitHub
3. **Import Project** → Select your GitHub repo
4. **Framework**: React
5. **Build Command**: `npm run build`
6. **Output Directory**: `build`
7. **Deploy**

### **Backend Deployment:**
1. **Create new project** for backend
2. **Import** same GitHub repo
3. **Root Directory**: `backend`
4. **Framework**: Other
5. **Build Command**: `npm install`
6. **Output Directory**: `.`
7. **Deploy**

## **Step 3: Environment Variables in Vercel**

### **For Backend Project:**
Add these in Vercel Dashboard → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://placement-portal-user:UWaLa3a1iygV3cZ8@placement-portal-cluste.0zhp6cb.mongodb.net/placement-portal?retryWrites=true&w=majority&appName=placement-portal-cluster

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

NODE_ENV=production

CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### **For Frontend Project:**
```
REACT_APP_API_URL=https://your-backend-domain.vercel.app
```

## **Step 4: Update Frontend API Calls**

Update your frontend to use the Vercel backend URL instead of localhost:5000.

## **Step 5: Test Deployment**

1. **Frontend URL**: `https://your-project-name.vercel.app`
2. **Backend URL**: `https://your-backend-name.vercel.app`
3. **Test login** with your credentials

## **Benefits of Vercel Hosting:**
- ✅ **Free hosting** for both frontend and backend
- ✅ **Automatic deployments** from GitHub
- ✅ **HTTPS by default**
- ✅ **Global CDN**
- ✅ **Environment variables** for secrets
- ✅ **Custom domains** available

## **Your Current Setup:**
- ✅ MongoDB Atlas database with student data
- ✅ Clean, secure codebase
- ✅ Working login system
- ✅ All features functional

**Ready for deployment!** 🎯
