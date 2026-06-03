# AdultFlix Frontend

Modern, premium adult content streaming platform built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Features

✨ **Modern Premium Design**
- Ultra-dark theme with glassmorphism effects
- Smooth gradient accents and animations
- Responsive mobile-first architecture

🎬 **Content Discovery**
- Featured carousel with auto-rotation
- Trending content filtering
- Advanced search capabilities
- Content categorization (Videos, Leaks, Stories)

🎥 **Video Player**
- Full-featured HTML5 video player
- Responsive player controls
- Quality adjustment
- Playback history

❤️ **User Experience**
- Age verification gate
- Bookmark/favorite system
- Content recommendations
- Smooth page transitions

📱 **Mobile Optimized**
- Bottom navigation
- Touch-friendly controls
- Optimized video streaming
- Landscape mode support

⚡ **Performance**
- Lazy loading for images
- Skeleton loaders
- Code splitting
- Optimized bundle size

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

4. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Build

```bash
npm run build
```

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - API client
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/       # Reusable components
├── pages/           # Page components
├── services/        # API services
├── store/           # State management
├── App.tsx          # Main app component
├── index.css        # Global styles
└── main.tsx         # Entry point
```

## Features in Detail

### Homepage
- Auto-rotating featured carousel
- Latest content grid
- Trending section
- Personalized recommendations

### Watch Page
- Full-screen video player
- Content details
- Bookmark functionality
- Related content recommendations

### Trending Page
- Content filtering by type
- Real-time trending data
- Discovery algorithms
- Search functionality

### Bookmarks
- Saved favorites
- Watch later lists
- Personal collections
- Quick access

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Metrics

- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

## API Integration

The frontend communicates with the Django backend via REST API:

```
Base URL: http://localhost:8000
Endpoints:
- GET /content_app/content/
- GET /content_app/content/{id}/
```

## Future Enhancements

- [ ] User authentication & profiles
- [ ] Advanced recommendations engine
- [ ] Playlist creation
- [ ] Social sharing
- [ ] Comments & ratings
- [ ] Creator pages
- [ ] Live streaming
- [ ] Offline viewing
- [ ] Progressive Web App (PWA)
