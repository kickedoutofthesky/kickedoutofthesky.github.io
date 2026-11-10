/* Homepage behaviour: release state, hero media, header, menu, video facades. */
(function () {
  "use strict";

  // Edit this object for the next single.
  var RELEASE = {
    releaseAt: "2026-11-13T00:00:00Z",
    title: "BETTER PART OF ME",
    dateText: "Out November 13",
    labelBefore: "NEW SINGLE",
    labelAfter: "OUT NOW",
    tickerBefore: "BETTER PART OF ME \u2736 OUT 13.11.2026 \u2736 PRE-SAVE NOW \u2736",
    tickerAfter: "BETTER PART OF ME \u2736 OUT NOW \u2736",
    ctaBefore: "Pre-save",
    ctaAfter: "Listen now",
    ctaUrlBefore: "/betterpartofme/",
    ctaUrlAfter: "/betterpartofme/",
    hero: {
      horizontal: { video: "img/video/hero-horizontal-1080.mp4", poster: "img/hero-horizontal-poster.jpg" },
      vertical: { video: "img/video/hero-vertical-1080.mp4", poster: "img/hero-vertical-poster.jpg" },
    },
  };

  var releaseTime = new Date(RELEASE.releaseAt).getTime();
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var pad = function (n) {
    return String(n).padStart(2, "0");
  };

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  function applyReleaseState() {
    var released = Date.now() >= releaseTime;
    setText("heroLabel", released ? RELEASE.labelAfter : RELEASE.labelBefore);
    setText("featureLabel", released ? RELEASE.labelAfter : RELEASE.labelBefore);
    ["heroCta", "featureCta"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.textContent = released ? RELEASE.ctaAfter : RELEASE.ctaBefore;
      el.setAttribute("href", released ? RELEASE.ctaUrlAfter : RELEASE.ctaUrlBefore);
    });
    var track = $("tickerTrack");
    if (track) {
      var text = released ? RELEASE.tickerAfter : RELEASE.tickerBefore;
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
    return released;
  }

  function tick() {
    var released = applyReleaseState();
    var cd = $("countdown");
    if (released) {
      if (cd) cd.hidden = true;
      return true;
    }
    var diff = Math.max(0, releaseTime - Date.now());
    setText("cdDays", pad(Math.floor(diff / 86400000)));
    setText("cdHours", pad(Math.floor((diff % 86400000) / 3600000)));
    setText("cdMins", pad(Math.floor((diff % 3600000) / 60000)));
    setText("cdSecs", pad(Math.floor((diff % 60000) / 1000)));
    return false;
  }

  tick();
  var timer = setInterval(function () {
    if (tick()) clearInterval(timer);
  }, 1000);

  // Hero: pick one video/poster by orientation so only one file downloads.
  var portrait = window.matchMedia("(orientation: portrait) and (max-width: 820px)");
  var poster = $("heroPoster");
  var video = $("heroVideo");
  var heroSrc = null;

  function setupHero() {
    var set = portrait.matches ? RELEASE.hero.vertical : RELEASE.hero.horizontal;
    if (heroSrc === set) return;
    heroSrc = set;
    if (poster) {
      poster.setAttribute("src", set.poster);
      poster.setAttribute("width", portrait.matches ? "1080" : "1920");
      poster.setAttribute("height", portrait.matches ? "1920" : "1080");
    }
    if (!video || reduceMotion) return;
    video.setAttribute("poster", set.poster);
    video.src = set.video;
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
