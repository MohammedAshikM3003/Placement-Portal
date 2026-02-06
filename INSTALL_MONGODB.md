# MongoDB Installation Guide for Windows

## Quick Install (5 minutes)

### Method 1: Download MongoDB Community Server

1. **Download MongoDB**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Click: Download

2. **Install MongoDB**
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - ✅ **IMPORTANT**: Check "Install MongoDB as a Service"
   - ✅ **IMPORTANT**: Check "Install MongoDB Compass" (GUI tool)
   - Click Next → Install

3. **Verify Installation**
   ```powershell
   # Open PowerShell and run:
   mongod --version
   ```

4. **Start MongoDB Service**
   ```powershell
   # Start MongoDB service:
   net start MongoDB
   
   # Or use Services:
   # Press Win+R → type "services.msc" → Find "MongoDB" → Right-click → Start
   ```

5. **Test Connection**
   ```powershell
   cd backend
   node test-connection.js
   ```

### Method 2: Using Chocolatey (Package Manager)

If you have Chocolatey installed:

```powershell
# Install MongoDB
choco install mongodb

# Start MongoDB service
net start MongoDB
```

### Method 3: Portable MongoDB (No Installation)

1. Download MongoDB ZIP from: https://www.mongodb.com/try/download/community
2. Extract to: `C:\mongodb`
3. Create data directory: `C:\data\db`
4. Run MongoDB manually:
   ```powershell
   C:\mongodb\bin\mongod.exe --dbpath C:\data\db
   ```

## After MongoDB is Running

1. **Start the Backend Server**
   ```powershell
   cd D:\Placement-Portal\backend
   .\start-server.bat
   ```

2. **Test Admin Login**
   - Go to: http://localhost:5173 (your frontend)
   - Try logging in with your admin credentials

## Troubleshooting

### MongoDB won't start
- Check if data directory exists: `C:\data\db`
- Create it if missing:
  ```powershell
  mkdir C:\data\db
  ```

### Port 27017 is in use
- Check for other MongoDB instances:
  ```powershell
  Get-Process | Where-Object { $_.Name -like "*mongod*" }
  ```

### Still having issues?
- Open MongoDB Compass (GUI tool)
- Connect to: `mongodb://localhost:27017`
- This will verify MongoDB is running

## Quick Start After Installation

```powershell
# 1. Start MongoDB (if not running as service)
net start MongoDB

# 2. Start Backend Server
cd D:\Placement-Portal\backend
.\start-server.bat

# 3. Start Frontend (in another terminal)
cd D:\Placement-Portal
npm run dev
```

## MongoDB Status Check

```powershell
# Check if MongoDB service is running
Get-Service -Name MongoDB

# Check MongoDB process
Get-Process | Where-Object { $_.Name -like "*mongod*" }

# Test connection
cd backend
node test-connection.js
```
