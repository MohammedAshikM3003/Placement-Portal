# 🚀 Placement Portal - Quick Start Guide

## **Automated Startup (Recommended)**

### **Option 1: Run Both Frontend & Backend Together**
```bash
npm run dev
```
This will automatically start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### **Option 2: Development Mode with Auto-Restart**
```bash
npm run dev:full
```
This will start both with auto-restart on file changes.

---

## **Manual Startup (If needed)**

### **Step 1: Start Backend Server**
```bash
cd backend
npm run start:mongodb
```
Backend will run on: `http://localhost:5000`

### **Step 2: Start Frontend (New Terminal)**
```bash
npm start
```
Frontend will run on: `http://localhost:3000`

---

## **First Time Setup**

### **1. Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### **2. Database Setup**
The project is configured to use local MongoDB by default.

**Option A: Use Local MongoDB**
- Install MongoDB locally
- The app will connect to `mongodb://localhost:27017/placement-portal`

**Option B: Use MongoDB Atlas (Cloud)**
- Edit `backend/.env-atlas`
- Replace the MONGODB_URI with your Atlas connection string

### **3. Environment Configuration**
Edit `backend/.env-atlas` to configure:
- Database connection
- API keys (optional for basic functionality)
- JWT secret key

---

## **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend & backend |
| `npm run dev:full` | Start with auto-restart |
| `npm start` | Start frontend only |
| `npm run start:backend` | Start backend only |

---

## **Access Points**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Student Portal**: http://localhost:3000/student-dashboard
- **Coordinator Portal**: http://localhost:3000/coo-dashboard

---

## **Troubleshooting**

### **Port 5000 Already in Use**
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### **Dependencies Missing**
```bash
# Reinstall all dependencies
npm install
cd backend && npm install
```

### **Database Connection Issues**
- Check if MongoDB is running locally
- Verify connection string in `backend/.env-atlas`
- Check firewall settings

---

## **Why Port 5000?**

The backend runs on port 5000 because:
1. **Separation of Concerns**: Frontend (3000) and Backend (5000) run independently
2. **Development Flexibility**: You can restart one without affecting the other
3. **Production Ready**: This setup mirrors production deployment patterns
4. **API Testing**: Backend can be tested independently

The automation scripts handle this automatically - you don't need to manually manage ports!
