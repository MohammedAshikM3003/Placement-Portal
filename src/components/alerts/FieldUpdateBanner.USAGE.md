# FieldUpdateBanner - Usage Guide

## Overview
The `FieldUpdateBanner` is a notification banner that displays when a student successfully updates fields in their profile. It shows which specific fields were modified and auto-dismisses after a customizable duration.

## Features
- ✅ Displays field names that were updated
- ✅ Auto-dismisses after 5 seconds (configurable)
- ✅ Manual close button
- ✅ Smooth slide-down animation
- ✅ Responsive design
- ✅ Uses professional color scheme (#636363, #777777, #CCCCCC)

## Installation

The component is already exported from `src/components/alerts/index.js`:

```javascript
export { default as FieldUpdateBanner } from './FieldUpdateBanner';
```

## Integration into StuProfile.jsx

### Step 1: Import the Component

Add the import at the top of `StuProfile.jsx`:

```javascript
import FieldUpdateBanner from '../components/alerts/FieldUpdateBanner';
```

### Step 2: Add State Management

Add these state variables around line 358 (with other useState declarations):

```javascript
// Field Update Banner State
const [showFieldUpdateBanner, setShowFieldUpdateBanner] = useState(false);
const [updatedFieldNames, setUpdatedFieldNames] = useState([]);
const [originalFormData, setOriginalFormData] = useState(null);
```

### Step 3: Track Original Form Data

When the form is loaded, store the original data. Add this to your `useEffect` or data loading function:

```javascript
useEffect(() => {
  if (studentData) {
    // Store original form data for comparison
    setOriginalFormData({ ...studentData });
  }
}, [studentData]);
```

### Step 4: Modify the handleSave Function

Update the `handleSave` function to detect changed fields. Add this right before the success popup (around line 986):

```javascript
// Detect which fields were updated
const changedFields = [];
const fieldLabels = {
  address: 'address',
  city: 'city',
  primaryEmail: 'primary email',
  mobileNo: 'mobile number',
  fatherOccupation: 'father occupation',
  fatherMobile: 'father mobile',
  motherOccupation: 'mother occupation',
  motherMobile: 'mother mobile',
  githubLink: 'GitHub profile',
  linkedinLink: 'LinkedIn profile',
  companyPreferences: 'company preferences',
  jobLocations: 'job locations',
  arrearStatus: 'arrear status',
  tenthMarksheet: 'tenth marksheet',
  twelfthMarksheet: 'twelfth marksheet',
  diplomaMarksheet: 'diploma marksheet',
  profilePicURL: 'profile photo'
};

// Compare original and updated data
if (originalFormData) {
  Object.keys(fieldLabels).forEach(field => {
    const oldValue = originalFormData[field];
    const newValue = updatedStudentData[field];

    // Handle arrays (like companyPreferences, jobLocations)
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort())) {
        changedFields.push(fieldLabels[field]);
      }
    }
    // Handle regular values
    else if (oldValue !== newValue) {
      changedFields.push(fieldLabels[field]);
    }
  });
}

// Show field update banner if fields were changed
if (changedFields.length > 0) {
  setUpdatedFieldNames(changedFields);
  setShowFieldUpdateBanner(true);
}

// Update original form data
setOriginalFormData({ ...updatedStudentData });

// Show success popup immediately after everything is ready
setIsSaving(false);
setPopupOpen(true);
```

### Step 5: Add the Banner Component to JSX

Add the `FieldUpdateBanner` component near the top of the JSX return statement, right after the `Navbar` component:

```jsx
return (
  <div className={styles.container}>
    <Navbar onToggleSidebar={handleToggleSidebar} />

    {/* Field Update Banner */}
    <FieldUpdateBanner
      isVisible={showFieldUpdateBanner}
      onClose={() => setShowFieldUpdateBanner(false)}
      updatedFields={updatedFieldNames}
      autoCloseDuration={5000}
    />

    <div className={styles.main}>
      {/* Rest of your components */}
    </div>
  </div>
);
```

## Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isVisible` | boolean | Yes | - | Controls banner visibility |
| `onClose` | function | Yes | - | Callback when banner is dismissed |
| `updatedFields` | array | Yes | `[]` | Array of field names that were updated |
| `autoCloseDuration` | number | No | `5000` | Auto-close duration in milliseconds (0 to disable) |

## Examples

### Basic Usage

```jsx
<FieldUpdateBanner
  isVisible={showBanner}
  onClose={() => setShowBanner(false)}
  updatedFields={['profile photo', 'mobile number']}
/>
```

### With Custom Auto-Close Duration

```jsx
<FieldUpdateBanner
  isVisible={showBanner}
  onClose={() => setShowBanner(false)}
  updatedFields={['address', 'city', 'primary email']}
  autoCloseDuration={7000} // 7 seconds
/>
```

### Disable Auto-Close

```jsx
<FieldUpdateBanner
  isVisible={showBanner}
  onClose={() => setShowBanner(false)}
  updatedFields={['marksheet']}
  autoCloseDuration={0} // Won't auto-close
/>
```

## Styling

The banner uses CSS modules for styling. Default colors:
- Background: `#636363`
- Field names: `#FFFFFF` (white, bold)
- Message text: `#CCCCCC` (light gray)
- Success icon: `#4CAF50` (green)
- Close button: `#CCCCCC` (hover: `#FFFFFF`)

To customize colors, modify `FieldUpdateBanner.module.css`.

## Complete Example

```jsx
import React, { useState, useEffect } from 'react';
import FieldUpdateBanner from '../components/alerts/FieldUpdateBanner';

const StudentProfile = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [updatedFields, setUpdatedFields] = useState([]);

  const handleSaveProfile = () => {
    // ... save logic ...

    // Show banner with updated fields
    setUpdatedFields(['profile photo', 'mobile number', 'address']);
    setShowBanner(true);
  };

  return (
    <div>
      <FieldUpdateBanner
        isVisible={showBanner}
        onClose={() => setShowBanner(false)}
        updatedFields={updatedFields}
      />

      {/* Rest of your page */}
    </div>
  );
};
```

## Accessibility

- The close button has `aria-label="Close notification"` for screen readers
- Keyboard focus styles are included
- The banner auto-dismisses to avoid blocking content

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS animations are supported
- Fallback for browsers without CSS Grid

## Troubleshooting

**Banner doesn't appear:**
- Check that `isVisible` is `true`
- Verify `updatedFields` array has items
- Check z-index conflicts in your CSS

**Banner appears behind other elements:**
- The banner has `z-index: 9999`
- Ensure parent elements don't have higher z-index values

**Animation issues:**
- Check that CSS modules are properly loaded
- Verify no conflicting animation styles in global CSS
