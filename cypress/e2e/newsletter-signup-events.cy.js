/* eslint-disable no-undef */

// Homepage newsletter signup: ad events fire once on the MailerLite "You're in" success state, only with consent.
// MailerLite's own form is not loaded here; we stub the markup its template injects and reveal the success block.

function stubPixelsAndRenderForm(win, calls) {
  win.fbq = (...args) => calls.push(["fbq", ...args]);
  win.ttq = { track: (...args) => calls.push(["ttq", ...args]) };
  win.gtag = (...args) => calls.push(["gtag", ...args]);

  const wrapper = win.document.createElement("div");
  wrapper.className = "ml-subscribe-form ml-subscribe-form-8448360";
  wrapper.innerHTML =
    '<div class="row-form"></div><div class="ml-form-successBody row-success" style="display: none">You\'re in</div>';
  win.document.body.appendChild(wrapper);
}

function showSuccess() {
  cy.get(".row-success").invoke("css", "display", "block");
}

describe("Newsletter signup events", () => {
  it("fires exactly one Lead, SubmitForm and generate_lead when consent is accepted", () => {
    const calls = [];
    cy.visitWith("/", { consent: "accepted" });
    cy.window().then(win => stubPixelsAndRenderForm(win, calls));
    showSuccess();
    // A re-render of the success state must not count again
    cy.get(".row-success").invoke("attr", "data-refreshed", "1");
    cy.get(".row-success").invoke("css", "display", "block");
    cy.wrap(calls).should("have.length.greaterThan", 0);
    cy.wait(300);

    cy.then(() => {
      const lead = calls.filter(c => c[0] === "fbq" && c[2] === "Lead");
      const submit = calls.filter(c => c[0] === "ttq" && c[1] === "SubmitForm");
      const gen = calls.filter(c => c[0] === "gtag" && c[2] === "generate_lead");
      expect(lead).to.have.length(1);
      expect(submit).to.have.length(1);
      expect(gen).to.have.length(1);
      expect(lead[0][3]).to.deep.equal({ content_name: "newsletter" });
      expect(submit[0][2]).to.deep.equal({ content_name: "newsletter" });
      expect(gen[0][3]).to.deep.equal({ method: "newsletter" });
      expect(lead[0][4].eventID).to.be.a("string").and.equal(submit[0][3].event_id);
    });
  });

  it("fires nothing without consent", () => {
    const calls = [];
    cy.visitWith("/", { consent: "declined" });
    cy.window().then(win => stubPixelsAndRenderForm(win, calls));
    showSuccess();
    cy.wait(300);
    cy.then(() => {
      expect(calls.filter(c => c[2] === "Lead" || c[1] === "SubmitForm" || c[2] === "generate_lead")).to.have.length(0);
    });
  });
});
