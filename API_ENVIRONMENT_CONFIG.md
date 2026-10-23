# API Environment Configuration - Summary

This document summarizes the changes made to make the frontend's API calls environment-aware and CORS-friendly.

## Overview

The frontend now automatically detects its environment and routes all API calls to the appropriate backend URL. No build step, environment files, or manual configuration is needed—the detection runs directly in the browser based on `window.location`.

## Environment Detection

### Base URLs by Environment

| Environment            | Frontend URL                    | Backend URL                                 | Detection                  |
| ---------------------- | ------------------------------- | ------------------------------------------- | -------------------------- |
| **Local Development**  | `http://localhost:3000`         | `http://localhost:3001`                     | Port 3000 detected         |
| **Staging/Preview**    | `http://localhost:3002`         | `https://api-staging.kickedoutofthesky.com` | Port 3002 detected         |
| **Preview Deployment** | `https://*.vercel.app`          | `https://api-staging.kickedoutofthesky.com` | Vercel domain detected     |
| **Production**         | `https://kickedoutofthesky.com` | `https://api.kickedoutofthesky.com`         | Production domain detected |

### Override Mechanism

You can override the API endpoint temporarily via URL parameter or sessionStorage:

- **URL parameter:** `?api=local` (stays active until cleared)
- **sessionStorage:** `sessionStorage.getItem('apiTarget')`
- **Supported values:** `local`, `staging`, `prod`

Example: `http://localhost:3000/?api=staging` will route to the Vercel API even when running locally.

## Files Changed

### 1. [store/js/api-config.js](store/js/api-config.js)

**Purpose:** Centralized environment detection and base URL configuration

**Changes:**

- Uses the Vercel-hosted custom domains `https://api.kickedoutofthesky.com` (prod) and `https://api-staging.kickedoutofthesky.com` (staging); base URLs exclude the `/api` prefix
- Removed the non-existent `kickedoutofthesky-store.vercel.app` URL
- Added better documentation with clear environment-to-URL mappings
- Ensures no trailing slashes on the base URL
- URL parameter and sessionStorage override mechanism unchanged

**Base URL set to:** `window.__API_URL__` (globally available)

### 2. [store/js/cart-display.js](store/js/cart-display.js)

**API Endpoints:** 2 calls (plus local country list)

#### a) `loadCountries()` - no API call

- Country list now comes from the local `COUNTRY_NAMES` map in `js/allowed-countries.js`; the backend has no `/api/allowed-countries` endpoint.

#### b) `calculateShippingEstimate()` - POST /api/calculate-shipping

- **Line:** ~122
- **Changes:**
  - Uses `window.__API_URL__` (no fallback)
  - Keeps `method: "POST"` and JSON body
  - Headers: only `Content-Type: application/json` (no custom headers)
  - Improved error logging with endpoint name and status code
  - Reads JSON error body and logs it

#### c) `proceedToCheckout()` - POST /api/create-checkout-session

- **Line:** ~442
- **Changes:**
  - Uses `window.__API_URL__` (no fallback)
  - Keeps `method: "POST"` and JSON body
  - Headers: only `Content-Type: application/json` (no custom headers)
  - Enhanced error handling with logging
  - Preserved specific error cases (e.g., 422 unsupported_destination)
  - Improved error console messages

### 3. [store/js/order-status.js](store/js/order-status.js)

**API Endpoints updated:** 1 call

#### `handleSearch()` - GET /api/order-status

- **Line:** ~153
- **Changes:**
  - Uses `window.__API_URL__` (no fallback)
  - Added `method: "GET"` for clarity
  - Added only necessary header: `Content-Type: application/json`
  - Improved error logging with endpoint name and status code
  - Error messages include status and endpoint info

## CORS Compliance

All changes follow CORS best practices to prevent preflight request failures:

### ✅ Headers

- **Only** `Content-Type: application/json` is sent (for JSON POST/PUT bodies)
- No custom headers (like `X-*` or `Authorization`) unless needed
- No `credentials: 'include'` anywhere (cookies not used)
- No `mode: 'no-cors'` anywhere

### ✅ URL Handling

- Base URL has no trailing slash
- Endpoint paths start with `/` (e.g., `/api/calculate-shipping`)
- Results in clean URLs like `https://api.kickedoutofthesky.com/api/calculate-shipping`
- No double slashes, no protocol mismatches

### ✅ Error Handling

Every API call now includes proper error handling:

- Checks `response.ok` before processing data
- Reads JSON error body from non-OK responses
- Logs errors to console with endpoint name and status code
- Format: `API error (METHOD /endpoint): STATUS - error message`
- Example: `API error (POST /api/create-checkout-session): 422 - unsupported_destination`

## API Calls Not Changed

The following calls were **not modified** because they fetch static data, not our backend API:

- `store/js/cart-display.js`: `fetch("./data/products.json")`
- `store/js/order-status.js`: `fetch("./data/products.json")`
- `js/navbar-loader.js`: `fetch("/navbar.html")`
- `js/releases.js`: `fetch("/data/releases.json")`

Third-party scripts (Stripe.js, Printful embeds) were also left untouched.

## How It Works

### 1. Configuration Load (On every page load)

```javascript
// store/js/api-config.js runs first in <head>
// Detects window.location and sets window.__API_URL__
```

### 2. API Calls (In cart-display.js, order-status.js)

```javascript
const backendUrl = window.__API_URL__; // Always defined
const response = await fetch(`${backendUrl}/api/order-status?sessionId=...`);
```

### 3. Error Logging (After each API call)

```javascript
if (!response.ok) {
  const data = await response.json();
  console.error(`API error (GET /api/order-status): ${response.status} - ${data.error}`);
}
```

## Testing

### Local Development (Port 3000)

```bash
npm run dev
# Frontend: http://localhost:3000
# API calls to: http://localhost:3001
```

### Staging Locally (Port 3002)

```bash
# Start frontend on port 3002 manually, then:
# Frontend: http://localhost:3002
# API calls to: https://api-staging.kickedoutofthesky.com
```

### Override Local to Use Staging API

```bash
# At http://localhost:3000/?api=staging
# Frontend: http://localhost:3000
# API calls to: https://api-staging.kickedoutofthesky.com
```

### Production

```bash
# Frontend: https://kickedoutofthesky.com
# API calls to: https://api.kickedoutofthesky.com
```

## Backend Requirements

The backend (`https://api.kickedoutofthesky.com`) must:

1. **Accept CORS preflight requests** (OPTIONS)
   - Respond with appropriate `Access-Control-Allow-*` headers

2. **Not require redirects** for requests
   - Redirects break CORS preflight and cause browser to reject the request

3. **Respond to clean URLs** (no trailing slashes)
   - `https://api.kickedoutofthesky.com/api/calculate-shipping` ✅
   - NOT `https://api.kickedoutofthesky.com/api/calculate-shipping/` ❌

4. **Return proper HTTP status codes**
   - 200/201 for success
   - 400/422 for validation errors
   - 404 for not found
   - etc.

5. **Include error details in JSON response**
   - `{ "error": "message" }` or `{ "message": "description" }`
   - Both formats are handled by our error logging

## Debugging

### Check which API endpoint is in use

Open browser console and type:

```javascript
console.log(window.__API_URL__);
// Output: http://localhost:3001
// or: https://api.kickedoutofthesky.com
```

### See API errors as they happen

All API errors are logged to the browser console with the pattern:

```
API error (METHOD /endpoint): STATUS - error message
```

Monitor Network tab in DevTools to see:

- Actual request URLs
- Headers sent
- Response status and body
- CORS preflight (OPTIONS) requests

### Force a different backend temporarily

```javascript
// In browser console:
sessionStorage.setItem("apiTarget", "local");
location.reload();
// Now all APIs route to http://localhost:3001

// Clear override:
sessionStorage.removeItem("apiTarget");
location.reload();
```

## Summary of Key Improvements

✅ **Centralized configuration** - Single source of truth for API URLs  
✅ **Environment-aware** - Automatic detection, no build step needed  
✅ **CORS-compliant** - No double slashes, no unnecessary headers, no mode: 'no-cors'  
✅ **Better error handling** - All API errors logged with endpoint and status info  
✅ **Clean URL structure** - Base URL without trailing slashes  
✅ **Maintainable** - Easy to change API endpoints in one place  
✅ **Backward compatible** - Existing functionality preserved

## Questions?

Refer to:

- [ENVIRONMENTS.md](ENVIRONMENTS.md) - Overall environment strategy
- [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) - Local development setup
- [PRODUCTION_ENVIRONMENT.md](PRODUCTION_ENVIRONMENT.md) - Production setup
