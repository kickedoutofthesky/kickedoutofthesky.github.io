/* eslint-disable no-undef */

// Release landing pages: /listen/ (fan-link redirect), /presave.html and
// /betterpartofme/ (rendered by js/releases.js from data/releases.json).

const FAN_LINK = "https://push.fm/fl/kickedoutofthesky";
const PLAYLIST_URL = "https://open.spotify.com/playlist/4FZfdrXcWZG1tMwUFTCWDK";
const PRESAVE_URL = "https://open.spotify.com/album/3mPTW6XxKAMcxIp1N3XKJ5";
const LISTEN_URL = "https://open.spotify.com/track/3mPTW6XxKAMcxIp1N3XKJ5";

const pixelEvents = win => (win.fbq.queue || []).map(args => [...args]);

describe("Release pages", () => {
  beforeEach(() => {
    cy.intercept("GET", "https://push.fm/**", { statusCode: 200, body: "<html><body>push.fm</body></html>" });
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
    it("renders the release from data/releases.json", () => {
      cy.visitWith("/betterpartofme/");

      cy.get("#release-title").should("have.text", "Better Part Of Me");
      cy.get("#release-artist").should("have.text", "Kicked Out Of The Sky");
      cy.get("#release-date").should("have.text", "November 13, 2026");
      cy.get("#release-cover")
        .should("have.attr", "src", "/img/releases/better-part-of-me-1200x1200.jpg")
        .and("have.attr", "alt", "Better Part Of Me Cover Art");
      cy.request("/img/releases/better-part-of-me-1200x1200.jpg").its("status").should("eq", 200);
    });

    it("links to the pre-save before release day, forwarding tracking parameters", () => {
      cy.clock(new Date("2026-11-12T12:00:00Z").getTime(), ["Date"]);
      cy.visitWith("/betterpartofme/?utm_source=tiktok&fbclid=abc&other=1");

      cy.get("#release-cta")
        .should("have.text", "Pre-save on Spotify")
        .and("have.attr", "target", "_blank")
        .and("have.attr", "rel", "noopener noreferrer")
        .and("have.attr", "href")
        .and("include", PRESAVE_URL)
        .and("include", "utm_source=tiktok")
        .and("include", "fbclid=abc")
        .and("not.include", "other");
    });

    it("switches the call to action to 'Listen now' from release day", () => {
      cy.clock(new Date("2026-11-13T00:00:00Z").getTime(), ["Date"]);
      cy.visitWith("/betterpartofme/");

      cy.get("#release-cta").should("have.text", "Listen now").and("have.attr", "href", LISTEN_URL);
    });

    it("has its own title, canonical URL and social tags", () => {
      cy.visitWith("/betterpartofme/");
      cy.title().should("eq", "Better Part Of Me - Kicked Out Of The Sky");
      cy.get("meta[name='description']").should("have.attr", "content").and("include", "Better Part Of Me");
      cy.get("link[rel='canonical']").should("have.attr", "href", "https://www.kickedoutofthesky.com/betterpartofme/");
      cy.get("meta[property='og:url']").should(
        "have.attr",
        "content",
        "https://www.kickedoutofthesky.com/betterpartofme/"
      );
      cy.get("meta[property='og:title']").should("have.attr", "content", "Better Part Of Me - Kicked Out Of The Sky");
      cy.get("meta[property='og:type']").should("have.attr", "content", "website");
    });

    it("fires the Meta Pixel PageView only after cookies are accepted", () => {
      cy.visitWith("/betterpartofme/", { consent: null });
      cy.get("#release-title").should("have.text", "Better Part Of Me");
      cy.window().should(win => {
        expect(win._releasePageViewPending).to.exist;
        expect(pixelEvents(win).some(([, event]) => event === "PageView")).to.be.false;
      });

      cy.get("#cookie-accept").click();
      cy.window().should(win => {
        expect(win._releasePageViewPending).to.be.undefined;
        expect(pixelEvents(win)).to.deep.include(["init", "1091548463560589"]);
        expect(pixelEvents(win).some(([type, event]) => type === "track" && event === "PageView")).to.be.true;
      });
    });

    it("fires a Lead event when the call to action is clicked (with consent)", () => {
      cy.visitWith("/betterpartofme/", { consent: "accepted" });
      cy.get("#release-cta").should("have.attr", "href").and("include", "open.spotify.com");
      cy.get("#release-cta").invoke("removeAttr", "target").invoke("attr", "href", "#").click();

      cy.window().should(win => {
        const lead = pixelEvents(win).find(([type, event]) => type === "track" && event === "Lead");
        expect(lead, "Lead event").to.exist;
        expect(lead[2]).to.deep.equal({ content_name: "Better Part Of Me" });
      });
    });
  });
});
