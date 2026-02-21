# 🌍 GlobeMate — Your Smart Travel Companion

A modern, feature-rich travel planning web application built with vanilla JavaScript, Supabase authentication, and real-time APIs. Plan trips, explore countries, track currencies, manage packing lists, and more.

![GlobeMate Banner](img2.png)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Authentication System](#authentication-system)
- [Page Modules](#page-modules)
- [Styling & Design](#styling--design)
- [APIs & Integrations](#apis--integrations)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**GlobeMate** is a comprehensive travel assistant that helps travelers:
- **Plan** multi-destination trips with itineraries
- **Research** country-specific information (visa requirements, culture, currency)
- **Track** real-time currency exchange rates
- **Manage** packing lists and travel documents
- **Explore** interactive maps with location markers
- **Stay safe** with health advisories and emergency contacts

The app uses a **Single Page Application (SPA)** architecture with dynamic page loading, smooth transitions, and persistent user sessions via Supabase.

---

## ✨ Features

### 🏠 **Home Page**
- Hero section with animated gradient text
- Statistics showcase (195+ countries, 160+ currencies, 7 tools)
- Quick access buttons to Register and Log In

### 🔐 **Authentication**
- **Register**: Create new accounts with email/password or Google OAuth
- **Login**: Secure login with session persistence
- **User Profile**: Navbar displays logged-in user's name, hides Home tab
- **Logout**: Clean session management, restores default UI
- **Supabase Integration**: Backend authentication with profiles table

### 🗺️ **Trip Planner**
- Create multi-destination itineraries
- Add activities, notes, and dates for each location
- Visual timeline of your trip
- Save and manage multiple trips

### 🏳️ **Country Information**
- Search 195+ countries with autocomplete suggestions
- View comprehensive country details:
  - Capital, population, region
  - Languages, currencies
  - Flag and coat of arms
  - Time zones and calling codes
  - Driving side
- **NEW: Historical Overview** - Wikipedia API integration for country history and culture
- **NEW: Important Places to Visit** - Curated tourist attractions with images for 16 popular countries
  - Beautiful place cards with high-quality images
  - Detailed descriptions and categorization (Landmark, Museum, Nature, etc.)
  - Covers France, Japan, Italy, Spain, UK, USA, China, Egypt, India, Australia, Brazil, Germany, Canada, Mexico, Greece, Thailand
- Visa eligibility checker - Compare passport requirements between countries
- Travel advisories and entry requirements

### 🛡️ **Safety Hub**
- Health and vaccination requirements
- Emergency contact numbers (police, ambulance, embassy)
- Travel advisories and warnings
- Local laws and customs

### 🎒 **Packing List**
- Smart packing suggestions by category
- Customizable checklists
- Weather-based recommendations
- Save and share lists

### 💱 **Currency Converter**
- Real-time exchange rates for 160+ currencies
- Live conversion calculator
- Historical rate charts
- Popular currency pairs

### 📄 **Documents Manager**
- Upload and organize travel documents
- Passport, visa, insurance, tickets
- Secure cloud storage
- Quick access during travel

### 🗺️ **Interactive Maps**
- Leaflet.js integration
- Search and pin locations
- Route planning
- Points of interest

---

## 🛠️ Tech Stack

### **Frontend**
- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Flexbox, Grid, animations
- **JavaScript (ES6+)**: Modular architecture, async/await
- **Font Awesome 6**: Icon library
- **Google Fonts**: Inter, Playfair Display

### **Backend & Services**
- **Supabase**: Authentication, database (PostgreSQL)
- **REST APIs**: Country data, currency exchange rates
- **Leaflet.js**: Interactive maps

### **Build & Deployment**
- No build process required (vanilla JS)
- Static site hosting compatible
- Local development with Python HTTP server

---

## 📁 Project Structure

```
Globemate2/
├── index.html              # Main HTML entry point
├── README.md               # This file
├── ARCHITECTURE.md         # Detailed architecture documentation
├── SUPABASE_SETUP.md       # Supabase configuration guide
├── .git/                   # Version control
│
├── css/
│   └── styles.css          # All styles (3800+ lines)
│
├── js/
│   ├── app.js              # Core utilities (toast, animations)
│   ├── page-loader.js      # SPA navigation system
│   ├── auth.js             # Shared authentication utilities
│   ├── register.js         # Registration page module
│   ├── login.js            # Login page module
│   ├── home.js             # Home page module
│   ├── trip-planner.js     # Trip planning module
│   ├── country-info.js     # Country information module
│   ├── safety.js           # Safety hub module
│   ├── packing.js          # Packing list module
│   ├── currency.js         # Currency converter module
│   ├── documents.js        # Document manager module
│   └── maps.js             # Interactive maps module
│
├── pages/
│   ├── home.html           # Hero landing page
│   ├── register.html       # Registration form
│   ├── login.html          # Login form
│   ├── trip-planner.html   # Trip planning interface
│   ├── country-info.html   # Country search & details
│   ├── safety.html         # Safety information
│   ├── packing.html        # Packing checklist
│   ├── currency.html       # Currency converter
│   ├── documents.html      # Document manager
│   └── maps.html           # Map interface
│
└── img1.png - img5.jpg     # Background images & assets
```

---

## 🚀 Setup Instructions

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for local server) or any static file server
- Supabase account (for authentication features)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd Globemate2
```

### Step 2: Configure Supabase
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your **Project URL** and **Anon Key**
3. Open `index.html` and update:
   ```javascript
   window.SUPABASE_URL = 'YOUR_SUPABASE_URL';
   window.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
4. Create the `profiles` table in Supabase:
   ```sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     full_name TEXT,
     email TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
5. (Optional) Disable email confirmation for easier testing:
   - Go to **Authentication > Settings**
   - Disable "Enable email confirmations"

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions.

### Step 3: Start Local Server
```bash
# Using Python 3
python -m http.server 8000

# Then open browser to:
# http://localhost:8000
```

### Step 4: Explore the App
- Click **Register** to create an account
- Browse features via the navbar
- Test currency conversion, country search, maps, etc.

---

## 🔐 Authentication System

### Architecture
- **Shared Utility**: `js/auth.js` provides `Auth` object with:
  - `initSupabase()` - Initialize Supabase client
  - `signUp(name, email, password)` - Create new user
  - `login(email, password)` - Authenticate user
  - `logout()` - Sign out and restore UI
  - `checkSession()` - Verify existing session on page load
  - `applyLoggedInUI()` - Update navbar with user name, hide Home
  - `restoreLoggedOutUI()` - Restore default navbar

### Registration Flow
1. User clicks **Register** button on home page
2. Loads `pages/register.html` (Full Name, Email, Password fields)
3. `js/register.js` handles form submission
4. Calls `Auth.signUp()` → creates Supabase user + profile in DB
5. Updates UI: Navbar shows user name, hides Home, adds Logout
6. Redirects to **Countries** tab
7. Background: `img5.jpg` with blur overlay

### Login Flow
1. User clicks **Log In** button or switches from Register
2. Loads `pages/login.html` (Email, Password, Remember Me)
3. `js/login.js` handles form submission
4. Calls `Auth.login()` → verifies credentials
5. Updates UI same as registration
6. Redirects to **Countries** tab

### Session Persistence
- On app load (`DOMContentLoaded`), `Auth.checkSession()` runs
- If session exists, automatically applies logged-in UI
- User remains logged in across page refreshes
- Logout clears session and redirects to Home

### UI Changes When Logged In
- **Navbar Logo**: "GlobeMate" → User's name (bold)
- **Home Tab**: Hidden from navbar
- **Logout Button**: Added to navbar
- **Redirection**: Auth pages redirect to Countries if already logged in

---

## 📄 Page Modules

Each page is an independent module following this pattern:

### Module Structure
```javascript
(function () {
  'use strict';

  const ModuleName = {
    init() {
      console.log('🎯 Module loading...');
      // Setup code
    },

    cleanup() {
      console.log('Cleaning up module');
      // Teardown code
    }
  };

  // Register with PageLoader
  if (window.PageLoader) {
    window.PageLoader.registerModule('page-id', ModuleName);
  }
})();
```

### Page Loading Flow
1. User clicks navigation link with `data-tab="page-id"`
2. `PageLoader.loadPage('page-id')` called
3. Fetches `pages/page-id.html` via fetch API
4. Fades out current content (opacity 0)
5. Injects new HTML into `#content-container`
6. Fades in new content (opacity 1)
7. Calls `modules[page-id].init()` if registered
8. Updates navbar active state
9. Scrolls to top smoothly

### Home Module (`home.js`)
- No dynamic functionality (static hero page)
- Provides Register and Log In buttons

### Trip Planner (`trip-planner.js`)
- Add/remove destinations
- Date pickers for itinerary
- Activity cards with notes
- Local storage for persistence

### Country Info (`country-info.js`)
- **Search System**:
  - Real-time autocomplete with country flags
  - Searches both common and official names
  - Displays up to 8 matching suggestions
  - Click to select and display full information
- **Basic Information Display**:
  - REST API: `https://restcountries.com/v3.1/all`
  - Info cards showing: Capital, Region, Population, Languages, Currency, Timezone, Calling Code, Driving Side
  - Country flag (SVG) and official name
  - Clean grid layout (2 columns on desktop, 1 on mobile)
- **Historical Overview Section** (NEW):
  - Wikipedia REST API integration
  - Fetches country summary on selection
  - 2-3 paragraph historical and cultural context
  - Direct link to full Wikipedia article
  - Loading states and error handling
- **Important Places Section** (NEW):
  - Curated database of 64 tourist destinations
  - High-quality images from Unsplash (400x300px)
  - Place cards with image, icon overlay, description, and category badge
  - Covers 16 popular countries
  - Fallback to Wikipedia tourism information for other countries
  - Responsive grid layout with hover animations
- **Visa Eligibility Checker**:
  - Located at bottom of page for logical flow
  - Passport country selector (all 195+ countries)
  - Compares against selected destination
  - Visual status indicators (Visa-Free, Required, On Arrival)
  - Color-coded results with detailed messaging

### Currency (`currency.js`)
- Dropdown selectors for currencies
- Real-time conversion via API
- Amount input with validation
- Historical rate charts (optional)

### Safety (`safety.js`)
- Country selector
- Emergency numbers display
- Health advisories from WHO/CDC
- Travel warnings

### Packing (`packing.js`)
- Category-based checklist (clothes, electronics, documents)
- Add/remove custom items
- Check/uncheck functionality
- Save to local storage

### Documents (`documents.js`)
- File upload interface
- Document type categorization
- List view with delete options
- (Note: Actual file storage requires backend)

### Maps (`maps.js`)
- Leaflet.js map initialization
- Search box for locations
- Marker placement
- Routing between points

---

## 🎨 Styling & Design

### Design System
Located in `:root` CSS variables (`styles.css`):
```css
--primary: #3b82f6;        /* Blue */
--secondary: #8b5cf6;      /* Purple */
--success: #10b981;        /* Green */
--danger: #ef4444;         /* Red */
--dark: #0f172a;           /* Near black */
--gray-*: ...              /* Gray scale */
```

### Typography
- **Body**: Inter (400, 500, 600, 700)
- **Headings**: Playfair Display (600, 700)
- Responsive font sizes with `clamp()`

### Responsive Breakpoints
- Desktop: > 1200px
- Tablet: 768px - 1199px
- Mobile: < 768px

### Animations
- **Fade In**: Opacity 0 → 1
- **Fade In Up**: Opacity + translateY(20px → 0)
- **Scale In**: Scale 0.5 → 1
- **Gradient Shift**: Background position animation
- **Splash Screen**: Logo pulse + progress bar
- **Page Transitions**: 300ms ease

### Key Components

#### Navbar
- Fixed top, transparent on hero pages
- Scrolled state: solid white + shadow
- Mobile: Hamburger menu toggle
- Active tab indicator

#### Buttons
- `.btn-primary`: Solid blue background
- `.btn-outline`: Border only, transparent
- `.btn-lg`: Larger padding for CTAs
- Hover states with scale transform

#### Cards
- White background, rounded corners
- Box shadow for depth
- Hover: Lift effect (translateY -4px)

#### Forms
- Labels with icons
- Input focus: Blue border + shadow
- Validation states (error/success)

#### Toast Notifications
- Success: Green, checkmark icon
- Error: Red, X icon
- Info: Blue, info icon
- Auto-dismiss after 3s

---

## 🔌 APIs & Integrations

### REST Countries API
- **Endpoint**: `https://restcountries.com/v3.1/all`
- **Usage**: Comprehensive country database with 195+ countries
- **Data Retrieved**: 
  - Country names (common and official)
  - Flags (SVG format)
  - Capital cities
  - Geographic regions and subregions
  - Population statistics
  - Languages spoken
  - Currency information (name, symbol, code)
  - Calling codes (IDD)
  - Driving side (left/right)
  - Country codes (cca3, cca2)
- **Implementation**: 
  - Loaded on page init and cached for performance
  - Search functionality with autocomplete
  - Dropdown population for visa checker
- **Rate Limit**: None (free, open API)
- **Docs**: [restcountries.com](https://restcountries.com)

### Wikipedia REST API
- **Endpoint**: `https://en.wikipedia.org/api/rest_v1/page/summary/{country}`
- **Usage**: Fetches historical overview and cultural information for searched countries
- **Data Retrieved**:
  - Country summary (extract) - 2-3 paragraph overview
  - Title and page information
  - Links to full Wikipedia articles
  - Fallback: Tourism page information if main page unavailable
- **Implementation**: 
  - Async fetch when country is selected
  - Error handling with graceful fallback messages
  - Loading states with spinner animation
  - Direct link to full Wikipedia article for more details
- **Rate Limit**: Standard Wikipedia API limits (reasonable use)
- **Docs**: [wikimedia.org/api/rest_v1](https://en.wikipedia.org/api/rest_v1/)

### Image Sources (Unsplash)
- **Source**: Unsplash Image CDN
- **Usage**: High-quality tourist destination images for important places
- **Implementation**:
  - Curated image URLs for 64 popular tourist destinations
  - 400x300px optimized sizes with crop parameter
  - Fallback to placeholder if image fails to load
  - Images embedded in places database
- **Countries Covered**: France, Japan, Italy, Spain, UK, USA, China, Egypt, India, Australia, Brazil, Germany, Canada, Mexico, Greece, Thailand
- **Attribution**: Images from Unsplash (free to use)
- **Docs**: [unsplash.com](https://unsplash.com)

### Exchange Rate API (Example)
- **Endpoint**: `https://api.exchangerate-api.com/v4/latest/USD`
- **Usage**: Real-time currency conversion
- **Note**: Replace with preferred API (Fixer, Currency Layer, etc.)

### Leaflet.js
- **CDN**: `https://unpkg.com/leaflet@1.9.4/`
- **Usage**: Interactive maps with markers
- **Docs**: [leafletjs.com](https://leafletjs.com)

### Supabase
- **Purpose**: User authentication & database
- **Features Used**:
  - Auth: `auth.signUp()`, `auth.signInWithPassword()`, `auth.signOut()`
  - Database: `profiles` table with user metadata
  - Session management and persistence
- **Docs**: [supabase.com/docs](https://supabase.com/docs)

---

## 🌟 Country Information Module - Detailed Integration

### Feature Overview
The Country Information module is one of the most feature-rich sections, combining multiple APIs and data sources to provide comprehensive travel information.

### Data Flow Architecture

1. **Initial Load**
   ```javascript
   // On module init
   CountryExplorer.init()
   └── loadCountries()
       └── fetch('https://restcountries.com/v3.1/all')
           └── Cache 195+ countries locally
           └── Populate passport dropdown
   ```

2. **Country Search**
   ```javascript
   // User types in search bar
   handleSearch(query)
   └── Filter cached countries by name
   └── showSuggestions() with flags
   └── User clicks → selectCountry(code)
   ```

3. **Country Selection Triggers Three Parallel Data Loads**
   ```javascript
   selectCountry(code)
   ├── displayCountryInfo(country)        // From cached data
   ├── loadCountryHistory(country)        // Wikipedia API call
   └── loadImportantPlaces(country)       // Local database + images
   ```

### Wikipedia Integration (History Section)

**Purpose**: Provide cultural and historical context for each country

**Implementation**:
```javascript
async loadCountryHistory(country) {
  const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${country.name.common}`;
  const response = await fetch(wikiUrl);
  const data = await response.json();
  
  // Display extract (2-3 paragraph summary)
  // Show "Read more on Wikipedia" link
  // Error handling: "Historical information unavailable"
}
```

**Benefits**:
- Real-time, accurate information from Wikipedia
- Always up-to-date content
- Covers virtually every country
- Provides cultural context for travelers

### Important Places Integration

**Purpose**: Showcase must-visit tourist destinations with visual appeal

**Architecture**:
- **Curated Database**: 64 hand-picked destinations across 16 countries
- **Image Integration**: High-quality Unsplash images (400x300px)
- **Fallback System**: Wikipedia tourism page for uncovered countries

**Data Structure**:
```javascript
{
  name: "Eiffel Tower",
  description: "Iconic iron lattice tower in Paris, symbol of France",
  type: "Landmark",
  icon: "landmark",  // FontAwesome icon
  image: "https://images.unsplash.com/photo-..." // Optimized URL
}
```

**Display Features**:
- Grid layout (responsive: 3 columns → 2 → 1)
- Image cards with hover effects (scale 1.1)
- Icon overlay in top-right corner
- Category badges (Landmark, Museum, Nature, etc.)
- Loading states and error handling

**Covered Countries**:
1. **Europe**: France, Italy, Spain, UK, Germany, Greece
2. **Asia**: Japan, China, India, Thailand
3. **Americas**: USA, Canada, Brazil, Mexico
4. **Oceania**: Australia
5. **Africa**: Egypt

### Visa Checker Integration

**Purpose**: Help travelers understand entry requirements

**Implementation**:
- Compares user's passport country against destination country
- Simplified logic with extensible architecture
- Three status types: Visa-Free, Visa Required, Visa on Arrival
- Visual indicators with color coding (green, amber, blue)

**Flow**:
```javascript
checkVisa()
├── Get selected passport country
├── Get current destination country
└── getVisaRequirement(passport, destination)
    ├── Same country? → "No visa required"
    ├── Strong passport + easy destination? → "Visa-free"
    └── Default → "Visa required"
```

### Performance Optimizations

1. **Data Caching**: Countries loaded once, cached in memory
2. **Lazy Loading**: History and places only load when country selected
3. **Image Optimization**: Pre-sized URLs (400x300) reduce bandwidth
4. **Search Debouncing**: Reduces API calls during typing
5. **Error Recovery**: Graceful fallbacks prevent broken UI

### User Experience Flow

```
User Journey: Search for "Japan"
│
├─ [1] Types "jap" → Autocomplete shows Japan with flag
├─ [2] Clicks Japan → Basic info displays instantly (cached)
├─ [3] Loading spinners appear for History & Places
├─ [4] History loads (~500ms) → Wikipedia summary appears
├─ [5] Places load instantly → 4 cards: Mount Fuji, Imperial Palace, Fushimi Inari, Hiroshima
├─ [6] User scrolls down → Visa checker ready at bottom
└─ [7] Selects passport country → Instant visa status
```

### Code Organization

**Files**:
- `js/country-info.js` - Main module (520+ lines)
- `pages/country-info.html` - UI structure with new sections
- `css/styles.css` - Styling for history cards, place cards, responsive design

**Key Functions**:
- `loadCountries()` - Bootstrap REST Countries API data
- `handleSearch()` - Real-time search with suggestions
- `selectCountry()` - Orchestrates data display
- `displayCountryInfo()` - Renders basic country stats
- `loadCountryHistory()` - Wikipedia API integration
- `loadImportantPlaces()` - Places rendering with images
- `getImportantPlaces()` - Curated destination database
- `fetchPlacesFromWikipedia()` - Fallback for uncovered countries
- `checkVisa()` - Visa status determination

### Future Enhancements
- [ ] Real visa requirement database integration
- [ ] More countries in curated places database
- [ ] User reviews and ratings for places
- [ ] Save favorite destinations
- [ ] Export country information as PDF
- [ ] Weather information integration
- [ ] Cost of living comparison

---

## 🧩 Core Utilities (`app.js`)

### Toast Notifications
```javascript
showToast(message, type)
// type: 'success', 'error', 'info'
// Displays animated toast in top-right corner
```

### Page Loader System
- SPA navigation without full page reloads
- History API integration (optional)
- Module lifecycle management (init/cleanup)
- Automatic navbar state updates

### Utilities
- Theme toggle (light/dark mode) - Optional
- Local storage helpers
- Debounce/throttle functions
- Form validation helpers

---

## 🎬 Animation Enhancements

### Implemented Animations
1. **Splash Screen**: Logo pulse + loading bar
2. **Page Transitions**: Fade in/out with transform
3. **Navbar Scroll**: Transparent → solid with shadow
4. **Hero Gradient**: Animated background shift
5. **Card Hover**: Lift + shadow increase
6. **Button Interactions**: Scale + color shift
7. **Form Focus**: Border glow + shadow

### Coming Soon
- Parallax scrolling on hero
- Skeleton loading screens
- Micro-interactions on icons
- Confetti on successful registration
- Map marker animations

---

## 🤝 Contributing

### How to Contribute
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- Use ES6+ features (const, let, arrow functions, async/await)
- Follow existing module pattern
- Comment complex logic
- Keep functions small and focused
- Use semantic HTML5 tags

### Testing Checklist
- [ ] All navigation links work
- [ ] Registration creates user in Supabase
- [ ] Login persists session across refresh
- [ ] Navbar updates show user name when logged in
- [ ] Home tab hidden after login
- [ ] Logout restores default UI
- [ ] Responsive design works on mobile
- [ ] No console errors

---

## 📜 License

This project is open-source and available under the **MIT License**.

```
MIT License

Copyright (c) 2026 GlobeMate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Font Awesome** for comprehensive icon library
- **Google Fonts** (Inter, Playfair Display) for typography
- **Supabase** for authentication backend and database
- **Leaflet.js** for interactive map functionality
- **REST Countries API** for comprehensive country data
- **Wikipedia REST API** for historical and cultural information
- **Unsplash** for high-quality tourist destination images
- Open-source community for inspiration and support

---

## 📧 Contact & Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Email: support@globemate.app (example)
- Twitter: @globemateapp (example)

---

**Made with ❤️ by the GlobeMate Team**

*Happy travels! 🌍✈️*
