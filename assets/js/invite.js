(function () {
  const W = window.WEDDING;
  const { Api, toKhmerDigits, escapeHtml, pick, store } = window.WeddingCommon;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const L = {
    open: { en: "Open Invitation", km: "បើកសំបុត្រអញ្ជើញ" },
    dear: { en: "Dear", km: "សូមគោរពអញ្ជើញ" },
    honored: { en: "Our Honored Guest", km: "ភ្ញៀវកិត្តិយស" },
    groomParents: { en: "Groom's Parents", km: "មាតាបិតាខាងកូនប្រុស" },
    brideParents: { en: "Bride's Parents", km: "មាតាបិតាខាងកូនស្រី" },
    groom: { en: "The Groom", km: "កូនប្រុសនាម" },
    bride: { en: "The Bride", km: "កូនស្រីនាម" },
    saveDate: { en: "Save the Date", km: "កាលបរិច្ឆេទ" },
    countdownTitle: { en: "Counting down to our special day", km: "រាប់ថយក្រោយ ឆ្ពោះទៅថ្ងៃមង្គល" },
    days: { en: "Days", km: "ថ្ងៃ" },
    hours: { en: "Hours", km: "ម៉ោង" },
    minutes: { en: "Minutes", km: "នាទី" },
    seconds: { en: "Seconds", km: "វិនាទី" },
    married: { en: "We're married! Thank you for celebrating with us.", km: "យើងបានរៀបការហើយ! សូមអរគុណដែលបានរួមអបអរជាមួយយើង។" },
    addCal: { en: "Add to Calendar", km: "បញ្ចូលក្នុងប្រតិទិន" },
    schedule: { en: "Wedding Program", km: "កម្មវិធីមង្គលការ" },
    venue: { en: "Venue", km: "ទីកន្លែងប្រារព្ធពិធី" },
    openMap: { en: "Open in Google Maps", km: "បើកផែនទី Google Maps" },
    gallery: { en: "Our Moments", km: "អនុស្សាវរីយ៍របស់យើង" },
    dress: { en: "Dress Code", km: "ពណ៌សម្លៀកបំពាក់" },
    gift: { en: "Wedding Gift", km: "ចំណងដៃ" },
    rsvp: { en: "Will You Attend?", km: "តើលោកអ្នកអាចអញ្ជើញចូលរួមបានទេ?" },
    yourName: { en: "Your name", km: "ឈ្មោះរបស់លោកអ្នក" },
    yes: { en: "Joyfully attend", km: "ចូលរួម" },
    no: { en: "Regretfully decline", km: "មិនអាចចូលរួមបាន" },
    people: { en: "Number of people", km: "ចំនួនអ្នកចូលរួម" },
    message: { en: "Message (optional)", km: "សារ (បើមាន)" },
    send: { en: "Send Reply", km: "ផ្ញើការឆ្លើយតប" },
    rsvpThanks: { en: "Thank you! Your reply has been saved.", km: "សូមអរគុណ! ការឆ្លើយតបរបស់លោកអ្នកត្រូវបានរក្សាទុក។" },
    rsvpBefore: { en: "You already replied — you can change it anytime.", km: "លោកអ្នកបានឆ្លើយតបរួចហើយ — អាចកែប្រែបានគ្រប់ពេល។" },
    wishes: { en: "Wishes for the Couple", km: "ពាក្យជូនពរ" },
    yourWish: { en: "Your wishes", km: "ពាក្យជូនពររបស់លោកអ្នក" },
    sendWish: { en: "Send Wishes", km: "ផ្ញើពាក្យជូនពរ" },
    wishThanks: { en: "Thank you for your wishes!", km: "សូមអរគុណសម្រាប់ពាក្យជូនពរ!" },
    noWishes: { en: "Be the first to send your wishes.", km: "សូមក្លាយជាអ្នកដំបូង ក្នុងការផ្ញើពាក្យជូនពរ។" },
    fillAll: { en: "Please fill in the required fields.", km: "សូមបំពេញព័ត៌មានដែលចាំបាច់។" },
    sending: { en: "Sending…", km: "កំពុងផ្ញើ…" },
    error: { en: "Something went wrong. Please try again.", km: "មានបញ្ហាបន្តិច។ សូមព្យាយាមម្តងទៀត។" },
    thanks: { en: "Thank You", km: "សូមអរគុណ" },
  };

  const KM_MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
  const KM_DAYS = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
  const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Event time in Cambodia (UTC+7), whatever the guest's phone timezone is.
  const eventAt = new Date(`${W.date}T${W.time || "00:00"}:00+07:00`);
  const [year, month, day] = W.date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const [hh, mm] = (W.time || "00:00").split(":").map(Number);
  // Optional first day of a 2-day wedding (e.g. 19–20). Same month and year are shown once.
  const first = W.firstDay && W.firstDay < W.date ? W.firstDay.split("-").map(Number) : null;
  const firstWeekday = first ? new Date(Date.UTC(first[0], first[1] - 1, first[2])).getUTCDay() : null;
  const sameMonth = first && first[0] === year && first[1] === month;

  const params = new URLSearchParams(location.search);
  const guestCode = (params.get("to") || "").trim();
  const state = {
    lang: store.get("wedding-lang", null) || (params.get("lang") === "en" ? "en" : W.defaultLang || "km"),
    guestName: "",
    guestRsvp: "",
  };

  // UI labels come from L; wedding texts (e.g. "header") come from config.js.
  const t = (key) => pick(L[key] || W.texts[key], state.lang);
  const num = (s) => (state.lang === "km" ? toKhmerDigits(s) : String(s));
  const sections = W.sections || {};

  function timeText(lang) {
    const h12 = ((hh + 11) % 12) + 1;
    const mins = String(mm).padStart(2, "0");
    if (lang === "en") return `${h12}:${mins} ${hh < 12 ? "AM" : "PM"}`;
    const period = hh < 11 ? "ព្រឹក" : hh < 13 ? "ថ្ងៃត្រង់" : hh < 17 ? "រសៀល" : hh < 19 ? "ល្ងាច" : "យប់";
    return `ម៉ោង ${toKhmerDigits(h12 + ":" + mins)} ${period}`;
  }

  // Values for every [data-fill] element, per language.
  function fills(lang) {
    const km = lang === "km";
    const names = pick(W.shortNames, lang);
    const join = km ? " និង " : " & ";
    const p = W.parents || {};
    const photos = W.photos || {};
    const gallery = photos.gallery || [];
    const kd = toKhmerDigits;
    const two = (n) => String(n).padStart(2, "0");
    let dateShort, weekdayText, dayText, monthYear;
    if (first && sameMonth) {
      dateShort = km ? `${kd(first[2])}-${kd(day)} ${KM_MONTHS[month - 1]} ${kd(year)}` : `${two(first[2])}–${two(day)} . ${two(month)} . ${year}`;
      dayText = km ? `${kd(first[2])}-${kd(day)}` : `${first[2]}–${day}`;
    } else if (first) {
      dateShort = km
        ? `${kd(first[2])} ${KM_MONTHS[first[1] - 1]} - ${kd(day)} ${KM_MONTHS[month - 1]} ${kd(year)}`
        : `${two(first[2])}.${two(first[1])} – ${two(day)}.${two(month)} . ${year}`;
      dayText = km ? `${kd(first[2])}-${kd(day)}` : `${first[2]}–${day}`;
    } else {
      dateShort = km ? `${kd(day)} ${KM_MONTHS[month - 1]} ${kd(year)}` : `${two(day)} . ${two(month)} . ${year}`;
      dayText = km ? kd(day) : day;
    }
    if (first) {
      weekdayText = km ? `ថ្ងៃ${KM_DAYS[firstWeekday]}-${KM_DAYS[weekday]}` : `${EN_DAYS[firstWeekday].slice(0, 3)} – ${EN_DAYS[weekday].slice(0, 3)}`;
    } else {
      weekdayText = km ? `ថ្ងៃ${KM_DAYS[weekday]}` : EN_DAYS[weekday];
    }
    monthYear = km ? `ខែ${KM_MONTHS[month - 1]} ${kd(year)}` : `${EN_MONTHS[month - 1]} ${year}`;
    return {
      initials: (W.shortNames.en || []).map((n) => n.charAt(0)).join(" & "),
      shortNames: names.join(join),
      dateShort,
      weekday: weekdayText,
      day: dayText,
      monthYear,
      timeLong: (km ? "វេលា " : "at ") + timeText(lang),
      inviteText: pick(W.texts.invite, lang),
      groomFather: pick(p.groom && p.groom.father, lang),
      groomMother: pick(p.groom && p.groom.mother, lang),
      brideFather: pick(p.bride && p.bride.father, lang),
      brideMother: pick(p.bride && p.bride.mother, lang),
      groom: pick(W.groom, lang),
      bride: pick(W.bride, lang),
      venue: pick(W.venue, lang),
      address: pick(W.address, lang),
      dressNote: pick(W.dressCode && W.dressCode.note, lang),
      giftNote: pick(W.gift && W.gift.note, lang),
      giftAccount: (W.gift && W.gift.accountName) || "",
      closingText: pick(W.texts.closing, lang),
      coverImg: photos.cover,
      closingImg: photos.closing || gallery[gallery.length - 1] || photos.cover,
    };
  }

  function render() {
    const lang = state.lang;
    document.documentElement.lang = lang;
    document.body.classList.toggle("lang-km", lang === "km");
    document.body.classList.toggle("lang-en", lang === "en");
    $$("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)));
    const f = fills(lang);
    $$("[data-fill]").forEach((el) => {
      const v = f[el.dataset.fill];
      if (el.tagName === "IMG") {
        if (v && el.getAttribute("src") !== v) el.src = v;
      } else {
        el.textContent = v == null ? "" : v;
      }
    });
    document.title = `${pick(W.texts.header, lang)} · ${f.shortNames}`;
    $("#langBtn").textContent = lang === "km" ? "EN" : "ខ្មែរ";
    const guest = state.guestName || t("honored");
    $("#guestNameCover").textContent = guest;
    $("#guestNameMain").textContent = state.guestName;
    $("#guestBlock").hidden = !state.guestName;
    renderTimeline();
    tickCountdown();
  }

  // ---------- program ----------

  const ICONS = {
    guests: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.2c3.3-.6 6.5 1.8 6.5 5.8"/>',
    offering: '<path d="M4 13h16l-2 6H6l-2-6zM12 13V5M8 9l4-4 4 4"/>',
    procession: '<path d="M5 11h14v8H5zM3 11h18M12 11v8M12 11c-2-4-6-4-6-1.5S10 11 12 11zm0 0c2-4 6-4 6-1.5S14 11 12 11z"/>',
    food: '<circle cx="12" cy="13" r="6"/><path d="M3 5v5a2 2 0 0 0 2 2V20M5 5v4M21 5c-1.5 0-2 2-2 4s.5 3 2 3v8"/>',
    rings: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 4h4l-2 3z"/>',
    monk: '<path d="M12 20c-4 0-8-2-8-6 3 0 6 1 8 4 2-3 5-4 8-4 0 4-4 6-8 6zM12 18c-2-2-3-5-3-8 1 1 2 1.5 3 1.5S14 11 15 10c0 3-1 6-3 8zM12 11.5V4"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.2 8.2L20 20M8.2 15.8L20 4"/>',
    string: '<path d="M3 12c3-3 6 3 9 0s6-3 9 0M12 12c-1.5 2-1.5 4 0 6 1.5-2 1.5-4 0-6z"/><circle cx="12" cy="12" r="1.2"/>',
    cheers: '<path d="M7 3h5l-.6 6a2 2 0 0 1-3.8 0L7 3zM9.5 11v7M7 21h5M14 6h5l-.6 6a2 2 0 0 1-3.8 0L14 6zM16.5 14v4M14 21h5"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  };

  function renderTimeline() {
    const list = $("#timeline");
    list.innerHTML = (W.schedule || [])
      .map((item) => `
        <li class="timeline__item reveal in">
          <span class="timeline__icon"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[item.icon] || ICONS.guests}</svg></span>
          <div class="timeline__body">
            <p class="timeline__time">${escapeHtml(pick(item.time, state.lang))}</p>
            <p class="timeline__what">${escapeHtml(pick(item.activity, state.lang))}</p>
          </div>
        </li>`)
      .join("");
  }

  // ---------- countdown ----------

  function tickCountdown() {
    const left = eventAt - Date.now();
    const done = left <= 0;
    $("#countdown").hidden = done || sections.countdown === false;
    $("#countdownDone").hidden = !done;
    if (done) return;
    const s = Math.floor(left / 1000);
    const parts = { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
    Object.entries(parts).forEach(([k, v]) => {
      $(`[data-cd="${k}"]`).textContent = num(k === "d" ? v : String(v).padStart(2, "0"));
    });
  }

  // ---------- static parts (built once) ----------

  function buildStatic() {
    Object.entries(sections).forEach(([key, on]) => {
      if (on === false) $$(`[data-section="${key}"]`).forEach((el) => (el.hidden = true));
    });
    if (!Api.available()) $$("[data-needs-api]").forEach((el) => (el.hidden = true));
    $(".date-card").classList.toggle("is-range", !!first);

    const photos = W.photos || {};
    const slides = (photos.opening && photos.opening.length ? photos.opening : [photos.cover]).filter(Boolean);
    $$("[data-slides]").forEach((box) => {
      box.innerHTML = slides
        .map((src, i) => `<div class="slide${i ? "" : " is-active"}" style="background-image:url('${encodeURI(src)}')"></div>`)
        .join("");
    });
    // Both curtain halves show the same slide, so together they look like one photo.
    if (slides.length > 1 && !reduceMotion) {
      let current = 0;
      slideTimer = setInterval(() => {
        current = (current + 1) % slides.length;
        $$("[data-slides]").forEach((box) =>
          [...box.children].forEach((s, i) => s.classList.toggle("is-active", i === current))
        );
      }, 5000);
    }

    const gallery = photos.gallery || [];
    $("#gallery").innerHTML = gallery
      .map((src, i) => `<button class="gallery__item reveal" type="button" data-index="${i}" aria-label="Photo ${i + 1}">
          <img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" /></button>`)
      .join("");
    // Landscape photos take the full width so they are not cropped into a tall box.
    // If the half-width photos are an odd number, the last one fills its row so no gap is left.
    const balance = () => {
      const items = $$("#gallery .gallery__item");
      items.forEach((el) => el.classList.remove("is-full"));
      const halves = items.slice(1).filter((el) => !el.classList.contains("is-wide"));
      if (halves.length % 2) halves[halves.length - 1].classList.add("is-full");
    };
    $$("#gallery img").forEach((img) => {
      const mark = () => {
        if (img.naturalWidth > img.naturalHeight) img.parentElement.classList.add("is-wide");
        balance();
      };
      img.complete ? mark() : img.addEventListener("load", mark, { once: true });
    });
    balance();
    if (!gallery.length) $('[data-section="gallery"]').hidden = true;

    const colors = (W.dressCode && W.dressCode.colors) || [];
    $("#swatches").innerHTML = colors.map((c) => `<span class="swatch" style="--c:${escapeHtml(c)}"></span>`).join("");
    if (!colors.length) $("#dressSection").hidden = true;

    if (W.gift && W.gift.qr) $("#giftQr").src = W.gift.qr;
    else $("#giftSection").hidden = true;

    $("#mapFrame").src = `https://maps.google.com/maps?q=${encodeURIComponent(W.mapQuery || pick(W.venue, "en"))}&z=15&output=embed`;
    $("#mapBtn").href = W.mapsLink || `https://maps.google.com/?q=${encodeURIComponent(W.mapQuery || "")}`;

    const end = new Date(eventAt.getTime() + 4 * 3600 * 1000);
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const calText = `${pick(W.texts.header, "en")} ${W.shortNames.en.join(" & ")}`;
    $("#calendarBtn").href =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(calText)}&dates=${stamp(eventAt)}/${stamp(end)}` +
      `&location=${encodeURIComponent(`${pick(W.venue, "en")}, ${pick(W.address, "en")}`)}`;

    if (W.music) {
      $("#music").src = W.music;
      $("#musicBtn").hidden = false;
    }
  }

  // ---------- opening ----------

  let slideTimer = null;

  function openInvitation() {
    document.body.classList.add("is-open");
    document.body.classList.remove("is-locked");
    playMusic();
    startPetals();
    setTimeout(() => {
      $("#opening").hidden = true;
      clearInterval(slideTimer);
    }, reduceMotion ? 0 : 2000);
  }

  // ---------- music ----------

  function playMusic() {
    const audio = $("#music");
    if (!W.music) return;
    audio.play().then(() => $("#musicBtn").classList.add("is-playing")).catch(() => {});
  }

  function toggleMusic() {
    const audio = $("#music");
    if (audio.paused) playMusic();
    else {
      audio.pause();
      $("#musicBtn").classList.remove("is-playing");
    }
  }

  // ---------- gallery viewer ----------

  let lbIndex = 0;
  function showPhoto(i) {
    const list = W.photos.gallery;
    lbIndex = (i + list.length) % list.length;
    $("#lightboxImg").src = list[lbIndex];
  }

  function setupLightbox() {
    const box = $("#lightbox");
    $("#gallery").addEventListener("click", (e) => {
      const item = e.target.closest(".gallery__item");
      if (!item) return;
      showPhoto(Number(item.dataset.index));
      box.showModal();
    });
    box.addEventListener("click", (e) => {
      const action = e.target.dataset.lb;
      if (action === "close" || e.target === box) box.close();
      else if (action) showPhoto(lbIndex + Number(action));
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") showPhoto(lbIndex - 1);
      if (e.key === "ArrowRight") showPhoto(lbIndex + 1);
    });
    let startX = null;
    box.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
    box.addEventListener("touchend", (e) => {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) showPhoto(lbIndex + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  // ---------- guest ----------

  async function loadGuest() {
    if (!guestCode || !Api.available()) return;
    const cached = store.get("wedding-guest-" + guestCode, null);
    if (cached) applyGuest(cached);
    try {
      const res = await Api.get({ action: "guest", code: guestCode });
      if (res.ok) {
        const guest = { name: res.name, rsvp: res.rsvp, rsvpGuests: res.rsvpGuests };
        store.set("wedding-guest-" + guestCode, guest);
        applyGuest(guest);
      }
    } catch {}
  }

  function applyGuest(guest) {
    state.guestName = String(guest.name || "").trim();
    state.guestRsvp = guest.rsvp || "";
    render();
    const rsvp = $("#rsvpForm");
    if (state.guestName) {
      rsvp.name.value = state.guestName;
      $("#rsvpNameField").hidden = true;
      const wish = $("#wishForm");
      if (!wish.name.value) wish.name.value = state.guestName;
    }
    if (state.guestRsvp) {
      const radio = rsvp.querySelector(`input[name="attending"][value="${state.guestRsvp}"]`);
      if (radio) radio.checked = true;
      if (guest.rsvpGuests) rsvp.guests.value = guest.rsvpGuests;
      updateCountField();
      setStatus(rsvp, "rsvpBefore", "ok");
    }
  }

  // ---------- forms ----------

  function setStatus(form, key, kind) {
    const el = $(".form__status", form);
    el.textContent = key ? t(key) : "";
    el.dataset.kind = kind || "";
    el.dataset.key = key || "";
  }

  function updateCountField() {
    const form = $("#rsvpForm");
    const yes = form.attending.value === "yes";
    $("#rsvpCountField").hidden = !yes;
  }

  function setupRsvp() {
    const form = $("#rsvpForm");
    updateCountField();
    form.addEventListener("change", updateCountField);
    $$("[data-step]", form).forEach((b) =>
      b.addEventListener("click", () => {
        const v = Math.max(1, Math.min(20, (parseInt(form.guests.value, 10) || 1) + Number(b.dataset.step)));
        form.guests.value = v;
      })
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const attending = form.attending.value;
      if (!name || !attending) return setStatus(form, "fillAll", "error");
      setStatus(form, "sending");
      form.classList.add("is-busy");
      try {
        const res = await Api.post({
          action: "rsvp",
          code: guestCode,
          name,
          attending,
          guests: form.guests.value,
          message: form.message.value.trim(),
        });
        if (!res.ok) throw new Error(res.error);
        if (guestCode) store.set("wedding-guest-" + guestCode, { name: state.guestName || name, rsvp: attending, rsvpGuests: Number(form.guests.value) });
        setStatus(form, "rsvpThanks", "ok");
      } catch {
        setStatus(form, "error", "error");
      } finally {
        form.classList.remove("is-busy");
      }
    });
  }

  function timeAgo(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    if (state.lang === "km") return `${toKhmerDigits(d.getDate())} ${KM_MONTHS[d.getMonth()]} ${toKhmerDigits(d.getFullYear())}`;
    return `${d.getDate()} ${EN_MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  }

  let wishes = [];
  function renderWishes() {
    const list = $("#wishList");
    if (!wishes.length) {
      list.innerHTML = `<li class="wishes__empty">${escapeHtml(t("noWishes"))}</li>`;
      return;
    }
    list.innerHTML = wishes
      .map((w) => `
        <li class="wish">
          <span class="wish__avatar" aria-hidden="true">${escapeHtml(String(w.name).trim().charAt(0).toUpperCase())}</span>
          <div>
            <p class="wish__head"><b>${escapeHtml(w.name)}</b><time>${escapeHtml(timeAgo(w.time))}</time></p>
            <p class="wish__msg">${escapeHtml(w.message)}</p>
          </div>
        </li>`)
      .join("");
  }

  async function loadWishes() {
    if (!Api.available() || sections.wishes === false) return;
    try {
      const res = await Api.get({ action: "wishes" });
      if (res.ok) wishes = res.wishes || [];
    } catch {}
    renderWishes();
  }

  function setupWishes() {
    const form = $("#wishForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const message = form.message.value.trim();
      if (!name || !message) return setStatus(form, "fillAll", "error");
      setStatus(form, "sending");
      form.classList.add("is-busy");
      try {
        const res = await Api.post({ action: "wish", code: guestCode, name, message });
        if (!res.ok) throw new Error(res.error);
        wishes.unshift({ id: res.id, name, message, time: new Date().toISOString() });
        renderWishes();
        form.message.value = "";
        setStatus(form, "wishThanks", "ok");
      } catch {
        setStatus(form, "error", "error");
      } finally {
        form.classList.remove("is-busy");
      }
    });
  }

  // ---------- reveal on scroll ----------

  function setupReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      $$(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    $$(".reveal:not(.in)").forEach((el) => io.observe(el));
  }

  // ---------- falling petals ----------

  function startPetals() {
    if (reduceMotion) return;
    const canvas = $("#petals");
    const ctx = canvas.getContext("2d");
    const colors = ["#E7A98F", "#F2C9B4", "#D9B877", "#C9D3BF"];
    let w, h, dpr;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
    };
    resize();
    addEventListener("resize", resize);
    const count = innerWidth < 600 ? 14 : 22;
    const petals = Array.from({ length: count }, () => newPetal(true));
    function newPetal(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -20 * dpr,
        r: (5 + Math.random() * 6) * dpr,
        vy: (0.35 + Math.random() * 0.6) * dpr,
        sway: Math.random() * Math.PI * 2,
        spin: Math.random() * Math.PI,
        vs: (Math.random() - 0.5) * 0.03,
        color: colors[(Math.random() * colors.length) | 0],
        alpha: 0.55 + Math.random() * 0.35,
      };
    }
    function frame() {
      if (!document.hidden) {
        ctx.clearRect(0, 0, w, h);
        petals.forEach((p, i) => {
          p.sway += 0.012;
          p.spin += p.vs;
          p.y += p.vy;
          p.x += Math.sin(p.sway) * 0.6 * dpr;
          if (p.y > h + 20 * dpr) petals[i] = newPetal(false);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.spin);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  // ---------- start ----------

  buildStatic();
  render();
  setupReveal();
  setupLightbox();
  setupRsvp();
  setupWishes();
  loadGuest();
  loadWishes();
  setInterval(tickCountdown, 1000);

  $("#openBtn").addEventListener("click", openInvitation);
  $("#musicBtn").addEventListener("click", toggleMusic);
  $("#langBtn").addEventListener("click", () => {
    state.lang = state.lang === "km" ? "en" : "km";
    store.set("wedding-lang", state.lang);
    render();
    $$(".form__status").forEach((el) => el.dataset.key && (el.textContent = t(el.dataset.key)));
    renderWishes();
  });
})();
