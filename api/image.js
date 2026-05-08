/**
 * /api/image — Returns today's quote as a PNG wallpaper image.
 *
 * Uses @napi-rs/canvas — a fast, Rust-based canvas with no native build required.
 * Dimensions: 1170×2532 (iPhone 14 standard)
 *
 * Query params:
 *   ?theme=neo        Neobrutalism (default) — yellow bg, black text
 *   ?theme=dark       Dark mode — black bg, white/yellow text
 *   ?theme=brutal     Raw brutalism — white bg, black mono text
 *   ?date=YYYY-MM-DD  Override date
 *   ?n=42             Quote by number (1-365)
 */

const path = require("path");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const { getQuoteOfTheDay, getQuoteByNumber } = require("../lib/quotes");

// Register bundled fonts so they render correctly on Vercel serverless
// (no system fonts are available in that environment)
const FONTS_DIR = path.join(__dirname, "..", "assets", "fonts");
try {
  GlobalFonts.registerFromPath(path.join(FONTS_DIR, "PlayfairDisplay-Variable.ttf"), "PlayfairDisplay");
  GlobalFonts.registerFromPath(path.join(FONTS_DIR, "PlayfairDisplay-Italic.ttf"),   "PlayfairDisplayItalic");
  GlobalFonts.registerFromPath(path.join(FONTS_DIR, "IBMPlexMono-Bold.ttf"),          "IBMPlexMono");
  GlobalFonts.registerFromPath(path.join(FONTS_DIR, "IBMPlexMono-Regular.ttf"),       "IBMPlexMonoRegular");
} catch (e) {
  console.error("Font registration error:", e.message);
}

const W = 1170;
const H = 2532;

const THEMES = {
  neo: {
    bg: "#FFED47", text: "#1A1A1A", accent: "#1A1A1A",
    secondary: "#FF4B4B", border: "#1A1A1A",
    numberColor: "rgba(0,0,0,0.07)", tagBg: "#1A1A1A", tagText: "#FFED47",
    quoteMark: "rgba(0,0,0,0.10)", mutedText: "rgba(0,0,0,0.40)", lineColor: "#FF4B4B",
  },
  dark: {
    bg: "#0D0D0D", text: "#F0F0F0", accent: "#FFED47",
    secondary: "#FF4B4B", border: "#2A2A2A",
    numberColor: "rgba(255,237,71,0.05)", tagBg: "#FFED47", tagText: "#0D0D0D",
    quoteMark: "rgba(255,237,71,0.07)", mutedText: "rgba(255,255,255,0.38)", lineColor: "#FFED47",
  },
  brutal: {
    bg: "#FFFFFF", text: "#000000", accent: "#000000",
    secondary: "#000000", border: "#000000",
    numberColor: "rgba(0,0,0,0.04)", tagBg: "#000000", tagText: "#FFFFFF",
    quoteMark: "rgba(0,0,0,0.05)", mutedText: "rgba(0,0,0,0.38)", lineColor: "#000000",
  },
};

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitText(ctx, text, maxWidth, startSize, minSize, fontDecl) {
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = fontDecl(size);
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= 9) return { size, lines };
  }
  ctx.font = fontDecl(minSize);
  return { size: minSize, lines: wrapText(ctx, text, maxWidth) };
}

function neoRect(ctx, x, y, w, h, fillColor, borderColor, borderWidth, shadowDist) {
  if (shadowDist > 0) {
    ctx.fillStyle = borderColor;
    ctx.fillRect(x + shadowDist, y + shadowDist, w, h);
  }
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, w, h);
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(x, y, w, h);
  }
}

function renderImage(quote, theme) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const t = THEMES[theme] || THEMES.neo;
  const PAD = 96;
  const CONTENT_W = W - PAD * 2;

  // 1. Background
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // 2. Dark theme dot grid
  if (theme === "dark") {
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let x = 60; x < W; x += 70) {
      for (let y = 60; y < H; y += 70) {
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // 3. Border frame
  if (theme === "neo" || theme === "brutal") {
    const BW = 24, BM = 48;
    ctx.strokeStyle = t.border;
    ctx.lineWidth = BW;
    ctx.strokeRect(BM + BW / 2, BM + BW / 2, W - BM * 2 - BW, H - BM * 2 - BW);
    const cs = 24, cm = BM - cs / 2;
    ctx.fillStyle = t.border;
    [[cm,cm],[W-cm-cs,cm],[cm,H-cm-cs],[W-cm-cs,H-cm-cs]].forEach(([x,y]) => ctx.fillRect(x,y,cs,cs));
  }

  // 4. Background number watermark
  ctx.font = `bold 620px IBMPlexMono, monospace`;
  ctx.fillStyle = t.numberColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(quote.number), W / 2, H / 2 + 320);

  // 5. Top header
  const HEADER_Y = 168;
  ctx.font = `bold 34px IBMPlexMono, monospace`;
  ctx.fillStyle = t.accent;
  ctx.textAlign = "center";
  ctx.fillText("DAILY  BRUTAL  QUOTES", W / 2, HEADER_Y);
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = theme === "brutal" ? 6 : 4;
  ctx.beginPath(); ctx.moveTo(PAD, HEADER_Y + 24); ctx.lineTo(W - PAD, HEADER_Y + 24); ctx.stroke();

  // 6. Opening quote mark
  ctx.font = `bold 200px PlayfairDisplay, serif`;
  ctx.fillStyle = t.quoteMark;
  ctx.textAlign = "left";
  ctx.fillText("\u201C", PAD - 12, 540);

  // 7. Quote text
  const QUOTE_PAD_X = PAD + 8;
  const QUOTE_W = CONTENT_W - 16;
  const QUOTE_FONT = theme === "brutal"
    ? (sz) => `bold ${sz}px IBMPlexMono, monospace`
    : (sz) => `bold italic ${sz}px PlayfairDisplayItalic, PlayfairDisplay, serif`;

  const { size: fontSize, lines } = fitText(ctx, quote.text, QUOTE_W, 88, 44, QUOTE_FONT);
  const lineHeight = fontSize * 1.3;
  const totalTextH = lines.length * lineHeight;
  const QUOTE_START_Y = Math.round(H * 0.27);

  ctx.font = QUOTE_FONT(fontSize);
  ctx.fillStyle = t.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  lines.forEach((line, i) => ctx.fillText(line, QUOTE_PAD_X, QUOTE_START_Y + i * lineHeight));

  // 8. Accent line
  const AFTER_Y = QUOTE_START_Y + totalTextH + 60;
  ctx.strokeStyle = t.lineColor;
  ctx.lineWidth = 7;
  ctx.lineCap = "square";
  ctx.beginPath(); ctx.moveTo(QUOTE_PAD_X, AFTER_Y); ctx.lineTo(QUOTE_PAD_X + 140, AFTER_Y); ctx.stroke();

  // 9. Number badge
  const BADGE_Y = AFTER_Y + 54;
  const BADGE_TEXT = `No. ${String(quote.number).padStart(3, "0")}`;
  ctx.font = "bold 30px IBMPlexMono, monospace";
  const bTextW = ctx.measureText(BADGE_TEXT).width;
  const bPadX = 26, bPadY = 16;
  const bW = bTextW + bPadX * 2, bH = 30 + bPadY * 2;
  neoRect(ctx, QUOTE_PAD_X, BADGE_Y, bW, bH, t.tagBg, t.border,
    theme === "brutal" ? 4 : 0,
    theme === "neo" ? 7 : 0
  );
  ctx.fillStyle = t.tagText;
  ctx.font = "bold 30px IBMPlexMono, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(BADGE_TEXT, QUOTE_PAD_X + bPadX, BADGE_Y + bPadY + 24);

  // 10. Date
  const dateStr = new Date(quote.date + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
  ctx.font = "26px IBMPlexMonoRegular, IBMPlexMono, monospace";
  ctx.fillStyle = t.mutedText;
  ctx.textAlign = "left";
  ctx.fillText(dateStr, QUOTE_PAD_X + bW + 24, BADGE_Y + bPadY + 24);

  // 11. Footer branding
  ctx.font = "24px IBMPlexMonoRegular, IBMPlexMono, monospace";
  ctx.fillStyle = t.mutedText;
  ctx.textAlign = "center";
  ctx.fillText("daily-brutal-quotes.vercel.app", W / 2, H - 110);

  return canvas;
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

    const canvas = renderImage(quote, theme);
    const pngBuffer = await canvas.encode("png");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", pngBuffer.length);
    res.status(200).end(pngBuffer);
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: "Image generation failed.", detail: err.message });
  }
};
