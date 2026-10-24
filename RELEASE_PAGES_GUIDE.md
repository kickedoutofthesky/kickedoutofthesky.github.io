# Release pages

| Route              | File                                                   | Behaviour                                                                                                                      |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `/betterpartofme/` | [betterpartofme/index.html](betterpartofme/index.html) | Permanent release page rendered by [js/releases.js](js/releases.js) from [data/releases.json](data/releases.json)              |
| `/listen/`         | [listen/index.html](listen/index.html)                 | Redirects to the push.fm fan link `https://push.fm/fl/kickedoutofthesky`, carrying `utm_*`, `fbclid` and `ttclid` query params |
| `/presave.html`    | [presave.html](presave.html)                           | Redirects to `/listen/` (`location.replace`)                                                                                   |

## Release data

[data/releases.json](data/releases.json):

```json
{
  "current": "betterpartofme",
  "releases": [
    {
      "slug": "betterpartofme",
      "title": "Better Part Of Me",
      "artist": "Kicked Out Of The Sky",
      "releaseDate": "2026-11-13",
      "coverImage": "/img/releases/better-part-of-me-1200x1200.jpg",
      "coverImageSquare": "/img/releases/better-part-of-me-1200x1200.jpg",
      "coverImageCard": "/img/releases/better-part-of-me-1200x630.jpg",
      "presaveUrl": "https://open.spotify.com/album/…",
      "postReleaseUrl": "https://open.spotify.com/track/…"
    }
  ]
}
```

- Cover images live in `img/releases/` (1200×1200 square, 1200×630 social card).
- `current` is used by `initReleasePage("current")`; the `/listen/` route no longer reads it.

## What a release page does

The page calls `window.initReleasePage("<slug>", false)`, which:

1. Loads `/data/releases.json` and finds the release by slug.
2. Fills in title, artist, formatted release date and cover art.
3. Sets the CTA: **"Pre-save on Spotify"** → `presaveUrl` before `releaseDate` (UTC), **"Listen now"** → `postReleaseUrl` on/after it. The page's query string is forwarded to the CTA link.
4. Fires Meta Pixel `PageView` on load and `Lead` on CTA click (TikTok calls are skipped because the TikTok pixel isn't loaded), only if `localStorage.cookie_consent === "accepted"` ([js/cookie-consent.js](js/cookie-consent.js)). Events carry a UUID `eventID` for deduplication.

When run through [server.js](server.js) locally, Open Graph tags are injected for release pages and `/listen/`; on GitHub Pages the tags in each HTML file are used.

## Adding a release

1. Add an object to `releases` in `data/releases.json` (and update `current` if it's the newest).
2. Add the cover images to `img/releases/`.
3. Copy `betterpartofme/` to `<slug>/`, update the `<title>`, meta/Open Graph tags and the `initReleasePage("<slug>", false)` call.
4. To point `/listen/` somewhere else, edit `DEST` and the `<noscript>` refresh URL in `listen/index.html`.
5. Run the release page tests: `npx cypress run --spec cypress/e2e/release-pages.cy.js` and `npx jest js/__tests__/releases.test.js`.

## Troubleshooting

- **CTA goes to the wrong place:** check `presaveUrl`, `postReleaseUrl` and `releaseDate` in `data/releases.json`.
- **"Release not found" in the console:** the slug passed to `initReleasePage` doesn't match a `slug` in `releases.json`.
- **No pixel events:** accept the cookie banner (or set `localStorage.cookie_consent = "accepted"`) and check the Network tab for `fbevents.js`.
