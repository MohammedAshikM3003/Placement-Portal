# Calendar Component

This folder contains reusable calendar/date picker components for the Placement Portal application.

## Components

### DOBDatePicker

A custom date picker component designed for Date of Birth selection in forms.

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

## Design Tokens

The component uses these primary colors:
- Primary Blue: `#197AFF`
- Hover Background: `#e8eef7`
- Border Color: `#2085f6`
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
- [ ] Theme customization via props
