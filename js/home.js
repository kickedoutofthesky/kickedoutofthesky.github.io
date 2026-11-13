/* Homepage behaviour: release state, hero media, header, menu, video facades. */
(function () {
  "use strict";

  // Edit this object for the next single.
  var RELEASE = {
    labelText: "OUT NOW",
    tickerText: "BETTER PART OF ME \u2736 OUT NOW \u2736",
    ctaText: "Listen",
    ctaUrl: "https://listen.kickedoutofthesky.com/betterpartofme",
    hero: {
      horizontal: {
        webm: "img/video/hero-horizontal.webm",
        mp4: "img/video/hero-horizontal.mp4",
        poster: "img/hero-horizontal-poster.jpg",
        avif: "img/hero-horizontal-poster.avif",
        width: 1920,
        height: 1080,
      },
      vertical: {
        webm: "img/video/hero-vertical.webm",
        mp4: "img/video/hero-vertical.mp4",
        poster: "img/hero-vertical-poster.jpg",
        avif: "img/hero-vertical-poster.avif",
        width: 606,
        height: 1080,
      },
    },
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) {
    return document.getElementById(id);
  };

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  function applyReleaseState() {
    setText("heroLabel", RELEASE.labelText);
    setText("featureLabel", RELEASE.labelText);
    ["heroCta", "featureCta"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.textContent = RELEASE.ctaText;
      el.setAttribute("href", RELEASE.ctaUrl);
    });
    var track = $("tickerTrack");
    if (track) {
      var text = RELEASE.tickerText;
      if (track.dataset.text !== text) {
        track.dataset.text = text;
        var chunk = (text + " ").repeat(6);
        track.innerHTML = "";
        for (var i = 0; i < 2; i++) {
          var span = document.createElement("span");
          span.textContent = chunk;
          track.appendChild(span);
        }
      }
    }
  }

  applyReleaseState();

  // Hero: pick one video/poster by orientation so only one file downloads.
  var portrait = window.matchMedia("(orientation: portrait) and (max-width: 820px)");
  var video = $("heroVideo");
  var heroSrc = null;

  function setupHero() {
    var set = portrait.matches ? RELEASE.hero.vertical : RELEASE.hero.horizontal;
    if (heroSrc === set) return;
    heroSrc = set;
    if (!video || reduceMotion) return;
    video.setAttribute("poster", set.poster);
    video.textContent = "";
    [
      [set.webm, "video/webm"],
      [set.mp4, "video/mp4"],
    ].forEach(function (f) {
      var source = document.createElement("source");
      source.src = f[0];
      source.type = f[1];
      video.appendChild(source);
    });
    video.load();
    video.muted = true;
    video.preload = "auto";
    video.addEventListener(
      "playing",
      function () {
        video.classList.add("is-playing");
      },
      { once: true }
    );
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  if (reduceMotion && video) video.remove();
  setupHero();
  if (portrait.addEventListener) portrait.addEventListener("change", setupHero);

  // Header turns solid on scroll
  var header = $("navbarMain");
  function onScroll() {
    if (header) header.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var toggle = $("menuToggle");
  var nav = $("siteNav");
  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (header) header.classList.toggle("menu-open", open);
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  // Click-to-load YouTube facades
  document.querySelectorAll(".yt-facade").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.src = btn.dataset.src;
      frame.title = btn.dataset.title;
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      frame.className = "yt-frame";
      btn.replaceWith(frame);
      frame.focus();
    });
  });

  // Fade-ins
  var fades = document.querySelectorAll(".section");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    fades.forEach(function (el) {
      el.classList.add("fade");
      io.observe(el);
    });
  }
})();
