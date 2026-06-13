/* Gamified Lives — first-party, cookieless web analytics.
   Sends a pageview + download-click events to our own Supabase `track` function.
   No cookies, no third party, nothing sensitive. Fails silently — never blocks the page. */
(function () {
  var ENDPOINT = "https://mtujvdqhlolfojqxyzwh.supabase.co/functions/v1/track";

  function sessionId() {
    try {
      var k = "gl_sid", v = sessionStorage.getItem(k);
      if (!v) {
        v = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(k, v);
      }
      return v;
    } catch (e) { return null; }
  }

  function param(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }

  function channelFrom(refHost, utmSource) {
    var s = (utmSource || refHost || "").toLowerCase();
    if (!s) return "direct";
    if (s.indexOf("t.co") > -1 || s.indexOf("twitter") > -1 || s.indexOf("x.com") > -1) return "x";
    if (s.indexOf("tiktok") > -1) return "tiktok";
    if (s.indexOf("instagram") > -1 || s.indexOf("ig.me") > -1) return "instagram";
    if (s.indexOf("youtu") > -1) return "youtube";
    if (s.indexOf("reddit") > -1) return "reddit";
    if (s.indexOf("pinterest") > -1 || s.indexOf("pin.it") > -1) return "pinterest";
    if (s.indexOf("google") > -1 || s.indexOf("bing") > -1 || s.indexOf("duckduckgo") > -1) return "search";
    if (s.indexOf("gamifiedlives.com") > -1) return "internal";
    return utmSource ? utmSource : "referral";
  }

  function send(event, extra) {
    try {
      var refHost = "";
      try { refHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
      var utmSource = param("utm_source");
      var payload = {
        event: event,
        path: location.pathname,
        referrer: document.referrer || null,
        referrer_host: refHost || null,
        utm_source: utmSource,
        utm_medium: param("utm_medium"),
        utm_campaign: param("utm_campaign"),
        channel: channelFrom(refHost, utmSource),
        session_id: sessionId(),
        device: (window.innerWidth || 0) < 768 ? "mobile" : "desktop",
        screen_w: window.innerWidth || null
      };
      if (extra) for (var k in extra) payload[k] = extra[k];
      var body = JSON.stringify(payload);
      // text/plain keeps it a "simple" CORS request (no preflight).
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain;charset=UTF-8" }));
      } else {
        fetch(ENDPOINT, { method: "POST", headers: { "content-type": "text/plain;charset=UTF-8" }, body: body, keepalive: true }).catch(function () {});
      }
    } catch (e) {}
  }

  // Pageview on load
  send("pageview");

  // Track clicks on App Store links or anything marked data-ev="download"
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("apps.apple.com") > -1 || a.getAttribute("data-ev") === "download") {
      send("download_click");
    }
  }, true);
})();
