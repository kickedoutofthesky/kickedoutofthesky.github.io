/* eslint-disable no-undef */

// Homepage MailerLite embed. Loads MailerLite's real Universal/webforms scripts (network required) so a CSP that
// blocks any of them fails here; only the subscribe request is stubbed.

describe("MailerLite embedded signup form", () => {
  it("submits in-page via MailerLite's handler, without opening a tab, and shows the success block", () => {
    const violations = [];
    let windowsOpened = 0;
    cy.intercept("**/jsonp/638341/forms/*/subscribe*", {
      statusCode: 200,
      headers: { "content-type": "application/javascript" },
      body: 'mlWebformSubmitted({"success":true});',
    }).as("subscribe");

    cy.visitWith("/", {
      onBeforeLoad(win) {
        win.addEventListener("securitypolicyviolation", e => violations.push(`${e.violatedDirective} ${e.blockedURI}`));
        win.open = () => {
          windowsOpened++;
          return null;
        };
      },
    });

    cy.get("form.ml-block-form", { timeout: 15000 }).should("exist");
    // MailerLite binds its submit handler once its helper script has loaded
    cy.window({ timeout: 15000 }).should(win => {
      const form = win.document.querySelector("form.ml-block-form");
      expect(win.ml_jQuery._data(form, "events"), "MailerLite submit handler").to.have.property("submit");
    });

    cy.get("form.ml-block-form input[name='fields[email]']").scrollIntoView().type("fan@example.com");
    cy.get("form.ml-block-form button.primary:visible").click();

    cy.wait("@subscribe");
    cy.get(".ml-form-successBody.row-success").should("be.visible").and("contain", "You're in");
    cy.get("form.ml-block-form").should("not.be.visible");
    cy.location("pathname").should("eq", "/");
    cy.then(() => {
      expect(windowsOpened).to.equal(0);
      expect(violations).to.deep.equal([]);
    });
  });
});
