# 🚨 Alert System Migration Guide

## 📁 New Alert System Structure

```
src/components/alerts/
├── SuccessAlert.js      # Green success alerts
├── ErrorAlert.js        # Red error alerts  
├── ConfirmAlert.js      # Orange confirmation dialogs
├── InfoAlert.js         # Blue information alerts
├── AlertStyles.css      # Unified styling
├── AlertExample.js      # Usage examples
└── index.js            # Exports + useAlert hook
```

## 🔄 Migration Steps

### Step 1: Replace Old Popup Components

**Before (Old Way):**
```javascript
// Multiple popup components scattered across files
const SuccessPopup = ({ isOpen, onClose }) => {
  // Custom popup code...
};
```

**After (New Way):**
```javascript
import { SuccessAlert, useAlert } from '../components/alerts';

const MyComponent = () => {
  const { alerts, showSuccess, closeAlert } = useAlert();
  
  return (
    <>
      <button onClick={() => showSuccess("Saved!", "Profile updated successfully")}>
        Save Profile
      </button>
      
      <SuccessAlert
        isOpen={alerts.success.isOpen}
        onClose={() => closeAlert('success')}
        title={alerts.success.title}
        message={alerts.success.message}
      />
    </>
  );
};
```

### Step 2: Files to Update

**High Priority Files:**
1. `src/Student Pages/StuProfile.js` - Has multiple popup components
2. `src/Student Pages/achievements.js` - Has success/error popups
3. `src/MainRegistration.js` - Has registration popups
4. `src/Student Pages/resume.js` - Has upload popups

**Medium Priority Files:**
1. `src/Coordinator Pages/Profile.js`
2. `src/MainSingUp.js`
3. `src/Student Pages/PopupAchievements.js`

### Step 3: Usage Examples

**Success Alert:**
```javascript
showSuccess("Profile Saved!", "Your changes have been saved successfully.");
```

**Error Alert:**
```javascript
showError("Upload Failed", "File size too large. Maximum 500KB allowed.");
```

**Confirmation Dialog:**
```javascript
showConfirm(
  "Delete Item", 
  "Are you sure you want to delete this?",
  () => {
    // Delete logic here
    showSuccess("Deleted!", "Item removed successfully.");
  }
);
```

**Info Alert:**
```javascript
showInfo("File Requirements", "Only JPG files are accepted for profile pictures.");
```

## 🎨 Benefits of New System

✅ **Consistent Design** - All alerts look the same
✅ **Reusable Components** - No code duplication
✅ **Easy to Maintain** - Single source of truth
✅ **Better UX** - Smooth animations and transitions
✅ **Type Safety** - Standardized props
✅ **Mobile Responsive** - Works on all screen sizes

## 📋 Migration Checklist

- [ ] Update StuProfile.js to use new alerts
- [ ] Update achievements.js to use new alerts
- [ ] Update MainRegistration.js to use new alerts
- [ ] Update resume.js to use new alerts
- [ ] Remove old popup components
- [ ] Test all alert functionality
- [ ] Update CSS imports

## 🚀 Quick Start

1. **Import the alerts:**
```javascript
import { SuccessAlert, ErrorAlert, useAlert } from '../components/alerts';
```

2. **Use the hook:**
```javascript
const { alerts, showSuccess, showError, closeAlert } = useAlert();
```

3. **Show alerts:**
```javascript
showSuccess("Title", "Message");
showError("Error Title", "Error message");
```

4. **Render alerts:**
```javascript
<SuccessAlert
  isOpen={alerts.success.isOpen}
  onClose={() => closeAlert('success')}
  title={alerts.success.title}
  message={alerts.success.message}
/>
```
