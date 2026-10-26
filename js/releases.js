/**
 * releases.js
 * Handles release landing page logic:
 * - Load release data
 * - Format and display release info
 * - Handle CTA with date-driven pre-save/listen switch
 * - Forward query strings to outbound links
 * - Fire analytics events (Meta Pixel + GA)
 * global fbq, ttq
 */
/* global fbq, ttq */

(function () {
  "use strict";

  // Generate UUID for event deduplication (Meta Conversions API)
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Format date as "October 23, 2026"
  function formatDisplayDate(dateStr) {
    const date = new Date(dateStr + "T00:00:00Z");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Check if release date has arrived (local time, before midnight UTC)
  function isReleased(dateStr) {
    const releaseDate = new Date(dateStr + "T00:00:00Z");
    const now = new Date();
    return now >= releaseDate;
  }

  // Forward query string params to outbound URL
  function forwardQueryString(baseUrl) {
    const searchParams = new URLSearchParams(window.location.search);
    const trackedParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid", "ttclid"];
    const url = new URL(baseUrl);

    trackedParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        url.searchParams.set(param, value);
      }
    });

    return url.toString();
  }

  // Fire Meta Pixel PageView
  function fireMetaPixelPageView(_releaseTitle) {
    if (typeof fbq !== "function") return;

    const eventId = generateUUID();
    fbq("track", "PageView", {}, { eventID: eventId });

    // Store eventId for Lead tracking
    window._releaseEventId = eventId;
  }

  // Fire Meta Pixel Lead event on CTA click
  function fireMetaPixelLead(releaseTitle) {
    if (typeof fbq !== "function") return;

    const eventId = window._releaseEventId || generateUUID();
    fbq("track", "Lead", { content_name: releaseTitle }, { eventID: eventId });
  }

  // Fire TikTok pixel equivalents if ttq is available
  function fireTikTokPageView() {
    if (typeof ttq !== "function") return;
    ttq.track("PageView");
  }

  function fireTikTokLead(releaseTitle) {
    if (typeof ttq !== "function") return;
    ttq.track("Lead", { content_name: releaseTitle });
  }

  // Initialize release page
  function initReleasePage(releaseSlug, isCurrentRelease) {
    // Fetch release data
    fetch("/data/releases.json")
      .then(res => res.json())
      .then(data => {
        // If slug is "current", resolve to the actual current release
        let slug = releaseSlug;
        if (releaseSlug === "current") {
          slug = data.current;
        }

        const release = data.releases.find(r => r.slug === slug);
        if (!release) {
          console.error("Release not found:", slug);
          return;
        }

        const released = isReleased(release.releaseDate);

        // Preload cover image to prevent layout shift
        const preloadLink = document.createElement("link");
        preloadLink.rel = "preload";
        preloadLink.as = "image";
        preloadLink.href = release.coverImage;
        document.head.appendChild(preloadLink);

        // Render release info
        const coverEl = document.getElementById("release-cover");
        if (coverEl) {
          coverEl.src = release.coverImage;
          coverEl.alt = `${release.title} Cover Art`;
        }

        const titleEl = document.getElementById("release-title");
        if (titleEl) {
          titleEl.textContent = release.title;
        }

        const artistEl = document.getElementById("release-artist");
        if (artistEl) {
          artistEl.textContent = release.artist;
        }

        const dateEl = document.getElementById("release-date");
        if (dateEl) {
          dateEl.textContent = formatDisplayDate(release.releaseDate);
        }

        // Set up CTA
        const ctaBtn = document.getElementById("release-cta");
        if (ctaBtn) {
          const url = released ? release.postReleaseUrl : release.presaveUrl;
          const ctaUrl = forwardQueryString(url);
          const ctaText = released ? "Listen now" : "Pre-save on Spotify";

          ctaBtn.href = ctaUrl;
          ctaBtn.textContent = ctaText;
          ctaBtn.target = "_blank";
          ctaBtn.rel = "noopener noreferrer";

          // Fire analytics on CTA click (wait for consent)
          ctaBtn.addEventListener("click", () => {
            fireMetaPixelLead(release.title);
            fireTikTokLead(release.title);
          });
        }

        // Fire PageView once page is ready (Meta + TikTok)
        // Wait for consent via the cookie-consent module
        if (localStorage.getItem("cookie_consent") === "accepted") {
          fireMetaPixelPageView(release.title);
          fireTikTokPageView();
        } else {
          // Queue for when consent is granted
          window._releasePageViewPending = {
            title: release.title,
            fireMetaPixel: fireMetaPixelPageView,
            fireTikTok: fireTikTokPageView,
          };
        }

        // Set canonical URL for /listen (avoid duplicate content)
        if (isCurrentRelease && window.location.pathname === "/listen/") {
          const canonical = document.querySelector('link[rel="canonical"]');
          if (canonical) {
            canonical.href = `https://www.kickedoutofthesky.com/${release.slug}/`;
          }
        }
      })
      .catch(err => console.error("Failed to load releases:", err));
  }

  // Export for use in HTML
  window.initReleasePage = initReleasePage;

  // Hook into consent mechanism: when consent is granted, fire pending events
  window.flushReleaseAnalyticsQueue = function () {
    if (window._releasePageViewPending) {
      const pending = window._releasePageViewPending;
      pending.fireMetaPixel(pending.title);
      pending.fireTikTok();
      delete window._releasePageViewPending;
    }
  };
})();
