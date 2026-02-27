# GlobeMate - Modular Architecture Documentation

## Overview
The GlobeMate application is built as a **Single Page Application (SPA)** using a modular vanilla JavaScript architecture. All navbar sections have separate HTML and JavaScript files. User authentication is handled by **Firebase Authentication** (compat v9 SDK) and user profile data is stored in **Cloud Firestore**.

## File Structure

```
Globemate2/
├── index.html              # Main entry point (navbar, footer, Firebase config, script tags)
├── css/
│   └── styles.css          # Global styles
├── js/
│   ├── app.js              # Core app (splash screen, utilities, toast notifications)
│   ├── page-loader.js      # Dynamic page loading system
│   ├── auth.js             # Shared Firebase Auth + Firestore utilities (Auth object)
│   ├── login.js            # Login page module
│   ├── register.js         # Registration page module
│   ├── home.js             # Home/Hero page module
│   ├── trip-planner.js     # Trip Planner module
│   ├── country-info.js     # Country Explorer module
│   ├── safety.js           # Safety Center module
│   ├── packing.js          # Packing List module
│   ├── currency.js         # Currency Converter module
│   ├── documents.js        # Document Storage module
│   └── maps.js             # Maps Explorer module
└── pages/
    ├── home.html           # Home/Hero section HTML
    ├── login.html          # Login form HTML
    ├── register.html       # Registration form HTML
    ├── trip-planner.html   # Trip Planner section HTML
    ├── country-info.html   # Country Info section HTML
    ├── safety.html         # Safety section HTML
    ├── packing.html        # Packing section HTML
    ├── currency.html       # Currency section HTML
    ├── documents.html      # Documents section HTML
    └── maps.html           # Maps section HTML
```

## How It Works

### 1. Page Loading System (`page-loader.js`)
- Dynamically loads HTML from `pages/` folder
- Manages page transitions with fade effects
- Calls module initialization (`init()`) when page loads
- Calls module cleanup (`cleanup()`) when leaving page
- Handles navigation via `data-tab` attributes

### 2. Module Structure
Each JavaScript module follows this pattern:

```javascript
(function() {
  'use strict';
  
  const ModuleName = {
    init() {
      // Initialize module when page loads
      this.bindEvents();
      this.loadData();
    },

    bindEvents() {
      // Attach event listeners
    },

    loadData() {
      // Load data from localStorage or APIs
    },

    cleanup() {
      // Clean up before leaving page
    }
  };

  // Expose to global scope
  window.ModuleName = ModuleName;

  // Register with PageLoader
  if (typeof PageLoader !== 'undefined') {
    PageLoader.registerModule('page-id', ModuleName);
  }
})();
```

### 3. Navigation Flow
1. User clicks nav link with `data-tab="page-id"`
2. PageLoader intercepts click
3. Calls `cleanup()` on current module
4. Fetches `pages/page-id.html`
5. Injects HTML into `#content-container`
6. Calls `init()` on new module
7. Updates active nav link styling

---

## Firebase Authentication & Firestore

### SDK Loading
The Firebase compat v9 SDK is loaded in `index.html` via CDN before any app scripts:
```html
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
```
The project config is declared as `window.FIREBASE_CONFIG` immediately after.

### Auth Object (`js/auth.js`)
`auth.js` exports a single IIFE-based `Auth` module attached to `window.Auth`. It is the **only** file that talks to Firebase directly. All other modules call `Auth.*` methods.

| Method | Firebase API Used | Notes |
|---|---|---|
| `initFirebase()` | `firebase.initializeApp()` | Called once on script load; no-op if already init |
| `checkSession()` | `onAuthStateChanged` | Wrapped in a Promise; unsubscribes after first event |
| `signUp(name, email, password)` | `createUserWithEmailAndPassword` + `updateProfile` | Firestore profile write is **fire-and-forget** |
| `login(email, password)` | `signInWithEmailAndPassword` | Synchronous credential check |
| `signInWithGoogle()` | `signInWithPopup(GoogleAuthProvider)` | Firestore upsert is **fire-and-forget** |
| `logout()` | `auth.signOut()` | Clears IndexedDB session, restores UI |
| `applyLoggedInUI()` | — | DOM-only; no Firebase call |
| `restoreLoggedOutUI()` | — | DOM-only; no Firebase call |

### Firestore Data Model
```
Firestore
└── profiles/          (collection)
    └── {uid}            (document — keyed by Firebase Auth UID)
        ├── full_name: string
        ├── email: string
        └── created_at: ISO 8601 string
```
The write happens **asynchronously after** the Auth credential is resolved, so the UI never waits for Firestore.

### Session Persistence
Firebase Auth uses `IndexedDB` (browser-native) for session persistence by default. On cold load:
1. `Auth.initFirebase()` runs synchronously when `auth.js` is parsed
2. `DOMContentLoaded` triggers `Auth.checkSession()`
3. `onAuthStateChanged` fires once with the cached user (or `null`)
4. UI is updated before the first page module initialises

### Authentication Flow Diagram
```
User submits form
       │
       ▾
  Auth.signUp() / Auth.login()
       │
       ▾
  firebase.auth().create* / signIn*  ◄── Network call to Firebase
       │
       ▾
  credential.user ← currentUser cached in module closure
       │
       ▾
  [fire-and-forget] Firestore profiles/{uid}.set()
       │
       ▾
  Auth.applyLoggedInUI()  ◄─── Synchronous DOM update
       │
       ▾
  PageLoader.loadPage('country-info')  after 300ms toast
```

## Benefits of Modular Architecture

### ✅ Easier Debugging
- Each section's code is isolated in its own file
- Issues with one module don't affect others
- Clear separation of concerns

### ✅ Better Maintainability
- Find and edit specific features quickly
- Add new sections without modifying existing code
- Remove sections by deleting files

### ✅ Improved Performance
- Only load necessary JavaScript
- Proper cleanup prevents memory leaks
- Lazy initialization for heavy features (maps)

### ✅ Team Collaboration
- Multiple developers can work on different modules
- Reduced merge conflicts
- Clear file ownership

## API Usage

### Trip Planner Module
```javascript
TripPlanner.init()           // Initialize module
TripPlanner.saveTrip()       // Save new trip
TripPlanner.deleteTrip(id)   // Delete trip by ID
TripPlanner.viewTrip(id)     // View trip details
```

### Country Explorer Module
```javascript
CountryExplorer.init()                  // Initialize module
CountryExplorer.selectCountry(code)     // Load country by code
CountryExplorer.checkVisa()             // Check visa requirements
```

### Safety Center Module
```javascript
SafetyCenter.init()                     // Initialize module
SafetyCenter.checkSafety()              // Get safety info for country
```

### Packing List Module
```javascript
PackingList.init()                      // Initialize module
PackingList.generateList()              // Generate packing list
PackingList.toggleItem(id)              // Toggle item check status
```

### Currency Converter Module
```javascript
CurrencyConverter.init()                // Initialize module
CurrencyConverter.convert()             // Convert currencies
CurrencyConverter.swap()                // Swap from/to currencies
CurrencyConverter.fetchRates()          // Update exchange rates
```

## Common Patterns

### Saving Data to LocalStorage
```javascript
const data = { /* your data */ };
localStorage.setItem('globemateKey', JSON.stringify(data));
```

### Loading Data from LocalStorage
```javascript
const saved = localStorage.getItem('globemateKey');
const data = saved ? JSON.parse(saved) : [];
```

### Showing Toast Notifications
```javascript
showToast('Success message', 'success');
showToast('Error message', 'error');
showToast('Info message', 'info');
// Global helper defined in app.js — no namespace required
```

## Troubleshooting

### Issue: Page not loading
**Solution:** Check that HTML file exists in `pages/` folder with correct name matching `data-tab` attribute.

### Issue: Module not initializing
**Solution:** Ensure module is registered with PageLoader and script is loaded in index.html.

### Issue: Events not working after page switch
**Solution:** Re-attach event listeners in module's `init()` method, not globally.

### Issue: Data persisting between pages
**Solution:** Implement proper `cleanup()` method to reset module state.

## Future Enhancements

- [ ] Add webpack/bundler for optimised builds
- [ ] Implement code splitting for better performance
- [ ] Add TypeScript for type safety
- [ ] Create unit tests for each module
- [ ] Add service worker for offline support
- [ ] Implement proper routing with URL hash/history API
- [ ] Firestore security rules — lock `profiles/{uid}` to authenticated owner
- [ ] Firebase Analytics integration for usage tracking

## Migration Notes

### Old Structure → New Structure
- `index.html` (monolithic) → `pages/*.html` (modular)
- `app.js` (all code) → `js/*-module.js` (separated)
- TabNav system → PageLoader system
- Manual tab switching → Automatic page loading
- Supabase Auth/PostgreSQL → **Firebase Authentication + Cloud Firestore**

### Breaking Changes
- `data-tab="hero"` is now `data-tab="home"`
- Old module references (e.g., direct calls in app.js) won't work
- Must use new module pattern with `init()` and `cleanup()`

## Support

For issues or questions about the modular architecture:
1. Check this documentation
2. Review module code in `js/` folder
3. Inspect PageLoader logic in `js/page-loader.js`
4. Test in browser console using `window.ModuleName` to debug

---

**Last Updated:** 2026  
**Version:** 2.0 (Modular Architecture)
