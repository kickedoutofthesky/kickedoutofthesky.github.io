// analytics.js
// Only loads GA after cookie consent
// eslint-disable-next-line no-unused-vars
function loadGA() {
  if (window._gaLoaded) return;
  window._gaLoaded = true;

  var script = document.createElement("script");
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-WG5KEEZX4H";
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", "G-WG5KEEZX4H");
}
