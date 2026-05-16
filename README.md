# 🗡️ Daily Brutal Quotes

> One new motivational quote every day — on your screen, on your lock screen, in your face.

A zero-database, fully static-compatible quote system that:
- Shows a deterministic **quote of the day** (same for all users globally)
- Generates a styled **PNG wallpaper** on-demand for iPhone lock screens
- Provides a clean **JSON API** for integrations
- Supports **iPhone Shortcuts** automation for daily wallpaper updates
- Ships with a beautiful **neobrutalism UI** (+ raw brutalism toggle)

---

## ✨ Features

| Feature | Details |
|---|---|
| 365 quotes | One per day, cycles annually |
| 3 wallpaper themes | Neo (yellow), Dark, Brutal (white/mono) |
| Zero database | Pure date-math, no storage needed |
| iPhone-ready | Image endpoint works with iOS Shortcuts |
| CORS enabled | Fetch from anywhere |
| Vercel-ready | Deploy in 30 seconds |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- npm

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/SilentComet/daily-brutal-quotes.git
cd daily-brutal-quotes

# 2. Install dependencies
npm install

# 3. Start local server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

---

## 📡 API Reference

All endpoints are public, require no authentication, and return CORS headers.

### `GET /api/quote`

Returns today's quote as JSON.

```json
{
  "success": true,
  "text": "Action is the only language reality understands.",
  "number": 1,
  "index": 0,
  "date": "2025-01-01",
  "total": 365,
  "generatedAt": "2025-01-01T08:00:00.000Z"
}
```

**Query parameters:**

| Param | Example | Description |
|-------|---------|-------------|
| `date` | `?date=2025-12-25` | Quote for a specific date (YYYY-MM-DD) |
| `n` | `?n=42` | Get quote by number (1–365) |

---

### `GET /api/image`

Returns today's quote as a **PNG image** (1170×2532 px, iPhone 14 size).

**Query parameters:**

| Param | Example | Description |
|-------|---------|-------------|
| `theme` | `?theme=neo` | `neo` (default), `dark`, or `brutal` |
| `date` | `?date=2025-12-25` | Image for a specific date |
| `n` | `?n=42` | Image for a specific quote number |

**Examples:**
```
/api/image                          → Today, Neo theme
/api/image?theme=dark               → Today, Dark theme
/api/image?theme=neo&date=2025-06-01 → June 1st, Neo theme
/api/image?n=100                    → Quote #100, Neo theme
```

---

## ☁️ Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# From the project directory
vercel

# Follow the prompts:
# - Link to your Vercel account
# - Project name: daily-brutal-quotes
# - Framework: Other
# - Output directory: public

# For production deployment:
vercel --prod
```

Your app will be live at: `https://daily-brutal-quotes.vercel.app`

### Option B — GitHub + Vercel Dashboard

1. Push the project to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Framework preset: **Other**
5. Build command: `npm install`
6. Output directory: `public`
7. Click **Deploy**

> **Note on `@napi-rs/canvas`:** This project uses `@napi-rs/canvas` instead of `node-canvas` — it ships pre-built Rust binaries with no native compilation needed on Vercel.

---

## 📱 iPhone Shortcut — Automatic Daily Lock Screen

This is the killer feature. Set it up once, forget it forever.

### Step-by-step

1. **Open the Shortcuts app** on your iPhone

2. **Create a new shortcut** → tap **+**

3. **Add action:** Search for `Get Contents of URL`
   - URL: `https://your-domain.vercel.app/api/image?theme=neo`
   - Method: `GET`
   - *(Change `theme` to `dark` or `brutal` if you prefer)*

4. **Add action:** Search for `Set Wallpaper`
   - Wallpaper: *magic variable from step above*
   - Show Preview: `OFF` *(so it runs silently)*
   - Set: `Lock Screen` or `Both`

5. **Name the shortcut:** `Daily Quote Wallpaper`

6. **Create an Automation:**
   - Go to the **Automation** tab
   - Tap **+** → **Personal Automation**
   - Trigger: **Time of Day** (e.g., 7:00 AM, Daily)
   - Action: Run the shortcut you just created
   - **Disable "Ask Before Running"** ← important!

### That's it. Every morning at 7 AM, your lock screen updates automatically.

---

## 🎨 Wallpaper Themes

| Theme | Background | Text | Best for |
|-------|-----------|------|---------|
| `neo` | Yellow `#FFED47` | Black | Bold, energetic |
| `dark` | Black `#0D0D0D` | White/Yellow | Night mode, OLED |
| `brutal` | White `#FFFFFF` | Black mono | Minimal, clean |

---

## 🧮 How the Quote Algorithm Works

```js
const START_DATE = new Date("2025-01-01T00:00:00Z");
const daysSinceStart = Math.floor((today - START_DATE) / 86_400_000);
const index = ((daysSinceStart % QUOTES.length) + QUOTES.length) % QUOTES.length;
```

- **Deterministic:** Same date = same quote for every user globally
- **UTC-based:** No timezone issues
- **Cyclical:** After 365 days, it repeats from the beginning
- **No database:** Zero infrastructure needed

---

## 📁 Project Structure

```
daily-brutal-quotes/
├── api/
│   ├── quote.js          # GET /api/quote → JSON
│   └── image.js          # GET /api/image → PNG wallpaper
├── lib/
│   └── quotes.js         # 365 quotes + date logic
├── public/
│   └── index.html        # Frontend UI (self-contained)
├── server.js             # Local Express dev server
├── package.json
├── vercel.json           # Vercel deployment config
└── README.md
```

---

## 🛠️ Customization

### Add your own quotes

Edit `lib/quotes.js` — add strings to the `QUOTES` array:

```js
const QUOTES = [
  "Your custom quote here.",
  "Another quote.",
  // ...
];
```

### Change the start date

In `lib/quotes.js`, update `START_DATE`:

```js
const START_DATE = new Date("2025-01-01T00:00:00Z");
```

### Change wallpaper dimensions

In `api/image.js`, update `W` and `H`:

```js
const W = 1290; // iPhone 15 Pro Max
const H = 2796;
```

Common sizes:
- `1170 × 2532` — iPhone 12/13/14
- `1179 × 2556` — iPhone 15
- `1290 × 2796` — iPhone 15 Plus/Pro Max
- `1284 × 2778` — iPhone 12/13/14 Pro Max

---

## 📄 License

MIT — do whatever you want with it.

---

*Built with Node.js, Express, @napi-rs/canvas, and zero-database philosophy.*
