(function () {
  const W = window.WEDDING;
  const { Api, escapeHtml, guestLink, store } = window.WeddingCommon;
  const $ = (s, el = document) => el.querySelector(s);

  const KEY_STORE = "wedding-admin-key";
  const TEMPLATE_STORE = "wedding-message-template";
  const couple = W.shortNames.km.join(" និង ");
  const DEFAULT_TEMPLATE =
    `សូមគោរពអញ្ជើញ {name}\n` +
    `ចូលរួមជាភ្ញៀវកិត្តិយស ក្នុងពិធីអាពាហ៍ពិពាហ៍របស់ ${couple} 🙏\n\n` +
    `សូមចុចតំណខាងក្រោម ដើម្បីមើលសំបុត្រអញ្ជើញ៖\n{link}`;

  let adminKey = store.get(KEY_STORE, "");
  let guests = [];
  let wishes = [];
  let freshCodes = new Set();

  // ---------- small helpers ----------

  let toastTimer;
  function toast(msg, kind) {
    const el = $("#toast");
    el.textContent = msg;
    el.dataset.kind = kind || "";
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 2600);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  async function call(action, extra) {
    const res = await Api.post(Object.assign({ action, key: adminKey }, extra));
    if (!res.ok && res.error === "wrong_key") {
      signOut();
      throw new Error("Wrong password");
    }
    if (!res.ok) throw new Error(res.error || "Failed");
    return res;
  }

  const template = () => $("#template").value || DEFAULT_TEMPLATE;
  const messageFor = (g) => template().split("{name}").join(g.name).split("{link}").join(guestLink(g.code));

  function ago(iso) {
    if (!iso) return "";
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    return Math.floor(s / 86400) + " days ago";
  }

  // ---------- views ----------

  function show(view) {
    ["noApi", "loginView", "appView"].forEach((id) => ($("#" + id).hidden = id !== view));
    $("#logoutBtn").hidden = view !== "appView";
  }

  function signOut() {
    adminKey = "";
    store.remove(KEY_STORE);
    show("loginView");
  }

  // ---------- render ----------

  function renderStats() {
    const opened = guests.filter((g) => g.opened > 0).length;
    const yes = guests.filter((g) => g.rsvp === "yes");
    const people = yes.reduce((n, g) => n + (Number(g.rsvpGuests) || 1), 0);
    const no = guests.filter((g) => g.rsvp === "no").length;
    const items = [
      ["Guests", guests.length],
      ["Opened link", opened],
      ["Attending", `${yes.length} <small>(${people} people)</small>`],
      ["Declined", no],
      ["No reply", guests.length - yes.length - no],
    ];
    $("#stats").innerHTML = items.map(([label, v]) => `<div class="stat"><b>${v}</b><span>${label}</span></div>`).join("");
    $("#guestCount").textContent = guests.length ? `(${guests.length})` : "";
  }

  function matches(g, q, filter) {
    if (q && !g.name.toLowerCase().includes(q)) return false;
    switch (filter) {
      case "notOpened": return !g.opened;
      case "opened": return g.opened > 0;
      case "yes": return g.rsvp === "yes";
      case "no": return g.rsvp === "no";
      case "noReply": return !g.rsvp;
      default: return true;
    }
  }

  function badge(g) {
    if (g.rsvp === "yes") return `<span class="badge badge--yes">Attending · ${g.rsvpGuests || 1}</span>`;
    if (g.rsvp === "no") return `<span class="badge badge--no">Declined</span>`;
    return `<span class="badge">No reply</span>`;
  }

  function renderGuests() {
    const q = $("#search").value.trim().toLowerCase();
    const filter = $("#filter").value;
    const list = $("#guestList");
    const canShare = !!navigator.share;
    const rows = guests
      .map((g, i) => ({ g, n: i + 1 }))
      .filter(({ g }) => matches(g, q, filter));

    if (!guests.length) {
      list.innerHTML = `<li class="empty">No guests yet. Add names in step 1.</li>`;
      return;
    }
    if (!rows.length) {
      list.innerHTML = `<li class="empty">No guest matches.</li>`;
      return;
    }
    list.innerHTML = rows
      .map(({ g, n }) => {
        const link = guestLink(g.code);
        const opened = g.opened
          ? `<span class="seen">Opened ${g.opened}× · ${ago(g.lastOpened)}</span>`
          : `<span class="seen seen--no">Not opened yet</span>`;
        return `
        <li class="guest${freshCodes.has(g.code) ? " is-new" : ""}" data-code="${escapeHtml(g.code)}">
          <span class="guest__no">${n}</span>
          <div class="guest__main">
            <div class="guest__top">
              <p class="guest__name">${escapeHtml(g.name)}</p>
              ${badge(g)}
            </div>
            <form class="guest__edit" hidden>
              <input name="name" value="${escapeHtml(g.name)}" maxlength="120" aria-label="Guest name" />
              <button class="btn btn--primary btn--sm" type="submit">Save</button>
              <button class="btn btn--quiet btn--sm" type="button" data-act="cancel">Cancel</button>
            </form>
            <p class="guest__meta"><a href="${escapeHtml(link)}" target="_blank" rel="noopener">${escapeHtml(link)}</a> ${opened}</p>
            ${g.rsvpMessage ? `<p class="guest__note">“${escapeHtml(g.rsvpMessage)}”</p>` : ""}
            <div class="guest__actions">
              <button class="btn btn--primary btn--sm" type="button" data-act="copyMsg">Copy message</button>
              <button class="btn btn--quiet btn--sm" type="button" data-act="copyLink">Copy link</button>
              <a class="btn btn--tg btn--sm" href="https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(messageFor(g).split(link).join("").trim())}" target="_blank" rel="noopener">Telegram</a>
              ${canShare ? `<button class="btn btn--quiet btn--sm" type="button" data-act="share">Share…</button>` : ""}
              <button class="btn btn--quiet btn--sm" type="button" data-act="edit">Edit</button>
              <button class="btn btn--danger btn--sm" type="button" data-act="delete">Delete</button>
            </div>
          </div>
        </li>`;
      })
      .join("");
  }

  function renderWishes() {
    const list = $("#wishList");
    if (!wishes.length) {
      list.innerHTML = `<li class="empty">No wishes yet.</li>`;
      return;
    }
    list.innerHTML = wishes
      .map((w) => `
        <li class="wish${w.hidden ? " is-hidden" : ""}" data-id="${escapeHtml(w.id)}">
          <div>
            <p class="wish__head"><b>${escapeHtml(w.name)}</b> <span>${ago(w.time)}</span>${w.hidden ? ' <span class="badge">Hidden</span>' : ""}</p>
            <p class="wish__msg">${escapeHtml(w.message)}</p>
          </div>
          <button class="btn btn--quiet btn--sm" type="button" data-act="${w.hidden ? "show" : "hide"}">${w.hidden ? "Show" : "Hide"}</button>
        </li>`)
      .join("");
  }

  function renderAll() {
    renderStats();
    renderGuests();
    renderWishes();
  }

  // ---------- data ----------

  async function loadAll() {
    const [g, w] = await Promise.all([call("listGuests"), call("listWishes")]);
    guests = g.guests || [];
    wishes = w.wishes || [];
    renderAll();
  }

  async function signIn(key) {
    adminKey = key;
    await call("login");
    store.set(KEY_STORE, key);
    show("appView");
    await loadAll();
  }

  // ---------- events ----------

  function setupEvents() {
    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const key = e.target.key.value.trim();
      if (!key) return;
      $("#loginStatus").textContent = "Checking…";
      try {
        await signIn(key);
        $("#loginStatus").textContent = "";
      } catch (err) {
        show("loginView");
        $("#loginStatus").textContent = err.message === "Wrong password" ? "Wrong password." : "Could not connect: " + err.message;
      }
    });

    $("#logoutBtn").addEventListener("click", signOut);

    const addForm = $("#addForm");
    const countNames = () => addForm.names.value.split("\n").map((s) => s.trim()).filter(Boolean);
    addForm.names.addEventListener("input", () => {
      const n = countNames().length;
      $("#addCount").textContent = n ? `${n} name${n > 1 ? "s" : ""}` : "";
    });
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const names = countNames();
      if (!names.length) return toast("Type at least one name.", "error");
      const btn = addForm.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Creating…";
      try {
        const res = await call("addGuests", { names });
        freshCodes = new Set(res.guests.map((g) => g.code));
        addForm.names.value = "";
        $("#addCount").textContent = "";
        await loadAll();
        toast(`Created ${res.guests.length} link${res.guests.length > 1 ? "s" : ""}.`, "ok");
        $("#search").value = "";
        $("#filter").value = "all";
        renderGuests();
        const first = $("#guestList .is-new");
        if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (err) {
        toast("Could not add: " + err.message, "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Create links";
      }
    });

    const tpl = $("#template");
    tpl.value = store.get(TEMPLATE_STORE, DEFAULT_TEMPLATE);
    let saveTimer;
    tpl.addEventListener("input", () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        store.set(TEMPLATE_STORE, tpl.value);
        $("#templateSaved").textContent = "Saved";
        renderGuests();
      }, 400);
    });
    $("#resetTemplate").addEventListener("click", () => {
      tpl.value = DEFAULT_TEMPLATE;
      store.set(TEMPLATE_STORE, DEFAULT_TEMPLATE);
      renderGuests();
      toast("Message reset.");
    });

    $("#search").addEventListener("input", renderGuests);
    $("#filter").addEventListener("change", renderGuests);
    $("#refreshBtn").addEventListener("click", async () => {
      try {
        await loadAll();
        toast("Updated.");
      } catch (err) {
        toast("Could not refresh: " + err.message, "error");
      }
    });
    $("#exportBtn").addEventListener("click", exportCsv);

    $("#guestList").addEventListener("click", onGuestAction);
    $("#guestList").addEventListener("submit", onGuestSave);
    $("#wishList").addEventListener("click", onWishAction);
  }

  async function onGuestAction(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const row = btn.closest(".guest");
    const g = guests.find((x) => x.code === row.dataset.code);
    if (!g) return;
    const act = btn.dataset.act;

    if (act === "copyMsg") {
      await copy(messageFor(g));
      toast("Message copied — paste it in Telegram or Messenger.", "ok");
    } else if (act === "copyLink") {
      await copy(guestLink(g.code));
      toast("Link copied.", "ok");
    } else if (act === "share") {
      navigator.share({ text: messageFor(g) }).catch(() => {});
    } else if (act === "edit" || act === "cancel") {
      const editing = act === "edit";
      $(".guest__edit", row).hidden = !editing;
      $(".guest__top", row).hidden = editing;
      if (editing) $(".guest__edit input", row).focus();
    } else if (act === "delete") {
      // First tap arms the button, second tap deletes.
      if (!btn.classList.contains("is-armed")) {
        btn.classList.add("is-armed");
        btn.textContent = "Tap again to delete";
        setTimeout(() => {
          btn.classList.remove("is-armed");
          btn.textContent = "Delete";
        }, 3500);
        return;
      }
      try {
        await call("deleteGuest", { code: g.code });
        guests = guests.filter((x) => x.code !== g.code);
        renderStats();
        renderGuests();
        toast("Guest deleted. Their link no longer shows a name.");
      } catch (err) {
        toast("Could not delete: " + err.message, "error");
      }
    }
  }

  async function onGuestSave(e) {
    e.preventDefault();
    const row = e.target.closest(".guest");
    const g = guests.find((x) => x.code === row.dataset.code);
    const name = e.target.name.value.trim();
    if (!g || !name) return;
    try {
      await call("updateGuest", { code: g.code, name });
      g.name = name;
      renderGuests();
      toast("Name saved. The link stays the same.", "ok");
    } catch (err) {
      toast("Could not save: " + err.message, "error");
    }
  }

  async function onWishAction(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.closest(".wish").dataset.id;
    const w = wishes.find((x) => x.id === id);
    const hidden = btn.dataset.act === "hide";
    try {
      await call("setWishHidden", { id, hidden });
      w.hidden = hidden;
      renderWishes();
    } catch (err) {
      toast("Could not update: " + err.message, "error");
    }
  }

  function exportCsv() {
    const cell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const head = ["No", "Name", "Link", "Opened", "Last opened", "RSVP", "People", "RSVP message"];
    const lines = guests.map((g, i) =>
      [i + 1, g.name, guestLink(g.code), g.opened, g.lastOpened, g.rsvp, g.rsvpGuests || "", g.rsvpMessage].map(cell).join(",")
    );
    // The BOM makes Excel read Khmer text correctly.
    const blob = new Blob(["﻿" + [head.map(cell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "guest-links.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- start ----------

  $("#coupleLabel").textContent = `${W.shortNames.en.join(" & ")} · ${couple}`;
  $("#connLabel").textContent = W.apiUrl ? "Google Sheets" : Api.available() ? "Local test mode" : "Not connected";
  $("#connLabel").dataset.kind = W.apiUrl ? "ok" : Api.available() ? "test" : "off";
  setupEvents();

  if (!Api.available()) show("noApi");
  else if (!adminKey) show("loginView");
  else {
    show("appView");
    loadAll().catch((err) => {
      if (adminKey) toast("Could not load: " + err.message, "error");
    });
  }
})();
