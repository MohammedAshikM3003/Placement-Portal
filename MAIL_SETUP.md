# Placement Portal - Mail & OTP Platform Setup Guide

This guide details the setup, configuration, and migration instructions for the centralized mail notification and secure OTP verification platform.

---

## 1. Environment Variables Configuration

To run and test the mail system, you need to populate configuration variables inside the backend `.env` file (`backend/.env`).

### Development / Local Testing (Using Gmail SMTP)
For temporary development testing, you can use any Gmail account with a **Google App Password** (regular passwords will fail).

Add the following variables to `backend/.env`:
```env
# Mail configuration
MAIL_PROVIDER=gmail
MAIL_USER=your-testing-email@gmail.com
MAIL_PASSWORD=your-16-character-google-app-password

# Visual branding sender defaults (optional)
MAIL_FROM_NAME=K S R College of Engineering - Placement Cell
MAIL_FROM_ADDRESS=your-testing-email@gmail.com
PORTAL_URL=http://localhost:3000
```

> [!NOTE]
> To generate a Google App Password:
> 1. Go to your Google Account settings (myaccount.google.com).
> 2. Enable **2-Step Verification** under Security.
> 3. Go to the "App passwords" section.
> 4. Select "Other (Custom name)" and type "Placement Portal".
> 5. Copy the generated 16-character code and paste it into the `MAIL_PASSWORD` variable.

### Production / College Server Migration (Institutional SMTP)
When migrating to the KSRCE institutional mail (Office 365, Google Workspace, or custom SMTP server), simply change the provider configuration without modifying any code:

```env
# Institutional SMTP Settings
MAIL_PROVIDER=smtp
MAIL_USER=placement-cell@ksrce.ac.in
MAIL_PASSWORD=your-institutional-account-password
MAIL_SMTP_HOST=smtp.office365.com # or smtp.gmail.com for Workspace, etc.
MAIL_SMTP_PORT=587
MAIL_SMTP_SECURE=false

# Visual branding sender defaults
MAIL_FROM_NAME=K S R College of Engineering - Placement Cell
MAIL_FROM_ADDRESS=placement-cell@ksrce.ac.in
PORTAL_URL=https://placement.ksrce.ac.in
```

---

## 2. Secure OTP Engine Architecture
A single backend route (`/api/auth/otp`) manages student, coordinator, and admin security credentials:
* **Generation**: Dispatches cryptographically secure 6-digit numeric codes.
* **Storage**: Plaintext codes are **never** stored or logged. The database stores SHA-2/bcrypt hashes.
* **Verification Rate Limiting**: Limit of 3 attempts; excessive incorrect codes delete the OTP immediately to prevent brute-forcing.
* **Resend Cooldown**: Throttles resends to once per 60 seconds with a maximum of 5 attempts.
* **Expiry**: Automatically expires and deletes codes after 5 minutes using MongoDB TTL indexing.

### Backend OTP Endpoints
1. `POST /api/auth/otp/send`
   - Request Body: `{ "email": "user@example.com", "purpose": "EMAIL_VERIFICATION", "role": "student" }`
   - Response: Returns a masked email for secure user verification (e.g., `s*********t@example.com`).
2. `POST /api/auth/otp/verify`
   - Request Body: `{ "email": "user@example.com", "otp": "123456", "purpose": "EMAIL_VERIFICATION", "role": "student" }`
   - Response: `{ "success": true, "message": "Email address verified successfully!" }`

---

## 3. Email Triggers Registry
Professional email templates render dynamically using client-safe responsive tables matching the College's role themes:
* **Student (Blue `#2085F6`)**: Verification OTPs, welcome confirmation, company drive shortlists, round qualification updates, final placement updates, certificate status reviews.
* **Coordinator (Red `#D23B42`)**: Verification OTPs, welcome confirmation, Company Drive Attendance submission summaries, Training Attendance submission summaries.
* **Admin (Green `#4EA24E`)**: Verification OTPs, welcome confirmation, copies of Drive and Training Attendance summaries finalized by coordinators.

---

## 4. Troubleshooting & Testing
Run the automated test script to verify Mongo collections, TTL indexes, hashing validation, cooldown triggers, and color rendering:

```bash
cd backend
node tests/test_mail_otp.js
```
