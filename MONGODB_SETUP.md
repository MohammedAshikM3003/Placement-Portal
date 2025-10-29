# 🗄️ MongoDB Setup Guide

## **Option 1: Quick Start (In-Memory Storage)**
✅ **Already Working!** Your backend is using in-memory storage.
- No setup needed
- Data resets when server restarts
- Perfect for development and testing

## **Option 2: Install MongoDB Locally**

### **Windows Installation:**

1. **Download MongoDB Community Server:**
   - Go to: https://www.mongodb.com/try/download/community
   - Select Windows, MSI package
   - Download and run the installer

2. **Installation Steps:**
   - Choose "Complete" installation
   - Install MongoDB as a Service ✅
   - Install MongoDB Compass (GUI) ✅
   - Click Install

3. **Verify Installation:**
   ```bash
   # Open Command Prompt and run:
   mongod --version
   ```

4. **Update Configuration:**
   - Edit `backend/.env-atlas`
   - Uncomment this line:
   ```
   MONGODB_URI=mongodb://localhost:27017/placement-portal
   ```

5. **Restart Your Application:**
   ```bash
   npm run dev
   ```

## **Option 3: Use MongoDB Atlas (Cloud)**

1. **Create Free Account:**
   - Go to: https://www.mongodb.com/atlas
   - Sign up for free account

2. **Create Cluster:**
   - Choose "Build a Database"
   - Select "M0 Sandbox" (Free)
   - Choose your region
   - Create cluster

3. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

4. **Update Configuration:**
   - Edit `backend/.env-atlas`
   - Replace with your connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/placement-portal?retryWrites=true&w=majority
   ```

## **Current Status: ✅ Working with In-Memory Storage**

Your application is already functional! The backend automatically falls back to in-memory storage when MongoDB isn't available. This is perfect for:

- ✅ Development and testing
- ✅ Learning the application
- ✅ Demonstrating features
- ✅ Quick prototyping

**Data Persistence:** Data will be lost when the server restarts, but all features work normally.

## **Recommendation**

**For now:** Keep using in-memory storage - it's working perfectly!

**Later:** Install MongoDB locally when you need persistent data storage.
