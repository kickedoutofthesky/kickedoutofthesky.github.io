/* eslint-disable no-undef */

// Every page that has a Content-Security-Policy and loads the Meta/TikTok pixels must allow the pixel hosts,
// otherwise the pixels silently never load or send.

const PAGES = [
  "/",
  "/store/",
  "/store/cart.html",
  "/store/product.html",
  "/store/order-status.html",
  "/store/success.html",
  "/listen/",
  "/betterpartofme/",
  "/poppunkbangers/",
];

const SCRIPT_HOSTS = ["https://connect.facebook.net", "https://analytics.tiktok.com"];
const CONNECT_HOSTS = [
  "https://www.facebook.com",
  "https://connect.facebook.net",
  "https://analytics.tiktok.com",
  "https://analytics-ipv6.tiktok.com",
];

const directive = (csp, name) => {
  const entry = csp.split(";").find(d => d.trim().startsWith(`${name} `));
  return entry ? entry.trim().split(/\s+/).slice(1) : null;
};

describe("CSP allows the Meta and TikTok pixel hosts", () => {
  PAGES.forEach(path => {
    it(`${path} (consent accepted)`, () => {
      const violations = [];
      cy.visitWith(path, {
        consent: "accepted",
        failOnStatusCode: false,
        onBeforeLoad(win) {
          win.addEventListener("securitypolicyviolation", e =>
            violations.push(`${e.violatedDirective} ${e.blockedURI}`)
          );
        },
      });

      cy.document().then(doc => {
        const csp = doc.querySelector('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
        const scriptSrc = directive(csp, "script-src");
        const connectSrc = directive(csp, "connect-src");
        SCRIPT_HOSTS.forEach(host => expect(scriptSrc, `script-src ${host}`).to.include(host));
        CONNECT_HOSTS.forEach(host => expect(connectSrc, `connect-src ${host}`).to.include(host));
      });

      cy.wait(1000);
      cy.then(() => {
        expect(violations.filter(v => /facebook|tiktok/.test(v))).to.deep.equal([]);
      });
    });
  });
});
