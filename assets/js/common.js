/* Shared helpers for index.html and admin.html. */
(function () {
  const W = window.WEDDING;
  const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

  // Where guest data lives: the Google Apps Script URL, or the local test server.
  function apiUrl() {
    if (W.apiUrl) return W.apiUrl;
    return LOCAL_HOSTS.includes(location.hostname) ? "/api" : "";
  }

  async function readJson(res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  const Api = {
    available: () => !!apiUrl(),

    async get(params) {
      const url = new URL(apiUrl(), location.href);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      return readJson(await fetch(url, { redirect: "follow" }));
    },

    // text/plain keeps the request "simple", so Google Apps Script answers without a CORS preflight.
    async post(body) {
      return readJson(await fetch(apiUrl(), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body),
        redirect: "follow",
      }));
    },
  };

  const KM_DIGITS = "០១២៣៤៥៦៧៨៩";
  const toKhmerDigits = (s) => String(s).replace(/[0-9]/g, (d) => KM_DIGITS[d]);

  const escapeHtml = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Picks the right language from a { en, km } value; plain strings pass through.
  const pick = (v, lang) => (v && typeof v === "object" ? v[lang] || v.en || v.km || "" : v || "");

  // The address guests open, e.g. "https://our-wedding.netlify.app/".
  function inviteBase() {
    let base = W.siteUrl || new URL("./", location.href).href;
    if (!/\/$|\.html?$/.test(base)) base += "/";
    return base;
  }

  const guestLink = (code) => inviteBase() + "?to=" + encodeURIComponent(code);

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {}
    },
  };

  window.WeddingCommon = { Api, toKhmerDigits, escapeHtml, pick, guestLink, store };
})();
