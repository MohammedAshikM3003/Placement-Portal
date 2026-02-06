# JWT Security & Token Management Guide

## 🔐 JWT Token Configuration

### Token Expiration
**Location:** `backend/server-mongodb.js`
- **Lines:** 3746, 3849, 3972, 4000
- **Duration:** 6 hours (`expiresIn: '6h'`)
- **Applies to:** Student, Coordinator, and Admin logins

### JWT Middleware (Authentication Validation)
**Location:** `backend/server-mongodb.js` - Lines 3109-3120

```javascript
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};
```

**⚠️ IMPORTANT:** This middleware exists but is NOT currently applied to routes. 

### How to Enable JWT Protection on Routes

To protect routes with JWT validation, add `authenticateToken` middleware:

```javascript
// Example: Protect student profile endpoint
app.get('/api/students/:id', authenticateToken, async (req, res) => {
    // Route handler
});

// Example: Protect admin endpoints
app.post('/api/admin/add-branch', authenticateToken, async (req, res) => {
    // Route handler
});
```

## 📦 LocalStorage Security Changes

### ✅ What's Stored (Minimal & Secure)

**Student Login:**
- `authToken` - JWT token only
- `authRole` - 'student'
- `isLoggedIn` - 'true'
- `studentData` - Minimal info: `{_id, regNo, firstName, lastName, branch}`

**Coordinator Login:**
- `authToken` - JWT token only
- `authRole` - 'coordinator'
- `isCoordinatorLoggedIn` - 'true'
- `coordinatorId` - ID only
- `coordinatorUsername` - Username only

**Admin Login:**
- `authToken` - JWT token only
- `authRole` - 'admin'
- `isLoggedIn` - 'true'
- `adminLoginID` - ID only
- `adminProfileCache` - Display info only (name, photo)

### ❌ What's NOT Stored (Removed for Security)

- ~~Passwords~~ - NEVER stored
- ~~Date of Birth (DOB)~~ - Removed (was login credential)
- ~~Registration Number~~ - Removed (was login credential)
- ~~Full User Objects~~ - Removed (too much data)
- ~~Complete Coordinator Data~~ - Reduced to ID/username only
- ~~Complete Admin Data~~ - Reduced to minimal profile cache

## 🔒 Security Improvements Made

### 1. JWT Token Duration
✅ Reduced from 24 hours to 6 hours for better security

### 2. Session Storage Cleanup
✅ Removed sensitive login credentials from localStorage
✅ Only storing JWT tokens and minimal user identifiers
✅ Full user data fetched from backend when needed

### 3. Logout Session Termination
✅ All sidebars properly clear localStorage on logout
✅ AuthContext.logout() called to end session
✅ Navigation to landing page after logout

## 🚀 Where JWT Tokens Are Used

### Frontend Token Sending
**Location:** `src/services/authService.jsx`

All API calls include JWT token in Authorization header:
```javascript
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
}
```

### Backend Token Verification
**Current Status:** Middleware exists but NOT applied to routes

**To Activate:**
1. Add `authenticateToken` middleware to protected routes
2. Example routes that should be protected:
   - `/api/students/:id` (GET, PUT)
   - `/api/admin/*` (All admin routes)
   - `/api/coordinator/*` (All coordinator routes)
   - `/api/certificates/*`
   - `/api/achievements/*`
   - `/api/resume/*`

## 📝 Testing JWT Protection

### Test Token Expiration
1. Login as any user role
2. Wait 6 hours
3. Try accessing protected resources
4. Should receive 403 Forbidden error

### Test Invalid Token
1. Login as user
2. Manually modify `authToken` in localStorage
3. Try accessing resources
4. Should receive 403 Forbidden error

### Test No Token
1. Clear localStorage
2. Try accessing protected resources directly
3. Should receive 401 Unauthorized error

## 🔧 Recommended Next Steps

### 1. Apply JWT Middleware to All Protected Routes
Update `backend/server-mongodb.js`:

```javascript
// Student routes
app.get('/api/students/:id', authenticateToken, async (req, res) => {...});
app.put('/api/students/:id', authenticateToken, async (req, res) => {...});

// Admin routes
app.post('/api/admin/*', authenticateToken, adminRoleCheck, async (req, res) => {...});

// Coordinator routes
app.get('/api/coordinator/*', authenticateToken, coordinatorRoleCheck, async (req, res) => {...});
```

### 2. Add Role-Based Middleware
Create middleware to check user role from JWT:

```javascript
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.sendStatus(403);
        }
        next();
    };
};

// Usage:
app.post('/api/admin/add-branch', 
    authenticateToken, 
    checkRole(['admin']), 
    async (req, res) => {...}
);
```

### 3. Implement Token Refresh
For better UX, implement token refresh before 6-hour expiration.

## 📊 Summary

| Feature | Status | Location |
|---------|--------|----------|
| JWT Token Generation | ✅ Active | `server-mongodb.js` (login endpoints) |
| JWT Middleware | ✅ Active and Applied | `server-mongodb.js:113-138` |
| Token Expiration | ✅ 6 hours | All login endpoints |
| Secure Storage | ✅ Minimal data only | `authService.jsx` |
| Logout Cleanup | ✅ Complete | All sidebars |
| Frontend Token Sending | ✅ Active | `authService.jsx` |
| Backend Token Validation | ✅ Applied to critical routes | Multiple endpoints protected |

**Protected Endpoints:**
- ✅ `/api/students/:id` - GET (student/admin/coordinator roles)
- ✅ `/api/students/:id` - PUT (student/admin roles)
- ✅ `/api/students/:id` - DELETE (admin only)
- ✅ `/api/admin/companies` - GET/POST/PUT/DELETE (admin/coordinator roles)
- ✅ `/api/branches` - POST/DELETE (admin only)
- ✅ `/api/coordinators` - GET/POST/DELETE (admin only)
- ✅ `/api/certificates` - POST (student/admin roles)
- ✅ `/api/resume/upload` - POST (student only)
- ✅ `/api/attendance/submit` - POST (coordinator/admin roles)
- ✅ `/api/eligible-students` - GET/POST (admin/coordinator roles)
- ✅ `/api/placed-students` - GET/POST (admin/coordinator roles)

---

**Last Updated:** February 1, 2026
**JWT Library:** jsonwebtoken  
**Token Duration:** 6 hours
**Security Status:** ✅ **FULLY ACTIVATED** - JWT tokens required for protected endpoints
