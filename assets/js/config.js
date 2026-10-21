/*
 * ============================================================
 *  WEDDING SETTINGS — edit this file only.
 *  Every text has an English (en) and Khmer (km) version.
 * ============================================================
 */
window.WEDDING = {
  // Paste your Google Apps Script "Web app" URL here (see README.md, step 2).
  // Leave empty while testing on your computer with tools/dev_server.py.
  apiUrl: "https://script.google.com/macros/s/AKfycbycpTneeffZyA5EC4ot1k_wcuKNjG-i48PrYf8v8Qx-3fz-fuQAa0GV8-c9wcbDL0QKcA/exec",

  // The public address of your invitation, e.g. "https://our-wedding.netlify.app/".
  // Used by the Link Maker to build guest links. Empty = same site as admin.html.
  siteUrl: "",

  // Language shown first: "km" or "en". Guests can switch with the button.
  defaultLang: "km",

  groom: { en: "IM TARARITH", km: "អ៊ឹម តារារិទ្ធ" },
  bride: { en: "CHHAI LILY", km: "ឆៃ លីលី" },

  // Short names for the big title and the seal (first letters).
  shortNames: { en: ["Tararith", "Lily"], km: ["តារារិទ្ធ", "លីលី"] },

  parents: {
    groom: {
      father: { en: "SOK VANNA", km: "លោក សុខ វណ្ណា" },
      mother: { en: "KEO SOKHA", km: "លោកស្រី កែវ សុខា" },
    },
    bride: {
      father: { en: "CHAN RITHY", km: "លោក ចាន់ ឫទ្ធី" },
      mother: { en: "MEAS SREYMOM", km: "លោកស្រី មាស ស្រីមុំ" },
    },
  },

  // Main event date and time (24-hour). Used by the countdown and calendar button.
  date: "2026-10-20",
  time: "17:00",
  // First day for a 2-day wedding, shown as "19-20". Leave empty ("") for a 1-day wedding.
  firstDay: "2026-10-19",

  venue: { en: "Phnom Penh", km: "រាជធានីភ្នំពេញ" },
  address: { en: "Cambodia", km: "ព្រះរាជាណាចក្រកម្ពុជា" },
  mapsLink: "https://maps.google.com/?q=Phnom+Penh",
  mapQuery: "Phnom Penh, Cambodia", // what the embedded map searches for

  texts: {
    header: { en: "The Wedding Of", km: "សិរីមង្គលអាពាហ៍ពិពាហ៍" },
    invite: {
      en: "Together with their families, request the pleasure of your company at their wedding celebration",
      km: "សូមគោរពអញ្ជើញ ចូលរួមជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធិពរជ័យ សិរីសួស្តី ក្នុងពិធីអាពាហ៍ពិពាហ៍របស់កូនប្រុស កូនស្រីយើងខ្ញុំ",
    },
    closing: {
      en: "Your presence is the greatest gift to us. Thank you!",
      km: "វត្តមានរបស់លោកអ្នក គឺជាកិត្តិយសដ៏ខ្ពង់ខ្ពស់សម្រាប់គ្រួសារយើងខ្ញុំ។ សូមអរគុណ!",
    },
  },

  // Program of the day. Icons: guests, offering, procession, food, rings, monk, scissors, string, cheers, music
  schedule: [
    { icon: "guests", time: { en: "06:30 AM", km: "០៦:៣០ ព្រឹក" }, activity: { en: "Guests arrive & welcome", km: "ជួបជុំញាតិមិត្ត និងភ្ញៀវកិត្តិយស" } },
    { icon: "procession", time: { en: "07:00 AM", km: "០៧:០០ ព្រឹក" }, activity: { en: "Dowry procession (Hai Chomnoun)", km: "ពិធីហែជំនួន ចូលរោងជ័យ" } },
    { icon: "food", time: { en: "07:30 AM", km: "០៧:៣០ ព្រឹក" }, activity: { en: "Breakfast for guests", km: "អញ្ជើញភ្ញៀវកិត្តិយសពិសាអាហារពេលព្រឹក" } },
    { icon: "rings", time: { en: "08:00 AM", km: "០៨:០០ ព្រឹក" }, activity: { en: "Ring exchange ceremony", km: "ពិធីពិសាស្លាកំណត់ និងបំពាក់ចិញ្ចៀន" } },
    { icon: "monk", time: { en: "08:30 AM", km: "០៨:៣០ ព្រឹក" }, activity: { en: "Monks' blessing", km: "ពិធីសូត្រមន្ត ចម្រើនព្រះបរិត្ត" } },
    { icon: "scissors", time: { en: "09:00 AM", km: "០៩:០០ ព្រឹក" }, activity: { en: "Hair-cutting ceremony", km: "ពិធីកាត់សក់បង្កក់សិរី" } },
    { icon: "string", time: { en: "10:30 AM", km: "១០:៣០ ព្រឹក" }, activity: { en: "Knot-tying blessing (Sompeah Ptem)", km: "ពិធីសំពះផ្ទឹម សែនចងដៃ បង្វិលពពិល" } },
    { icon: "cheers", time: { en: "05:00 PM", km: "០៥:០០ ល្ងាច" }, activity: { en: "Dinner reception", km: "អញ្ជើញភ្ញៀវកិត្តិយសពិសាភោជនាហារ" } },
  ],

  // Photos (put your files in the "photos" folder, keep the same names or change them here).
  photos: {
    cover: "photos/cover.jpg", // first big photo — vertical works best
    opening: ["photos/01.jpg", "photos/02.jpg", "photos/03.jpg"], // slideshow behind the opening card
    gallery: [
      "photos/01.jpg", "photos/02.jpg", "photos/03.jpg", "photos/04.jpg",
      "photos/05.jpg", "photos/06.jpg", "photos/07.jpg", "photos/08.jpg",
      "photos/09.jpg", "photos/10.jpg", "photos/11.jpg",
    ],
    closing: "photos/closing.jpg", // photo behind the "Thank You" at the end
  },

  // Background music (MP3). Leave empty for no music.
  // test-canon.wav is a free test melody (Pachelbel's Canon) — replace it with your own song.
  music: "music/test-canon.wav",

  // Dress code colours shown as dots. Leave the list empty to hide the section.
  dressCode: {
    colors: ["#C9A36B", "#E8C9B5", "#7E907A", "#F4EDE1", "#8C5A4A"],
    note: { en: "Earth tones and soft neutrals are welcome", km: "សូមស្លៀកពាក់ពណ៌ទន់ៗ ឬពណ៌ធម្មជាតិ" },
  },

  // Wedding gift QR (ABA / Bakong KHQR image). Leave qr empty to hide the section.
  gift: {
    qr: "",
    accountName: "",
    note: {
      en: "Your blessing is our greatest gift. If you wish to send a gift, you can scan here.",
      km: "ពរជ័យរបស់លោកអ្នក គឺជាកាដូដ៏មានតម្លៃបំផុត។ ប្រសិនបើលោកអ្នកចង់ផ្ញើចំណងដៃ អាចស្កេនទីនេះ។",
    },
  },

  // Turn sections on (true) or off (false).
  sections: {
    countdown: true,
    parents: true,
    schedule: true,
    venue: true,
    gallery: true,
    dressCode: true,
    gift: true,
    rsvp: true,
    wishes: true,
  },
};
