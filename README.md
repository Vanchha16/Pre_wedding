# Wedding Invitation + Guest Link Maker

- `index.html`: the invitation guests open. It shows **their own name**.
- `admin.html`: your private **Link Maker**. Add guest names, then copy or send their links.
- Guest names, RSVPs and wishes are saved in **your Google Sheet**.

Each guest gets a link like `https://your-site/?to=k7Xq2`. The code `k7Xq2` belongs only to that guest, so:
- there's no guest limit
- deleting or renaming one guest never changes anyone else's link
- a guest sees only **their own** name, never the whole list

---

## Step 1: Try it on your computer

```
python tools/dev_server.py
```

Then open:
- http://localhost:8000/admin.html (password: `admin`). Add some names and copy a link.
- Open that link to see the invitation with the guest's name.

Test data is saved in `tools/dev-data.json`. Delete that file to start fresh.

## Step 2: Connect Google Sheets

1. Go to https://sheets.new to create a new Google Sheet. Name it something like "Wedding Guests".
2. In the sheet, click **Extensions → Apps Script**.
3. Delete the code you see, then paste everything from `google-apps-script/Code.gs`.
4. On line 11, change `change-this-password` to your own password:
   ```js
   const ADMIN_KEY = 'my-secret-password-2027';
   ```
5. Click **Save** (the disk icon).
6. Click **Deploy → New deployment**, then click the gear ⚙ → **Web app**, and set:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy**, then **Authorize access**, and choose your Google account.
   If you see "Google hasn't verified this app", click **Advanced → Go to … (unsafe)**. It's your own script.
8. Copy the **Web app URL** (it ends with `/exec`).
9. Open `assets/js/config.js` and paste it:
   ```js
   apiUrl: "https://script.google.com/macros/s/XXXX/exec",
   ```

The sheets **Guests** and **Wishes** are created automatically the first time you add a guest.

> If you change `Code.gs` later: **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**.
> The URL stays the same.

## Step 3: Add your details and photos

**Text:** edit `assets/js/config.js` (names, parents, date, venue, schedule, colours). Every text has `en` and `km`.

**Photos:** put them in the `photos` folder using the **same file names**:

| File | Used for |
|---|---|
| `cover.jpg` | First big photo (vertical is best) |
| `01.jpg` – `03.jpg` | Slideshow behind the opening card |
| `01.jpg` – `11.jpg` | Gallery. Landscape photos show full width automatically. |
| `closing.jpg` | Photo behind the "Thank You" at the end |

You can use more or fewer photos. Just change the list in `config.js` → `photos`.
Keep each photo under about 500 KB so the page loads fast on phones (resize to about 1600 px).

**Music (optional):** put an MP3 in the `music` folder and set `music: "music/song.mp3"`.

**Gift QR (optional):** put your ABA/KHQR image in `photos` and set `gift.qr: "photos/qr.jpg"`.

## Step 4: Put it online (free)

> ⚠ **Before uploading, move the `image` folder out of `Prewending`** (for example to your Desktop).
> It holds your original phone photos. Anything in the folder becomes public, and original
> photos can contain hidden GPS location data. The resized copies in `photos/` have that removed.

**Netlify (easiest):**
1. Go to https://app.netlify.com/drop
2. Drag the whole `Prewending` folder onto the page.
3. You get a link like `https://something.netlify.app`. You can rename it in **Site settings**.
4. Put that address in `config.js` → `siteUrl`, then drag the folder again to update.

Your Link Maker is at `https://something.netlify.app/admin.html`.

## Step 5: Send invitations

1. Open `admin.html` and sign in with your password.
2. **Add guests:** type one name per line (Khmer or English), then click **Create links**.
3. For each guest:
   - **Copy message**: copies the invitation text with their name and link. Paste it into Telegram, Messenger, etc.
   - **Telegram**: opens Telegram with the message ready to send.
   - **Share…** (phone only): opens your phone's share menu.
4. You can edit the message text in **Message to send**. `{name}` and `{link}` are filled in automatically.

The guest list shows who **opened** their link and who **replied** (attending, how many people, or declined).
**Export Excel** downloads everything as a file.

---

## Files

```
index.html                 the invitation
admin.html                 the Link Maker (private, needs your password)
assets/js/config.js        ← YOUR WEDDING DETAILS
assets/js/invite.js        invitation logic
assets/js/admin.js         Link Maker logic
assets/js/common.js        shared helpers
assets/css/                styles
photos/                    ← YOUR PHOTOS
music/                     ← YOUR MUSIC (optional)
google-apps-script/Code.gs backend to paste into Google Apps Script
tools/dev_server.py        local test server
```
