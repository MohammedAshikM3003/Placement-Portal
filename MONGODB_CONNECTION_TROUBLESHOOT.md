# 🔧 MongoDB Connection Troubleshooting Guide

## 🎯 **Current Status Analysis:**
- ✅ MongoDB Atlas cluster is **ACTIVE** (from your screenshot)
- ✅ Vercel environment variables are **SET** (from your screenshot)
- ❌ Backend still showing "In-Memory Storage" instead of MongoDB

## 🚀 **Step-by-Step Fix:**

### **Step 1: Update MongoDB Connection String**
Your current connection string might have issues. Try this updated format:

**In Vercel Environment Variables, update `MONGODB_URI` to:**
```
mongodb+srv://placement-portal-user:UWaLa3a1iygV3cZ8@placement-portal-cluste.0zhp6cb.mongodb.net/placement-portal?retryWrites=true&w=majority
```

**Key Changes:**
- Removed `&appName=placement-portal-cluster` (can cause issues)
- Simplified connection string

### **Step 2: Check MongoDB Atlas Network Access**
1. Go to MongoDB Atlas → **Network Access**
2. Make sure you have: `0.0.0.0/0` (Allow access from anywhere)
3. If not, click **ADD IP ADDRESS** → **ALLOW ACCESS FROM ANYWHERE**

### **Step 3: Verify Database User Permissions**
1. Go to MongoDB Atlas → **Database Access**
2. Check user: `placement-portal-user`
3. Make sure it has **Read and write to any database** permissions

### **Step 4: Test Connection Locally First**
Before deploying to Vercel, test locally:

1. **Create `.env` file in backend folder:**
```env
MONGODB_URI=mongodb+srv://placement-portal-user:UWaLa3a1iygV3cZ8@placement-portal-cluste.0zhp6cb.mongodb.net/placement-portal?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
NODE_ENV=development
PORT=5000
```

2. **Test local backend:**
```bash
cd backend
npm run dev
```

3. **Check health endpoint:**
Visit: `http://localhost:5000/api/health`

**Expected Response:**
```json
{
  "status": "OK",
  "database": "MongoDB Atlas",
  "connection": "Connected"
}
```

### **Step 5: Redeploy Backend to Vercel**
After local testing works:

```bash
cd backend
git add .
git commit -m "Fix MongoDB connection string"
git push origin main
```

### **Step 6: Alternative - Create New Database User**
If still not working, create a new database user:

1. Go to MongoDB Atlas → **Database Access**
2. Click **ADD NEW DATABASE USER**
3. Create user: `placement-user-new`
4. Password: `NewPassword123!`
5. Give **Read and write to any database** permissions

**New connection string:**
```
mongodb+srv://placement-user-new:NewPassword123!@placement-portal-cluste.0zhp6cb.mongodb.net/placement-portal?retryWrites=true&w=majority
```

### **Step 7: Check Vercel Deployment Logs**
1. Go to Vercel Dashboard → Your Backend Project
2. Click on latest deployment
3. Check **Function Logs** for MongoDB connection errors

## 🎯 **Quick Test:**
After making changes, test the health endpoint:
- **Vercel**: https://placement-portal-backend-eight.vercel.app/api/health
- **Local**: http://localhost:5000/api/health

## 🔍 **Common Issues:**
1. **Password contains special characters** - Use URL encoding
2. **Cluster name mismatch** - Check exact cluster name
3. **Network restrictions** - Must allow 0.0.0.0/0 for Vercel
4. **Database name** - Make sure `placement-portal` database exists

## 💡 **Pro Tip:**
If you keep having issues, use **local backend for development**:
1. Change frontend `.env`: `REACT_APP_API_URL=http://localhost:5000/api`
2. Run backend locally: `npm run dev`
3. This will work 100% while you fix the Vercel deployment
