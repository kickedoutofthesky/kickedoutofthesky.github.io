# Release pages

| Route              | File                                                   | Behaviour                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/betterpartofme/` | [betterpartofme/index.html](betterpartofme/index.html) | Redirects to the Feature.fm smart link `https://listen.kickedoutofthesky.com/betterpartofme` (pre-save countdown, then listen page at release), carrying `utm_*`, `fbclid` and `ttclid` query params |
| `/listen/`         | [listen/index.html](listen/index.html)                 | Redirects to the same Feature.fm smart link, carrying `utm_*`, `fbclid` and `ttclid` query params                                                                                                    |
| `/presave.html`    | [presave.html](presave.html)                           | Redirects to `/listen/` (`location.replace`)                                                                                                                                                         |

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

The pages are redirects. Each one forwards `utm_*`, `fbclid` and `ttclid` to its destination. Meta and TikTok pixels load only after the visitor accepts cookies ([js/meta-pixel.js](js/meta-pixel.js), [js/tiktok-pixel.js](js/tiktok-pixel.js)). `meta-pixel.js` sends the single PageView, with an `eventID` exposed as `window.META_PAGEVIEW_EVENT_ID`. Lead tracking for the pre-save happens on Feature.fm, not on this site.

When run through [server.js](server.js) locally, Open Graph tags are injected for release pages and `/listen/`; on GitHub Pages the tags in each HTML file are used.

## Adding a release

1. Add an object to `releases` in `data/releases.json` (and update `current` if it's the newest).
2. Add the cover images to `img/releases/`.
3. Copy `betterpartofme/` to `<slug>/` and update the `<title>`, meta/Open Graph tags and `DEST`.
4. To point `/listen/` somewhere else, edit `DEST` and the `<noscript>` refresh URL in `listen/index.html`.
5. Run the release page tests: `npx cypress run --spec cypress/e2e/release-pages.cy.js`.

## Troubleshooting

- **No pixel events:** accept the cookie banner (or set `localStorage.cookie_consent = "accepted"`) and check the Network tab for `fbevents.js`.
