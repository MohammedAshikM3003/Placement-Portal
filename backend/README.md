# Placement Portal Backend

Backend service for the Placement Portal application with Firebase custom token generation.

## Features

- Student authentication using registration number and DOB
- Coordinator authentication with department-based access
- Admin authentication with full system access
- Firebase custom token generation
- User management and role-based access control

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `env.example`:
```bash
cp env.example .env
```

3. Configure Firebase Admin SDK:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Generate a new private key
   - Copy the values to your `.env` file

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

#### Student Login
```
POST /api/auth/student-login
Content-Type: application/json

{
  "regNo": "STUDENT_REG_NO",
  "dob": "DDMMYYYY"
}
```

#### Coordinator Login
```
POST /api/auth/coordinator-login
Content-Type: application/json

{
  "coordinatorId": "coord_cse",
  "password": "coord123"
}
```

#### Admin Login
```
POST /api/auth/admin-login
Content-Type: application/json

{
  "adminId": "admin",
  "password": "admin123"
}
```

#### Create Student Account
```
POST /api/auth/create-student
Content-Type: application/json

{
  "regNo": "STUDENT_REG_NO",
  "dob": "DDMMYYYY",
  "email": "student@college.edu",
  "firstName": "John",
  "lastName": "Doe",
  "department": "CSE"
}
```

### Health Check
```
GET /api/health
```

## Default Credentials

### Admin
- ID: `admin`
- Password: `admin123`

### Coordinators
- CSE: `coord_cse` / `coord123`
- ECE: `coord_ece` / `coord123`
- MECH: `coord_mech` / `coord123`
- CIVIL: `coord_civil` / `coord123`

## Environment Variables

- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase Admin SDK private key
- `FIREBASE_CLIENT_EMAIL`: Firebase Admin SDK client email
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)

## Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Implement proper input validation
- Add rate limiting for authentication endpoints
- Use HTTPS in production

