"""
Local test server — try the invitation and the Link Maker before setting up Google Sheets.

    python tools/dev_server.py

Then open:
    http://localhost:8000/            the invitation
    http://localhost:8000/admin.html  the Link Maker (password: admin)

It serves the project files and answers /api the same way google-apps-script/Code.gs does,
saving data to tools/dev-data.json instead of a Google Sheet.
"""

import json
import os
import random
import re
import sys
import threading
import uuid
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = Path(__file__).resolve().parent / "dev-data.json"
ADMIN_KEY = os.environ.get("ADMIN_KEY", "admin")
PORT = int(os.environ.get("PORT", "8000"))

CODE_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
MAX_NAME = 120
MAX_MESSAGE = 500

lock = threading.Lock()


def load():
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return {"guests": [], "wishes": []}


def save(db):
    DATA_FILE.write_text(json.dumps(db, ensure_ascii=False, indent=1), encoding="utf-8")


def now():
    return datetime.now(timezone.utc).isoformat()


def clean(v, max_len, multiline=False):
    bad = r"[\x00-\x09\x0b-\x1f]" if multiline else r"[\x00-\x1f]"
    return re.sub(bad, " ", "" if v is None else str(v)).strip()[:max_len]


def new_code(db):
    taken = {g["code"] for g in db["guests"]}
    while True:
        code = "".join(random.choice(CODE_CHARS) for _ in range(6))
        if code not in taken:
            return code


def find(items, key, value):
    return next((x for x in items if x[key] == value), None)


def blank_guest(code, name):
    return {"code": code, "name": name, "created": now(), "opened": 0, "lastOpened": "",
            "rsvp": "", "rsvpGuests": 0, "rsvpMessage": "", "rsvpTime": ""}


# ---------- public actions ----------

def a_guest(db, req):
    g = find(db["guests"], "code", clean(req.get("code"), 20))
    if not g:
        return {"ok": False, "error": "not_found"}
    g["opened"] += 1
    g["lastOpened"] = now()
    return {"ok": True, "name": g["name"], "rsvp": g["rsvp"], "rsvpGuests": g["rsvpGuests"]}


def a_wishes(db, req):
    shown = [{"id": w["id"], "name": w["name"], "message": w["message"], "time": w["time"]}
             for w in db["wishes"] if not w["hidden"]]
    return {"ok": True, "wishes": shown[::-1][:200]}


def a_wish(db, req):
    name, message = clean(req.get("name"), MAX_NAME), clean(req.get("message"), MAX_MESSAGE, True)
    if not name or not message:
        return {"ok": False, "error": "missing_fields"}
    wid = "w" + uuid.uuid4().hex[:7]
    db["wishes"].append({"id": wid, "time": now(), "name": name, "message": message,
                         "code": clean(req.get("code"), 20), "hidden": False})
    return {"ok": True, "id": wid}


def a_rsvp(db, req):
    attending = "yes" if req.get("attending") in (True, "yes") else "no"
    try:
        guests = max(1, min(20, int(req.get("guests") or 1))) if attending == "yes" else 0
    except (TypeError, ValueError):
        guests = 1
    g = find(db["guests"], "code", clean(req.get("code"), 20))
    if not g:
        name = clean(req.get("name"), MAX_NAME)
        if not name:
            return {"ok": False, "error": "missing_name"}
        g = blank_guest(new_code(db), name)
        db["guests"].append(g)
    g.update(rsvp=attending, rsvpGuests=guests, rsvpMessage=clean(req.get("message"), MAX_MESSAGE, True), rsvpTime=now())
    return {"ok": True}


# ---------- admin actions ----------

def a_login(db, req):
    return {"ok": True}


def a_list_guests(db, req):
    return {"ok": True, "guests": db["guests"]}


def a_add_guests(db, req):
    names = [clean(n, MAX_NAME) for n in (req.get("names") or [])]
    names = [n for n in names if n][:500]
    if not names:
        return {"ok": False, "error": "no_names"}
    added = []
    for n in names:
        g = blank_guest(new_code(db), n)
        db["guests"].append(g)
        added.append({"code": g["code"], "name": n})
    return {"ok": True, "guests": added}


def a_update_guest(db, req):
    g = find(db["guests"], "code", clean(req.get("code"), 20))
    name = clean(req.get("name"), MAX_NAME)
    if not g or not name:
        return {"ok": False, "error": "not_found"}
    g["name"] = name
    return {"ok": True}


def a_delete_guest(db, req):
    g = find(db["guests"], "code", clean(req.get("code"), 20))
    if not g:
        return {"ok": False, "error": "not_found"}
    db["guests"].remove(g)
    return {"ok": True}


def a_list_wishes(db, req):
    return {"ok": True, "wishes": db["wishes"][::-1]}


def a_set_wish_hidden(db, req):
    w = find(db["wishes"], "id", clean(req.get("id"), 20))
    if not w:
        return {"ok": False, "error": "not_found"}
    w["hidden"] = bool(req.get("hidden"))
    return {"ok": True}


PUBLIC = {"guest": a_guest, "wishes": a_wishes, "wish": a_wish, "rsvp": a_rsvp}
ADMIN = {"login": a_login, "listGuests": a_list_guests, "addGuests": a_add_guests,
         "updateGuest": a_update_guest, "deleteGuest": a_delete_guest,
         "listWishes": a_list_wishes, "setWishHidden": a_set_wish_hidden}


def handle(req):
    action = str(req.get("action") or "")
    fn = PUBLIC.get(action)
    if not fn and action in ADMIN:
        if str(req.get("key") or "") != ADMIN_KEY:
            return {"ok": False, "error": "wrong_key"}
        fn = ADMIN[action]
    if not fn:
        return {"ok": False, "error": "unknown_action"}
    with lock:
        db = load()
        result = fn(db, req)
        save(db)
    return result


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/api":
            self.send_json(handle({k: v[0] for k, v in parse_qs(url.query).items()}))
        else:
            super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/api":
            self.send_error(404)
            return
        raw = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        try:
            req = json.loads(raw.decode("utf-8") or "{}")
        except ValueError:
            self.send_json({"ok": False, "error": "bad_json"})
            return
        self.send_json(handle(req))

    def log_message(self, fmt, *args):
        if "/api" in (self.path or ""):
            sys.stderr.write("  api  %s\n" % (fmt % args))


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Invitation:  http://localhost:{PORT}/")
    print(f"Link Maker:  http://localhost:{PORT}/admin.html   (password: {ADMIN_KEY})")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
