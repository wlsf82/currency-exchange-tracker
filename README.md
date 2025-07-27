# 💱 Currency Exchange Tracker

A modern Progressive Web App (PWA) for real-time currency exchange rate tracking between Brazilian Real (BRL), Euro (EUR), and US Dollar (USD).

![Currency Exchange Tracker](src/icons/icon-192x192.png)

## ✨ Features

### 📊 **Single Currency View**

- Real-time exchange rates for selected base currency
- Live rate changes with percentage indicators
- 24h statistics including high, low, and volatility
- Auto-refresh every 30 seconds
- Clean, responsive interface

### 📈 **Comparison View**

- Side-by-side comparison of all three currencies
- Interactive currency selection with checkboxes
- Consolidated rate overview
- Simultaneous updates for multiple currencies

### 💱 **Currency Converter**

- Real-time currency conversion
- Support for all three currencies (BRL, EUR, USD)
- Instant calculation as you type
- Uses live exchange rates

### 🔄 **Progressive Web App Features**

- **Offline Support**: Works without internet connection using cached data
- **Install to Home Screen**: Add to your device like a native app
- **Service Worker**: Background updates and caching
- **Responsive Design**: Optimized for mobile, tablet, and desktop

## 🚀 Getting Started

### Prerequisites

- Modern web browser with JavaScript enabled
- Internet connection for live rates (offline mode available)

### PWA Installation

- **Chrome/Edge**: Click the install button in the address bar
- **Safari**: Add to Home Screen from the share menu
- **Firefox**: Look for the install prompt or use "Add to Home Screen"

## 🛠️ Technical Stack

### Frontend

- **HTML5**: Semantic markup with PWA meta tags
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **Vanilla JavaScript**: ES6+ features, async/await, classes
- **Progressive Web App**: Service Worker, Web App Manifest

### APIs

- **Primary**: [ExchangeRate-API](https://api.exchangerate-api.com)
- **Fallback**: FXRatesAPI
- **Offline**: Service Worker cached data when available

### Architecture

- **Client-side only**: No backend required
- **Modular design**: Separation of concerns with clear class structure
- **Event-driven**: Real-time updates and user interactions

## 📁 Project Structure

```
src/
├── index.html          # Main HTML file with app structure
├── app.js              # Core application logic and API handling
├── styles.css          # Complete CSS styling with responsive design
├── manifest.json       # PWA manifest configuration
├── sw.js              # Service Worker for offline functionality
├── favicon.svg        # Scalable app icon
└── icons/             # PWA icons in multiple sizes
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-180x180.png
    ├── icon-192x192.png
    └── icon-512x512.png
```

## 🎨 Design Features

### Color Scheme

- **BRL (Brazilian Real)**: Light Green (`#28a745`)
- **EUR (Euro)**: Blue (`#4a90e2`)
- **USD (US Dollar)**: Dark Green (`#00875f`)
- **Dark Theme**: Professional dark interface with high contrast

### Responsive Design

- **Mobile-first**: Optimized for smartphones and tablets
- **Adaptive Layout**: Flexible grid system
- **Touch-friendly**: Large buttons and intuitive interactions

### Visual Elements

- **Currency Flags**: Unicode flag emojis for visual identification
- **Rate Changes**: Color-coded positive/negative indicators
- **Loading States**: Visual feedback for data fetching
- **Status Indicators**: Connection and update status

## 🔧 Configuration

### API Configuration

The app uses multiple API endpoints for reliability:

```javascript
{
  baseUrl: 'https://api.exchangerate-api.com/v4/latest/',
  fallbackUrl: 'https://api.fxratesapi.com/latest?base='
}
```

**Error Handling:**

- If primary API fails, attempts fallback API
- If both APIs fail, displays clear error message
- No static fallback rates - always uses live data when available
- Offline functionality relies on Service Worker cached data

### Update Frequency

- **Auto-refresh**: Every 30 seconds
- **Manual refresh**: Available via update button
- **Background updates**: When app becomes visible

## 🌐 Browser Support

### Fully Supported

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### PWA Features

- Service Worker support
- Web App Manifest support
- Add to Home Screen capability

## 📱 Mobile Experience

- **Responsive design** adapts to all screen sizes
- **Touch-optimized** interface elements
- **PWA installation** for native app experience
- **Offline functionality** for uninterrupted usage
- **Fast loading** with optimized assets

## 🔒 Privacy & Security

- **No data collection**: All processing happens locally
- **No user tracking**: Privacy-focused design
- **HTTPS required**: Secure connections only
- **CSP headers**: Content Security Policy protection

## 🚀 Performance

- **Lightweight**: Minimal dependencies
- **Fast loading**: Optimized assets and caching
- **Offline support**: Service Worker caching
- **Efficient updates**: Only fetch when needed

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Attribution

- Exchange rates provided by [ExchangeRate-API](https://exchangerate-api.com)
- Icons and design created specifically for this project
- Built with modern web standards and best practices

---

Enjoy tracking currency exchange rates! 💱
