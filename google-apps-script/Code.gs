/**
 * Wedding invitation backend — Google Apps Script + Google Sheets.
 *
 * 1. Change ADMIN_KEY below to your own password (this is what you type on admin.html).
 * 2. Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
 * 3. Copy the Web app URL into assets/js/config.js (apiUrl).
 *
 * Sheets "Guests" and "Wishes" are created automatically on first use.
 */

const ADMIN_KEY = 'change-this-password';

const GUEST_HEADERS = ['code', 'name', 'created', 'opened', 'lastOpened', 'rsvp', 'rsvpGuests', 'rsvpMessage', 'rsvpTime'];
const WISH_HEADERS = ['id', 'time', 'name', 'message', 'code', 'hidden'];
const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_NAME = 120;
const MAX_MESSAGE = 500;

// ---------- entry points ----------

function doGet(e) {
  return handle_(e.parameter || {});
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }
  return handle_(body);
}

function handle_(req) {
  try {
    const action = String(req.action || '');
    const pub = PUBLIC_ACTIONS[action];
    if (pub) return json_(pub(req));
    const admin = ADMIN_ACTIONS[action];
    if (admin) {
      if (String(req.key || '') !== ADMIN_KEY) return json_({ ok: false, error: 'wrong_key' });
      return json_(admin(req));
    }
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

// ---------- public actions (used by the invitation page) ----------

const PUBLIC_ACTIONS = {
  // Returns only this one guest's name, never the whole list.
  guest(req) {
    const code = clean_(req.code, 20);
    if (!code) return { ok: false, error: 'no_code' };
    return withLock_(() => {
      const sheet = sheet_('Guests', GUEST_HEADERS);
      const row = findRow_(sheet, code);
      if (!row) return { ok: false, error: 'not_found' };
      const opened = Number(sheet.getRange(row, 4).getValue()) || 0;
      sheet.getRange(row, 4, 1, 2).setValues([[opened + 1, new Date()]]);
      const values = sheet.getRange(row, 1, 1, GUEST_HEADERS.length).getValues()[0];
      return { ok: true, name: values[1], rsvp: values[5] || '', rsvpGuests: values[6] || 0 };
    });
  },

  wishes() {
    const rows = readAll_(sheet_('Wishes', WISH_HEADERS), WISH_HEADERS);
    const wishes = rows
      .filter(w => !w.hidden)
      .map(w => ({ id: w.id, name: w.name, message: w.message, time: toIso_(w.time) }))
      .reverse()
      .slice(0, 200);
    return { ok: true, wishes };
  },

  wish(req) {
    const name = clean_(req.name, MAX_NAME);
    const message = clean_(req.message, MAX_MESSAGE, true);
    if (!name || !message) return { ok: false, error: 'missing_fields' };
    const id = 'w' + Utilities.getUuid().slice(0, 7); // letter prefix stops Sheets reading it as a number
    withLock_(() => {
      sheet_('Wishes', WISH_HEADERS).appendRow([id, new Date(), name, message, clean_(req.code, 20), false]);
    });
    return { ok: true, id };
  },

  rsvp(req) {
    const code = clean_(req.code, 20);
    const attending = req.attending === true || req.attending === 'yes' ? 'yes' : 'no';
    const guests = attending === 'yes' ? Math.max(1, Math.min(20, parseInt(req.guests, 10) || 1)) : 0;
    const message = clean_(req.message, MAX_MESSAGE, true);
    return withLock_(() => {
      const sheet = sheet_('Guests', GUEST_HEADERS);
      let row = code ? findRow_(sheet, code) : 0;
      if (!row) {
        // Guest opened the page without a personal link: add them as a new row.
        const name = clean_(req.name, MAX_NAME);
        if (!name) return { ok: false, error: 'missing_name' };
        sheet.appendRow([newCode_(sheet), "'" + name, new Date(), 0, '', '', '', '', '']);
        row = sheet.getLastRow();
      }
      sheet.getRange(row, 6, 1, 4).setValues([[attending, guests, message, new Date()]]);
      return { ok: true };
    });
  },
};

// ---------- admin actions (used by admin.html, need ADMIN_KEY) ----------

const ADMIN_ACTIONS = {
  login() {
    return { ok: true };
  },

  listGuests() {
    const guests = readAll_(sheet_('Guests', GUEST_HEADERS), GUEST_HEADERS).map(g => ({
      code: String(g.code),
      name: String(g.name),
      created: toIso_(g.created),
      opened: Number(g.opened) || 0,
      lastOpened: toIso_(g.lastOpened),
      rsvp: g.rsvp || '',
      rsvpGuests: Number(g.rsvpGuests) || 0,
      rsvpMessage: g.rsvpMessage || '',
      rsvpTime: toIso_(g.rsvpTime),
    }));
    return { ok: true, guests };
  },

  addGuests(req) {
    const names = (Array.isArray(req.names) ? req.names : [])
      .map(n => clean_(n, MAX_NAME))
      .filter(Boolean)
      .slice(0, 500);
    if (!names.length) return { ok: false, error: 'no_names' };
    return withLock_(() => {
      const sheet = sheet_('Guests', GUEST_HEADERS);
      const taken = new Set(readCodes_(sheet));
      const now = new Date();
      const added = names.map(name => {
        let code;
        do { code = randomCode_(); } while (taken.has(code));
        taken.add(code);
        return { code, name };
      });
      // The leading apostrophe stops Sheets from turning names like "=..." or "1/2" into formulas or dates.
      const rows = added.map(g => [g.code, "'" + g.name, now, 0, '', '', '', '', '']);
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, GUEST_HEADERS.length).setValues(rows);
      return { ok: true, guests: added };
    });
  },

  updateGuest(req) {
    const code = clean_(req.code, 20);
    const name = clean_(req.name, MAX_NAME);
    if (!code || !name) return { ok: false, error: 'missing_fields' };
    return withLock_(() => {
      const sheet = sheet_('Guests', GUEST_HEADERS);
      const row = findRow_(sheet, code);
      if (!row) return { ok: false, error: 'not_found' };
      sheet.getRange(row, 2).setValue("'" + name);
      return { ok: true };
    });
  },

  deleteGuest(req) {
    const code = clean_(req.code, 20);
    return withLock_(() => {
      const sheet = sheet_('Guests', GUEST_HEADERS);
      const row = findRow_(sheet, code);
      if (!row) return { ok: false, error: 'not_found' };
      sheet.deleteRow(row);
      return { ok: true };
    });
  },

  listWishes() {
    const wishes = readAll_(sheet_('Wishes', WISH_HEADERS), WISH_HEADERS)
      .map(w => ({ id: String(w.id), name: w.name, message: w.message, code: w.code, time: toIso_(w.time), hidden: !!w.hidden }))
      .reverse();
    return { ok: true, wishes };
  },

  setWishHidden(req) {
    const id = clean_(req.id, 20);
    return withLock_(() => {
      const sheet = sheet_('Wishes', WISH_HEADERS);
      const row = findRow_(sheet, id);
      if (!row) return { ok: false, error: 'not_found' };
      sheet.getRange(row, 6).setValue(!!req.hidden);
      return { ok: true };
    });
  },
};

// ---------- helpers ----------

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('@'); // keep codes as plain text
  }
  return sheet;
}

function readAll_(sheet, headers) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, headers.length).getValues().map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}

function readCodes_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]));
}

// Row number (1-based) of the row whose first column equals key, or 0.
function findRow_(sheet, key) {
  if (!key) return 0;
  const codes = readCodes_(sheet);
  const i = codes.indexOf(String(key));
  return i < 0 ? 0 : i + 2;
}

function newCode_(sheet) {
  const taken = new Set(readCodes_(sheet));
  let code;
  do { code = randomCode_(); } while (taken.has(code));
  return code;
}

function randomCode_() {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  return s;
}

// Trims text and removes control characters. Messages keep their line breaks; names do not.
function clean_(v, max, multiline) {
  const bad = multiline ? /[\u0000-\u0009\u000b-\u001f]/g : /[\u0000-\u001f]/g;
  return String(v == null ? '' : v).replace(bad, ' ').trim().slice(0, max);
}

function toIso_(v) {
  return v instanceof Date ? v.toISOString() : (v ? String(v) : '');
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
