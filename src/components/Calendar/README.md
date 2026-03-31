# Calendar Components

This folder contains reusable calendar/date picker components for the Placement Portal application.

## Components

### DOBDatePicker

A custom date picker component designed for Date of Birth selection in forms with blue theme.

#### Features
- **Three View Modes**: Day, Month, and Year selection
- **Portal-based Overlay**: Renders in a full-screen overlay for better positioning
- **Custom Scrollbar**: Year selection view has a custom scrollbar for better UX
- **Interactive States**: Hover effects and visual feedback on all interactive elements
- **Today Highlighting**: Current date is highlighted with a border
- **Responsive Design**: Adapts to different screen sizes (min-width: 320px, max 90vw)
- **Keyboard-friendly**: Click outside to close, proper focus management

#### Usage

```jsx
import DOBDatePicker from './components/Calendar/DOBDatePicker';

function MyForm() {
  const [dob, setDob] = useState('');

  return (
    <DOBDatePicker
      value={dob}
      onChange={setDob}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | The selected date in `YYYY-MM-DD` format |
| `onChange` | `function` | Callback function called when date is selected, receives date string in `YYYY-MM-DD` format |

#### Display Format

- **Input Display**: DD-MM-YYYY
- **Value Format**: YYYY-MM-DD (ISO format for easy backend integration)

#### Styling

The component uses inline styles and doesn't require any external CSS files. It uses the Poppins font family which should be available in your project.

#### Year Range

Currently supports years from 2000 to the current year. This can be modified in the component if needed.

### Ad_Calendar

A themed date picker component for Admin pages with green color scheme (#4EA24E).

#### Features
- Same features as DOBDatePicker
- **Admin Theme**: Green color scheme matching admin dashboard
- **Header Color**: #4EA24E
- **Hover Effects**: Light green (#e8f5e8)
- Portal-based overlay with full-screen backdrop

#### Usage

```jsx
import { Ad_Calendar } from './components/Calendar';

function AdminForm() {
  const [date, setDate] = useState('');

  return (
    <Ad_Calendar
      value={date}
      onChange={setDate}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | The selected date in `YYYY-MM-DD` format |
| `onChange` | `function` | Callback function called when date is selected |

### Coo_Calendar

A themed date picker component for Coordinator pages with red color scheme (#D23B42).

#### Features
- Same features as DOBDatePicker
- **Coordinator Theme**: Red color scheme matching coordinator dashboard
- **Header Color**: #D23B42
- **Hover Effects**: Light red (#fce8e9)
- Portal-based overlay with full-screen backdrop

#### Usage

```jsx
import { Coo_Calendar } from './components/Calendar';

function CoordinatorForm() {
  const [date, setDate] = useState('');

  return (
    <Coo_Calendar
      value={date}
      onChange={setDate}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | The selected date in `YYYY-MM-DD` format |
| `onChange` | `function` | Callback function called when date is selected |

## Design Tokens

### DOBDatePicker (Blue Theme)
- Primary Blue: `#197AFF`
- Hover Background: `#e8eef7`
- Border Color: `#2085f6`
- Light Background: `#f9fbff`
- Border Gray: `#dde6f4`
- Text Colors: `#333`, `#888`, `#9aa7c2`

### Ad_Calendar (Admin Green Theme)
- Primary Green: `#4EA24E`
- Hover Background: `#e8f5e8`
- Border Color: `#4EA24E`
- Light Background: `#f9fbff`
- Border Gray: `#dde6f4`
- Text Colors: `#333`, `#888`, `#9aa7c2`

### Coo_Calendar (Coordinator Red Theme)
- Primary Red: `#D23B42`
- Hover Background: `#fce8e9`
- Border Color: `#D23B42`
- Light Background: `#f9fbff`
- Border Gray: `#dde6f4`
- Text Colors: `#333`, `#888`, `#9aa7c2`

## Future Enhancements

Potential improvements that could be made:
- [ ] Configurable year range (start/end year as props)
- [ ] Min/max date validation
- [ ] Disable specific dates
- [ ] Locale support for different date formats
- [ ] Month/Year navigation arrows
- [ ] Keyboard navigation (arrow keys)
- [x] Theme customization (✓ Implemented: Admin Green and Coordinator Red)
- [ ] Student theme variant
- [ ] Dark mode support

## Theme Usage Guide

Choose the appropriate calendar component based on the user role:

- **Student Forms**: Use `DOBDatePicker` (Blue theme - default)
- **Admin Pages**: Use `Ad_Calendar` (Green theme - #4EA24E)
- **Coordinator Pages**: Use `Coo_Calendar` (Red theme - #D23B42)

All calendars have the same API and functionality - only the visual theming differs.
