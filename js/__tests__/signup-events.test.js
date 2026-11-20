/**
 * @jest-environment jsdom
 */

const MAILERLITE_ORIGIN = "https://assets.mailerlite.com";

let observers;
let messageListeners;
let RealMutationObserver;
let realAddEventListener;

function loadScript() {
  jest.isolateModules(() => {
    require("../signup-events.js");
  });
}

function renderEmbeddedForm() {
  document.body.innerHTML = `
    <div class="ml-subscribe-form ml-subscribe-form-8448360">
      <div class="row-form"><form><input class="form-control" name="fields[email]" /></form></div>
      <div class="ml-form-successBody row-success" style="display: none"><h4>You're in</h4></div>
    </div>`;
}

// MailerLite's webforms.js shows the thank-you block with jQuery .show() after a successful subscribe
function showSuccess() {
  document.querySelector(".row-success").style.display = "block";
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

function popupSuccessMessage(data = "mlWebformSubmitSuccess-8426711", origin = MAILERLITE_ORIGIN) {
  window.dispatchEvent(new MessageEvent("message", { data, origin }));
}

describe("signup-events.js", () => {
  beforeEach(() => {
    observers = [];
    messageListeners = [];

    RealMutationObserver = window.MutationObserver;
    window.MutationObserver = function (callback) {
      const observer = new RealMutationObserver(callback);
      observers.push(observer);
      return observer;
    };
    realAddEventListener = window.addEventListener;
    window.addEventListener = function (type, listener, options) {
      if (type === "message") messageListeners.push(listener);
      return realAddEventListener.call(window, type, listener, options);
    };

    localStorage.clear();
    window.fbq = jest.fn();
    window.ttq = { track: jest.fn() };
    window.gtag = jest.fn();
    renderEmbeddedForm();
  });

  afterEach(() => {
    observers.forEach(o => o.disconnect());
    messageListeners.forEach(l => window.removeEventListener("message", l));
    window.MutationObserver = RealMutationObserver;
    window.addEventListener = realAddEventListener;
    delete window.fbq;
    delete window.ttq;
    delete window.gtag;
  });

  it("fires nothing on load or without consent, and not later if consent is given afterwards", async () => {
    loadScript();
    await flush();
    expect(window.fbq).not.toHaveBeenCalled();

    showSuccess();
    await flush();
    popupSuccessMessage();

    localStorage.setItem("cookie_consent", "accepted");
    renderEmbeddedForm();
    showSuccess();
    await flush();

    expect(window.fbq).not.toHaveBeenCalled();
    expect(window.ttq.track).not.toHaveBeenCalled();
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("fires exactly one Lead, SubmitForm and generate_lead after a successful signup with consent", async () => {
    localStorage.setItem("cookie_consent", "accepted");
    loadScript();

    showSuccess();
    await flush();

    expect(window.fbq).toHaveBeenCalledTimes(1);
    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "Lead",
      { content_name: "newsletter" },
      { eventID: expect.stringMatching(/^[0-9a-f-]{36}$/) }
    );
    expect(window.ttq.track).toHaveBeenCalledTimes(1);
    expect(window.ttq.track).toHaveBeenCalledWith(
      "SubmitForm",
      { content_name: "newsletter" },
      { event_id: expect.any(String) }
    );
    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith("event", "generate_lead", { method: "newsletter" });

    expect(window.ttq.track.mock.calls[0][2].event_id).toBe(window.fbq.mock.calls[0][3].eventID);
  });

  it("fires once even if the success state re-renders", async () => {
    localStorage.setItem("cookie_consent", "accepted");
    loadScript();

    showSuccess();
    await flush();
    document.querySelector(".row-success").className += " refreshed";
    document.querySelector(".row-success").style.display = "block";
    await flush();
    renderEmbeddedForm();
    showSuccess();
    await flush();

    expect(window.fbq).toHaveBeenCalledTimes(1);
    expect(window.ttq.track).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });

  it("fires nothing for a failed or invalid submit", async () => {
    localStorage.setItem("cookie_consent", "accepted");
    loadScript();

    document
      .querySelector("form")
      .insertAdjacentHTML("beforeend", '<div class="ml-error">Please enter a valid email</div>');
    document.querySelector("input").classList.add("ml-error");
    await flush();

    expect(window.fbq).not.toHaveBeenCalled();
    expect(window.ttq.track).not.toHaveBeenCalled();
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("fires nothing after Decline", async () => {
    localStorage.setItem("cookie_consent", "declined");
    loadScript();

    showSuccess();
    await flush();
    popupSuccessMessage();

    expect(window.fbq).not.toHaveBeenCalled();
    expect(window.ttq.track).not.toHaveBeenCalled();
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("skips pixels that are not loaded", async () => {
    localStorage.setItem("cookie_consent", "accepted");
    delete window.ttq;
    delete window.gtag;
    loadScript();

    showSuccess();
    await flush();

    expect(window.fbq).toHaveBeenCalledTimes(1);
  });

  describe("MailerLite popup (iframe postMessage)", () => {
    it("fires once when MailerLite reports a successful popup signup", () => {
      localStorage.setItem("cookie_consent", "accepted");
      loadScript();

      popupSuccessMessage();
      popupSuccessMessage();

      expect(window.fbq).toHaveBeenCalledTimes(1);
      expect(window.ttq.track).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledTimes(1);
    });

    it("ignores other messages and messages from other origins", () => {
      localStorage.setItem("cookie_consent", "accepted");
      loadScript();

      popupSuccessMessage("mlCloseIframe-abc");
      popupSuccessMessage("mlWebformSubmitSuccess-8426711", "https://evil.example");
      popupSuccessMessage("mlWebformSubmitSuccess-8426711", "https://mailerlite.com.evil.example");

      expect(window.fbq).not.toHaveBeenCalled();
    });

    it("counts the popup and the embedded form as separate signups", async () => {
      localStorage.setItem("cookie_consent", "accepted");
      loadScript();

      showSuccess();
      await flush();
      popupSuccessMessage();

      expect(window.fbq).toHaveBeenCalledTimes(2);
    });
  });
});
