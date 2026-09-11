# Release Landing Pages — Implementation Guide

## Overview

Added three release routes with analytics pixel tracking, social media optimization, and consent-gated event firing:

- **`/listen/`** — Rotating current release (updates by changing one pointer)
- **`/[slug]/`** — Permanent release pages (e.g., `/betterpartofme/`)
- **`/presave.html`** — Plain redirect to `/listen` (no analytics pixel fires here)

---

## Files Created

### Data & Configuration

- **[`data/releases.json`](data/releases.json)** — Central release store with array of releases and current pointer

### Pages

- **[`listen/index.html`](listen/index.html)** — Rotating current release landing page
- **[`betterpartofme/index.html`](betterpartofme/index.html)** — Permanent "Better Part Of Me" release page
- **[`presave.html`](presave.html)** — Redirect to `/listen` (uses `location.replace()`)

### Scripts

- **[`js/releases.js`](js/releases.js)** — Release page logic: load data, render UI, handle CTAs, fire analytics with UUID deduplication
- **[`js/meta-pixel.js`](js/meta-pixel.js)** — Meta Pixel (1091548463560589) with consent gating and event queuing

### Modified Files

- **[`js/cookie-consent.js`](js/cookie-consent.js)** — Updated to trigger Meta Pixel and release analytics on consent
- **[`server.js`](server.js)** — Added OG tag injection for `/listen` and release pages

---

## Configuration

### 1. Set Spotify URLs

Edit [`data/releases.json`](data/releases.json):

```json
{
  "releases": [
    {
      "slug": "betterpartofme",
      "title": "Better Part Of Me",
      ...
      "presaveUrl": "https://open.spotify.com/album/[ACTUAL_PRESAVE_ID]",
      "postReleaseUrl": "https://open.spotify.com/track/[ACTUAL_TRACK_ID]"
    }
  ]
}
```

**Where to find these:**

- **Pre-save link:** Create via Spotify for Artists or your distributor; typically looks like `https://open.spotify.com/album/{id}`
- **Track link:** Available on Spotify once released; typically `https://open.spotify.com/track/{id}`

### 2. Set Current Release Pointer

Keep [`data/releases.json`](data/releases.json) updated:

```json
{
  "current": "betterpartofme" // Change this to the new release's slug when releasing
}
```

**When releasing new music:** Add new object to `releases` array and update `"current"` pointer. No markup changes needed.

### 3. Add Cover Images

Place images at:

- **Album art (square):** `/img/releases/better-part-of-me-1200x1200.jpg`
- **Social card (1200×630):** `/img/releases/better-part-of-me-1200x630.jpg`

Update filenames in [`data/releases.json`](data/releases.json) if different.

Then update these fields in the release object:

```json
{
  "coverImage": "/img/releases/[FILENAME]-1200x1200.jpg",
  "coverImageSquare": "/img/releases/[FILENAME]-1200x1200.jpg",
  "coverImageCard": "/img/releases/[FILENAME]-1200x630.jpg"
}
```

---

## How It Works

### CTA Button Behavior

- **Before release date:** Shows "Pre-save on Spotify" → points to `presaveUrl`
- **On/after release date:** Shows "Listen now" → points to `postReleaseUrl`
- **Date-driven logic** in [releases.js](js/releases.js); no manual switch needed

### Query String Forwarding

All tracked params are forwarded to the outbound link:

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`
- `fbclid` (Facebook click ID)
- `ttclid` (TikTok click ID)

**Example:** User arrives via `/listen/?utm_source=instagram&fbclid=xyz` → exits to Spotify with `?utm_source=instagram&fbclid=xyz` preserved

### SEO & Social Sharing

- **OG tags injected server-side** in [server.js](server.js)
- **Canonical URL on `/listen`** points to the current release's permalink (avoids duplicate content)
- Both `/listen` and `/[slug]` render identical content but have different canonical URLs

**Example OG tags:**

- `og:title`: "Better Part Of Me - Kicked Out Of The Sky"
- `og:image`: 1200×630 card image (social media unfurl)
- `og:url`: Canonical URL (for `/listen`, points to `/betterpartofme/`)

### Analytics & Tracking

#### Consent Gating

All tracking is **GDPR/ePrivacy compliant**:

1. Cookie banner shown on first visit (via [cookie-consent.js](js/cookie-consent.js))
2. User chooses Accept/Decline
3. **Only on Accept:**
   - Google Analytics (GA4) loads
   - Meta Pixel loads
   - Queued events fire
   - Release PageView fires

If user declines, no analytics load. **CTA still works** — tracking is never gated.

#### Meta Pixel Events

Tracked via [meta-pixel.js](js/meta-pixel.js) and [releases.js](js/releases.js):

| Event        | Fired        | Details                                           |
| ------------ | ------------ | ------------------------------------------------- |
| **PageView** | On page load | `eventID`: UUID for Conversions API deduplication |
| **Lead**     | On CTA click | `content_name`: Release title; `eventID`: UUID    |

Each event carries a unique UUID (`eventID`) for Conversions API matching.

**Pixel ID:** 1091548463560589

#### TikTok Pixel (if available)

If TikTok pixel (`ttq`) is present on the site, equivalent events fire:

- `ttq.track("PageView")` on load
- `ttq.track("Lead", { content_name: title })` on CTA click

---

## Adding More Releases

1. Add new entry to [`data/releases.json`](data/releases.json):

   ```json
   {
     "slug": "nextsingle",
     "title": "Next Single Title",
     "artist": "Kicked Out Of The Sky",
     "releaseDate": "2026-11-20",
     "coverImage": "/img/releases/next-single-1200x1200.jpg",
     "coverImageSquare": "/img/releases/next-single-1200x1200.jpg",
     "coverImageCard": "/img/releases/next-single-1200x630.jpg",
     "presaveUrl": "https://open.spotify.com/album/[ID]",
     "postReleaseUrl": "https://open.spotify.com/track/[ID]"
   }
   ```

2. Create `/nextsingle/index.html` (copy [betterpartofme/index.html](betterpartofme/index.html), update titles):

   ```html
   <title>Next Single Title - Kicked Out Of The Sky</title>
   <meta name="description" content="Stream Next Single Title..." />
   <meta property="og:title" content="Next Single Title - Kicked Out Of The Sky" />
   ...
   <script>
     window.initReleasePage("nextsingle", false);
   </script>
   ```

3. Update `"current"` in [data/releases.json](data/releases.json):

   ```json
   { "current": "nextsingle" }
   ```

4. Add cover images to `/img/releases/`

That's it. `/listen` now shows the new release; old permalinks remain live.

---

## Performance & Accessibility

- **Mobile-first:** Tested at 390px; uses responsive layout with no horizontal scroll
- **Image optimization:** Space reserved via `aspect-ratio`, preloaded before rendering
- **No layout shift:** Container `aspect-ratio` prevents CLS on image load
- **Semantic HTML:** Real `<a>` tag for CTA, visible focus state (outline), sufficient contrast
- **Keyboard accessible:** Tab through nav → CTA → back link
- **Accessible forms:** Input labels, ARIA labels on nav

---

## Testing Checklist

- [ ] `/listen` loads and shows current release
- [ ] `/betterpartofme` loads and shows that release
- [ ] `/presave` redirects to `/listen`
- [ ] CTA shows "Pre-save on Spotify" (before Oct 23, 2026)
- [ ] CTA shows "Listen now" (on/after Oct 23, 2026)
- [ ] Query strings forward to Spotify URL
- [ ] Accept cookie consent, check GA fires
- [ ] Accept cookie consent, check Meta Pixel PageView fires
- [ ] Click CTA, check Meta Pixel Lead event fires
- [ ] OG tags appear in page source (inspect `<head>`)
- [ ] Social unfurl displays correctly (use [Facebook Debugger](https://developers.facebook.com/tools/debug/og/object), [Twitter Card Validator](https://developer.twitter.com/en/docs/twitter-for-websites/cards/tools-and-setup/validator))
- [ ] Layout stable on mobile 390px (no shift when image loads)
- [ ] Focus state visible on CTA button

---

## File Manifest

| File                                                   | Type   | Purpose                                |
| ------------------------------------------------------ | ------ | -------------------------------------- |
| [data/releases.json](data/releases.json)               | Config | Central release data & current pointer |
| [listen/index.html](listen/index.html)                 | Page   | Rotating current release landing       |
| [betterpartofme/index.html](betterpartofme/index.html) | Page   | Permanent release permalink            |
| [presave.html](presave.html)                           | Page   | Redirect to `/listen`                  |
| [js/releases.js](js/releases.js)                       | Script | Release UI logic & analytics           |
| [js/meta-pixel.js](js/meta-pixel.js)                   | Script | Meta Pixel with consent gating         |
| [js/cookie-consent.js](js/cookie-consent.js)           | Script | _(Modified)_ Updated consent triggers  |
| [server.js](server.js)                                 | Server | _(Modified)_ Added OG tag injection    |

---

## Troubleshooting

**CTA doesn't navigate to Spotify:** Check `presaveUrl` and `postReleaseUrl` are valid URLs in [data/releases.json](data/releases.json).

**OG tags not updating for social unfurl:** Clear browser cache and re-check with Facebook Debugger (processes URL afresh).

**Analytics not firing:**

1. Check consent banner and accept
2. Open DevTools → Application → Cookies → verify `cookie_consent: accepted`
3. Check Network tab for GA and fbevents.js requests

**Image doesn't load:**

1. Verify file path in [data/releases.json](data/releases.json) exists
2. Check file permissions
3. Open DevTools → Network tab → look for 404 on image

**New release not showing on `/listen`:** Verify `"current"` pointer in [data/releases.json](data/releases.json) matches the new release's `slug`.
