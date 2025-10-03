# Placement Portal

A React-based placement portal application with multiple views and navigation.

## Features

- **Login System**: Secure login with email and password
- **Dashboard**: Main dashboard with overview cards
- **Resume Management**: Upload, preview, and manage resumes
- **Attendance Tracking**: View attendance statistics and details
- **Achievements**: Upload and manage certificates/achievements
- **Navigation**: Seamless navigation between all views
- **Logout**: Secure logout functionality

## Fixed Issues

### Navigation Issues
1. **App.js**: Added proper routing for all views including achievements
2. **Dashboard.js**: Fixed sidebar navigation to use consistent view names
3. **Resume.js**: Updated navigation to handle all sidebar items properly
4. **Attendance.js**: Fixed navigation to use consistent view names
5. **Achievements.js**: Fixed navigation and corrected import path

### Asset Issues
1. **Missing Assets**: Created placeholder files for missing assets:
   - `logo.png`
   - `PlacementPortalicon.png`
   - `uploadcerti.png`
   - `editlogo.png`
   - `uploadicon.png`

### Import Issues
1. **PopupAchievements.js**: Fixed typo in import path from `popupArchievement .js` to `PopupAchievements.js`

## How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Access Application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Navigation Flow

1. **Login**: Enter any email and password to login
2. **Dashboard**: Default view after login
3. **Sidebar Navigation**: Click on any sidebar item to navigate:
   - Dashboard
   - Resume
   - Attendance
   - Achievements
   - Company
   - Profile
4. **Logout**: Click logout button to return to login screen

## File Structure

```
src/
├── App.js                 # Main application component with routing
├── mainlogin.js          # Login page
├── dashboard.js          # Dashboard view
├── resume.js            # Resume management view
├── Attendance.js        # Attendance tracking view
├── Achievements.js      # Achievements management view
├── PopupAchievements.js # Achievement upload popup
└── assets/              # Image assets
```

## Dependencies

- React 19.1.0
- Material-UI 7.2.0
- React Icons 5.5.0
- React Scripts 5.0.1

## Notes

- All placeholder assets should be replaced with actual images in production
- The application uses console logging for debugging navigation
- All views are now properly connected and navigable
- Logout functionality works across all views

##Figma

https://www.figma.com/design/UyHXeAFXWMxpfhbwXe3QvU/Placement-portal-grid?node-id=0-1&t=xCF2roKj5kssZkTO-1

##Refrence site

https://ce.ksrei.org/2026/

##Mobile Version
https://3nt11rs0-3000.inc1.devtunnels.ms/
