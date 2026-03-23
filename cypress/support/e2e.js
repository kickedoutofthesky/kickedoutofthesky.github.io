// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import shared test helpers
import "./helpers.js";

// Ignore cross-origin script errors from CDN resources (Bootstrap, Font Awesome)
// These are expected and don't affect test functionality
// eslint-disable-next-line no-undef
Cypress.on("uncaught:exception", (err, _runnable) => {
  // Ignore Script errors (cross-origin resource errors from CDN)
  if (err.message === "Script error." || err.message.includes("Script error")) {
    // Log it for debugging but don't fail
    console.warn("Ignoring cross-origin script error:", err);
    return false; // Continue test execution
  }
  // Let other errors fail the tests
  return true;
});

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests in the Command Log
const app = window.top;

if (!app.document.head.querySelector("[data-hide-command-log-request]")) {
  const style = app.document.createElement("style");
  style.innerHTML = ".command-name-request, .command-name-xhr { display: none }";
  style.setAttribute("data-hide-command-log-request", "");

  app.document.head.appendChild(style);
}
