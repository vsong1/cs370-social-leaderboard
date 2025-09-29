# Squad Score - Leaderboard Website
A modern, responsive leaderboard website with a gaming aesthetic and dark theme.

## Features

- **Modern Design**: Dark theme with gaming-inspired colors and typography
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Navigation**: Smooth transitions and hover effects
- **Typography**: Uses Orbitron font for gaming feel and Inter for readability
- **Accessibility**: Keyboard navigation support and semantic HTML

## Color Scheme

- **Background**: `#1A202C` (Dark blue-gray)
- **Primary Text**: `#F5F1ED` (White)
- **Squad Accent**: `#F88824` (Orange)
- **Score Accent**: `#A7F2B6` (Green)
- **Button Border**: `#FF5BCE` (Pink)
- **Active States**: `#A7F2B6` (Green)

## Getting Started

### Prerequisites

- Node.js (optional, for development server)
- Modern web browser

### Installation

1. Clone or download the project files
2. Navigate to the project directory
3. (Optional) Install dependencies:
   ```bash
   npm install
   ```

### Running the Project

#### Option 1: Direct File Opening
Simply open `index.html` in your web browser.

#### Option 2: Development Server
```bash
# Start development server with live reload
npm run dev

# Or use a simple static server
npm start
```

The website will be available at `http://localhost:3000`

## Project Structure

```
squad-score-website/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
├── package.json        # Project configuration
└── README.md          # This file
```

## Customization

### Changing Colors
Edit the CSS variables in `styles.css` to match your brand colors:

```css
:root {
  --bg-primary: #1A202C;
  --text-primary: #ffffff;
  --accent-orange: #F6AD55;
  --accent-green: #68D391;
  --accent-pink: #ED64A6;
}
```

### Adding Pages
1. Create new HTML files for additional pages
2. Update navigation links in `index.html`
3. Add corresponding JavaScript functionality in `script.js`

### Modifying Content
- Edit the welcome message in `index.html`
- Change navigation items in the `.nav-links` section
- Update the greeting text in `.nav-greeting`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Leaderboards page with dynamic data
- User authentication system
- Real-time score updates
- Squad management features
- User profile pages
- Mobile app integration

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
