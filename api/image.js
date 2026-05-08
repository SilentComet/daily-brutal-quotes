/**
 * /api/image — Returns today's quote as a PNG wallpaper image.
 *
 * Approach: Build an SVG string, then convert to PNG via `sharp`.
 * This avoids @napi-rs/canvas font-loading issues on Vercel serverless —
 * sharp uses libvips which always available and renders SVG text natively.
 *
 * Dimensions: 1170×2532 (iPhone 14 Pro resolution)
 *
 * Query params:
 *   ?theme=neo        Neobrutalism (default) — yellow bg, black text
 *   ?theme=dark       Dark mode — black bg, white/yellow text
 *   ?theme=brutal     Raw brutalism — white bg, black mono text
 *   ?date=YYYY-MM-DD  Override date
 *   ?n=42             Quote by number (1-365)
 */

const sharp = require("sharp");
const { getQuoteOfTheDay, getQuoteByNumber } = require("../lib/quotes");

const W = 1170;
const H = 2532;

const THEMES = {
  neo: {
    bg: "#FFED47", text: "#1A1A1A", accent: "#1A1A1A",
    border: "#1A1A1A", tagBg: "#1A1A1A", tagText: "#FFED47",
    lineColor: "#FF4B4B", mutedText: "rgba(0,0,0,0.45)",
    numberColor: "rgba(0,0,0,0.07)", quoteMark: "rgba(0,0,0,0.10)",
    quoteFont: "Georgia, 'Times New Roman', serif",
    monoFont:  "'Courier New', Courier, monospace",
  },
  dark: {
    bg: "#0D0D0D", text: "#F0F0F0", accent: "#FFED47",
    border: "#2A2A2A", tagBg: "#FFED47", tagText: "#0D0D0D",
    lineColor: "#FFED47", mutedText: "rgba(255,255,255,0.40)",
    numberColor: "rgba(255,237,71,0.05)", quoteMark: "rgba(255,237,71,0.07)",
    quoteFont: "Georgia, 'Times New Roman', serif",
    monoFont:  "'Courier New', Courier, monospace",
  },
  brutal: {
    bg: "#FFFFFF", text: "#000000", accent: "#000000",
    border: "#000000", tagBg: "#000000", tagText: "#FFFFFF",
    lineColor: "#000000", mutedText: "rgba(0,0,0,0.45)",
    numberColor: "rgba(0,0,0,0.04)", quoteMark: "rgba(0,0,0,0.05)",
    quoteFont: "'Courier New', Courier, monospace",
    monoFont:  "'Courier New', Courier, monospace",
  },
};

/** Wrap text into lines that fit within maxChars characters (SVG heuristic) */
function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Escape XML special characters for safe SVG embedding */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSVG(quote, theme) {
  const t = THEMES[theme] || THEMES.neo;
  const PAD = 96;
  const isBrutal = theme === "brutal";
  const isDark   = theme === "dark";

  // ── Quote text layout ──────────────────────────────────────────────────────
  // Heuristic: target ~22 chars/line at 88px, scale down for long quotes
  const MAX_CHARS_AT_MAX = 22;
  const lines = wrapText(quote.text, MAX_CHARS_AT_MAX);

  let fontSize = 88;
  if (lines.length > 6)  fontSize = 72;
  if (lines.length > 8)  fontSize = 60;
  if (lines.length > 10) fontSize = 50;

  // Re-wrap at the chosen font size (larger font → fewer chars per line)
  const charsPerLine = Math.round(MAX_CHARS_AT_MAX * (88 / fontSize));
  const finalLines   = wrapText(quote.text, charsPerLine);
  const lineHeight   = Math.round(fontSize * 1.35);
  const quoteStartY  = Math.round(H * 0.27);
  const totalTextH   = finalLines.length * lineHeight;
  const afterY       = quoteStartY + totalTextH + 60;
  const badgeY       = afterY + 54;

  // Date string
  const dateStr = new Date(quote.date + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });

  const badgeText  = `No. ${String(quote.number).padStart(3, "0")}`;
  const badgePadX  = 26;
  const badgePadY  = 16;
  const badgeH     = 30 + badgePadY * 2;
  // Estimate badge width (monospace ~18px per char at 30px font)
  const badgeW     = badgeText.length * 18 + badgePadX * 2;

  // ── SVG pieces ─────────────────────────────────────────────────────────────

  // Border frame (neo & brutal)
  const BW = 24, BM = 48;
  const borderFrame = (theme === "neo" || theme === "brutal") ? `
    <!-- Border frame -->
    <rect x="${BM + BW/2}" y="${BM + BW/2}"
          width="${W - BM*2 - BW}" height="${H - BM*2 - BW}"
          fill="none" stroke="${t.border}" stroke-width="${BW}"/>
    <!-- Corner squares -->
    <rect x="${BM - BW/2}" y="${BM - BW/2}" width="${BW}" height="${BW}" fill="${t.border}"/>
    <rect x="${W - BM - BW/2}" y="${BM - BW/2}" width="${BW}" height="${BW}" fill="${t.border}"/>
    <rect x="${BM - BW/2}" y="${H - BM - BW/2}" width="${BW}" height="${BW}" fill="${t.border}"/>
    <rect x="${W - BM - BW/2}" y="${H - BM - BW/2}" width="${BW}" height="${BW}" fill="${t.border}"/>
  ` : "";

  // Dark dot grid
  let dotGrid = "";
  if (isDark) {
    const dots = [];
    for (let x = 60; x < W; x += 70) {
      for (let y = 60; y < H; y += 70) {
        dots.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="rgba(255,255,255,0.04)"/>`);
      }
    }
    dotGrid = dots.join("\n");
  }

  // Badge shadow (neo only)
  const badgeShadow = theme === "neo"
    ? `<rect x="${PAD + 8 + 7}" y="${badgeY + 7}" width="${badgeW}" height="${badgeH}" fill="${t.border}"/>`
    : "";

  // Badge border (brutal only)
  const badgeBorder = isBrutal
    ? `stroke="${t.border}" stroke-width="4"`
    : `stroke="none"`;

  // Quote text lines
  const quoteLines = finalLines.map((line, i) => {
    const y = quoteStartY + i * lineHeight;
    return `<text x="${PAD + 8}" y="${y}"
      font-family="${t.quoteFont}"
      font-size="${fontSize}"
      font-weight="bold"
      font-style="${isBrutal ? "normal" : "italic"}"
      fill="${t.text}"
      dominant-baseline="auto"
      >${esc(line)}</text>`;
  }).join("\n");

  // ── Assemble SVG ───────────────────────────────────────────────────────────
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      text { font-synthesis: none; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${t.bg}"/>

  ${dotGrid}
  ${borderFrame}

  <!-- Watermark number -->
  <text x="${W/2}" y="${H/2 + 320}"
    font-family="${t.monoFont}"
    font-size="620"
    font-weight="bold"
    fill="${t.numberColor}"
    text-anchor="middle"
    dominant-baseline="auto"
    >${quote.number}</text>

  <!-- Header -->
  <text x="${W/2}" y="168"
    font-family="${t.monoFont}"
    font-size="34"
    font-weight="bold"
    fill="${t.accent}"
    text-anchor="middle"
    dominant-baseline="auto"
    letter-spacing="6"
    >DAILY  BRUTAL  QUOTES</text>
  <line x1="${PAD}" y1="192" x2="${W - PAD}" y2="192"
    stroke="${t.accent}" stroke-width="${isBrutal ? 6 : 4}"/>

  <!-- Opening quote mark -->
  <text x="${PAD - 12}" y="540"
    font-family="${t.quoteFont}"
    font-size="200"
    font-weight="bold"
    fill="${t.quoteMark}"
    dominant-baseline="auto"
    >&#8220;</text>

  <!-- Quote text -->
  ${quoteLines}

  <!-- Accent line -->
  <line x1="${PAD + 8}" y1="${afterY}" x2="${PAD + 8 + 140}" y2="${afterY}"
    stroke="${t.lineColor}" stroke-width="7" stroke-linecap="square"/>

  <!-- Badge -->
  ${badgeShadow}
  <rect x="${PAD + 8}" y="${badgeY}" width="${badgeW}" height="${badgeH}"
    fill="${t.tagBg}" ${badgeBorder}/>
  <text x="${PAD + 8 + badgePadX}" y="${badgeY + badgePadY + 24}"
    font-family="${t.monoFont}"
    font-size="30"
    font-weight="bold"
    fill="${t.tagText}"
    dominant-baseline="auto"
    >${esc(badgeText)}</text>

  <!-- Date -->
  <text x="${PAD + 8 + badgeW + 24}" y="${badgeY + badgePadY + 24}"
    font-family="${t.monoFont}"
    font-size="26"
    fill="${t.mutedText}"
    dominant-baseline="auto"
    >${esc(dateStr)}</text>

  <!-- Footer -->
  <text x="${W/2}" y="${H - 110}"
    font-family="${t.monoFont}"
    font-size="24"
    fill="${t.mutedText}"
    text-anchor="middle"
    dominant-baseline="auto"
    >daily-brutal-quotes.vercel.app</text>
</svg>`;

  return svg;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { date, n, theme = "neo" } = req.query;
    if (!["neo", "dark", "brutal"].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme. Use "neo", "dark", or "brutal".' });
    }

    const quote = n !== undefined
      ? getQuoteByNumber(parseInt(n, 10))
      : getQuoteOfTheDay(date || null);

    const svg = buildSVG(quote, theme);

    // Convert SVG → PNG via sharp (libvips — available on Vercel, no font setup needed)
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", pngBuffer.length);
    res.status(200).end(pngBuffer);
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: "Image generation failed.", detail: err.message });
  }
};
