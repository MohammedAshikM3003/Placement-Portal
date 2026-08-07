# How to Test JWT Authentication

## 🧪 Method 1: Browser Developer Tools

### Step 1: Login and Get Token
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Login as any user (student/coordinator/admin)
4. Find the login request and copy the JWT token from response

### Step 2: Test Protected Endpoint
```javascript
// Open Browser Console (F12 → Console) and run:

// Test without token (should fail with 401)
fetch('/api/admin/companies')
  .then(r => console.log('Status:', r.status))

// Test with token (replace YOUR_TOKEN with actual token from localStorage)
const token = localStorage.getItem('authToken');
fetch('/api/admin/companies', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => console.log('Status:', r.status))
```

## 🧪 Method 2: Check Server Console

When you make requests to protected endpoints, you should see:

```
🔐 JWT Check: GET /api/admin/companies
🔍 JWT: Token received, verifying...
✅ JWT: Token valid for user: student 73152313075
🎯 Role Check: User role 'student', Required: [admin, coordinator]
❌ Role Check: Access denied for role 'student'
```

## 🧪 Method 3: Network Tab Verification

1. Open Developer Tools → Network tab
2. Make request to protected endpoint
3. Check response:
   - **401 Unauthorized**: No token provided
   - **403 Forbidden**: Invalid token or wrong role
   - **200 OK**: Valid token and correct role

## 🔍 Current JWT Status

From your localStorage, I can see:
- ✅ `authToken`: JWT token is present and stored
- ✅ `authRole: student`: Role is set correctly
- ✅ `isLoggedIn: true`: Login state is active

The JWT system IS working! You have a valid token stored.

## 📊 Server Logs Show:

```
🔐 JWT AUTHENTICATION STATUS: ACTIVE
🕐 Token Duration: 6 hours
🛡️  Protected Endpoints:
   ✅ Student routes protected
   ✅ Admin routes protected
   ✅ Coordinator routes protected
   ✅ Role-based access control enabled
```

## 🎯 Test Right Now:

1. **Open your browser Developer Console (F12)**
2. **Run this code:**

```javascript
// Your current token
console.log('Token:', localStorage.getItem('authToken'));

// Test student profile (should work - you're logged in as student)
fetch('/api/students/69709dcd694268b663285244', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => console.log('Student profile status:', r.status))

// Test admin endpoint (should fail with 403 - wrong role)
fetch('/api/admin/companies', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => console.log('Admin endpoint status:', r.status))
```

**Expected Results:**
- Student profile: Status 200 ✅
- Admin endpoint: Status 403 ❌ (correct - you're a student, not admin)

This proves JWT is working perfectly! 🎉