/* eslint-disable no-undef */

// Release landing pages: /listen/ and /betterpartofme/ (redirects to the Feature.fm
// smart link) and /presave.html (forwards to /listen/).

const FAN_LINK = "https://listen.kickedoutofthesky.com/betterpartofme";
const PLAYLIST_URL = "https://open.spotify.com/playlist/4FZfdrXcWZG1tMwUFTCWDK";

const pixelEvents = win => (win.fbq.queue || []).map(args => [...args]);

describe("Release pages", () => {
  beforeEach(() => {
    cy.intercept("GET", "https://listen.kickedoutofthesky.com/**", {
      statusCode: 200,
      body: "<html><body>feature.fm</body></html>",
    });
    cy.intercept("GET", "https://open.spotify.com/**", { statusCode: 200, body: "<html><body>spotify</body></html>" });
    cy.intercept("GET", "https://connect.facebook.net/**", { statusCode: 200, body: "" });
  });

  describe("/listen/", () => {
    it("redirects to the fan link", () => {
      cy.visitWith("/listen/");
      cy.url().should("eq", FAN_LINK);
    });

    it("forwards tracking parameters and drops everything else", () => {
      cy.visitWith(
        "/listen/?utm_source=instagram&utm_medium=story&utm_campaign=launch&utm_content=banner&utm_term=rock&fbclid=fb1&ttclid=tt1&random=x"
      );
      cy.url()
        .should("include", FAN_LINK)
        .and("include", "utm_source=instagram")
        .and("include", "utm_medium=story")
        .and("include", "utm_campaign=launch")
        .and("include", "utm_content=banner")
        .and("include", "utm_term=rock")
        .and("include", "fbclid=fb1")
        .and("include", "ttclid=tt1")
        .and("not.include", "random");
    });

    it("ships no-JS and link fallbacks, the consent-gated pixel and a noindex title", () => {
      cy.request("/listen/")
        .its("body")
        .should(html => {
          expect(html).to.include(`<meta http-equiv="refresh" content="0;url=${FAN_LINK}" />`);
          expect(html).to.include(`<a href="${FAN_LINK}"`);
          expect(html).to.include('<script src="/js/meta-pixel.js"></script>');
          expect(html).to.include("<title>Kicked Out Of The Sky — Listen</title>");
          expect(html).to.include('<meta name="robots" content="noindex, follow" />');
        });
    });
  });

  describe("/poppunkbangers/", () => {
    const leadCalls = win => pixelEvents(win).filter(([type, event]) => type === "track" && event === "Lead");

    it("ships the smart-link page with its link-preview tags and consent-gated pixel", () => {
      cy.request("/poppunkbangers/")
        .its("body")
        .should(html => {
          expect(html).to.include("<title>Pop Punk Bangers</title>");
          expect(html).to.include('<meta property="og:title" content="Pop Punk Bangers" />');
          expect(html).to.include(
            '<meta property="og:image" content="https://www.kickedoutofthesky.com/img/poppunkbangers-og.jpg" />'
          );
          expect(html).to.include('<meta property="og:image:width" content="1200" />');
          expect(html).to.include('<meta property="og:image:height" content="630" />');
          expect(html).to.include('<meta name="twitter:card" content="summary_large_image" />');
          expect(html).to.include('window.META_PIXEL_ID = "1985329649108527";');
          expect(html).to.include('<script src="/js/meta-pixel.js"></script>');
          expect(html).to.include('<script src="/js/cookie-consent.js"></script>');
          expect(html).to.include(`href="${PLAYLIST_URL}"`);
        });
    });

    it("shows the button and stays put without consent, and the button opens the playlist", () => {
      cy.visitWith("/poppunkbangers/", { consent: "declined" });
      cy.contains("a#listen", "Listen on Spotify").should("have.attr", "href", PLAYLIST_URL);
      cy.window().should(win => expect(leadCalls(win)).to.have.length(0));
      cy.contains("a#listen", "Listen on Spotify").click();
      cy.url().should("eq", PLAYLIST_URL);
    });

    it("shows the consent banner on a first visit and fires PageView after Accept", () => {
      cy.visitWith("/poppunkbangers/", { consent: null });
      cy.get("#cookie-consent-banner").should("be.visible");
      cy.window().should(win => {
        expect(pixelEvents(win).some(([, event]) => event === "PageView")).to.be.false;
      });
      cy.get("#cookie-accept").click();
      cy.window().should(win => {
        const pageViews = pixelEvents(win).filter(([type, event]) => type === "track" && event === "PageView");
        expect(pageViews).to.have.length(1);
        expect(pageViews[0][3]).to.have.property("eventID");
      });
    });

    it("fires PageView and a Lead with an eventID, then redirects automatically when consent is given", () => {
      const calls = [];
      cy.visitWith("/poppunkbangers/", {
        consent: "accepted",
        onBeforeLoad(win) {
          win.fbq = (...args) => calls.push(args);
        },
      });
      cy.url().should("eq", PLAYLIST_URL);
      cy.then(() => {
        expect(calls).to.deep.include(["init", "1985329649108527"]);
        const tracked = calls.filter(([type]) => type === "track");
        expect(tracked.map(([, event]) => event)).to.deep.equal(["PageView", "Lead"]);
        expect(tracked[1][3].eventID).to.be.a("string").and.not.equal(tracked[0][3].eventID);
      });
    });

    it("fires Lead with an eventID when the button is clicked after accepting on the page", () => {
      cy.visitWith("/poppunkbangers/", { consent: null });
      cy.get("#cookie-accept").click();
      cy.get("a#listen").click();
      cy.window().should(win => {
        const leads = leadCalls(win);
        expect(leads).to.have.length(1);
        expect(leads[0][3]).to.have.property("eventID");
      });
      cy.url().should("eq", PLAYLIST_URL);
    });

    it("still reaches the playlist when the pixel is blocked", () => {
      cy.intercept("GET", "https://connect.facebook.net/**", { forceNetworkError: true });
      cy.visitWith("/poppunkbangers/", { consent: "declined" });
      cy.get("a#listen").click();
      cy.url().should("eq", PLAYLIST_URL);
    });

    it("forwards tracking parameters and drops everything else", () => {
      cy.visitWith("/poppunkbangers/?utm_source=instagram&fbclid=fb1&random=x", { consent: "accepted" });
      cy.url()
        .should("include", PLAYLIST_URL)
        .and("include", "utm_source=instagram")
        .and("include", "fbclid=fb1")
        .and("not.include", "random");
    });
  });

  describe("/ppb/", () => {
    it("redirects to /poppunkbangers/ and keeps the query string", () => {
      cy.visitWith("/ppb/?utm_source=ig", { consent: "declined" });
      cy.location("pathname").should("eq", "/poppunkbangers/");
      cy.location("search").should("include", "utm_source=ig");
    });
  });

  it("/presave.html forwards to /listen/ and on to the fan link", () => {
    cy.request({ url: "/presave.html" }).its("body").should("include", 'window.location.replace("/listen/")');
    cy.visitWith("/presave.html");
    cy.url().should("include", FAN_LINK);
  });

  describe("/betterpartofme/", () => {
    it("redirects to the Feature.fm link", () => {
      cy.visitWith("/betterpartofme/");
      cy.url().should("eq", FAN_LINK);
    });

    it("forwards tracking parameters and drops everything else", () => {
      cy.visitWith("/betterpartofme/?utm_source=tiktok&fbclid=abc&other=1");
      cy.url()
        .should("include", FAN_LINK)
        .and("include", "utm_source=tiktok")
        .and("include", "fbclid=abc")
        .and("not.include", "other");
    });

    it("ships link fallbacks and the consent-gated pixel", () => {
      cy.request("/betterpartofme/")
        .its("body")
        .should(html => {
          expect(html).to.include(`<a href="${FAN_LINK}"`);
          expect(html).to.include("Listen to Better Part Of Me");
          expect(html).to.not.include("push.fm");
          expect(html).to.include('<script src="/js/meta-pixel.js"></script>');
        });
    });
  });
});
