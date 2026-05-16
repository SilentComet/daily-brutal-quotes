const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const { getQuoteOfTheDay, getQuoteByNumber } = require('../lib/quotes');

// ── Font registration ──────────────────────────────────────────────────────
const FONTS_DIR = path.join(__dirname, '..', 'public', 'fonts');
const FONT = 'IBM Plex Mono';

try {
  const fonts = [
    ['IBMPlexMono-Regular.ttf', 'IBM Plex Mono'],
    ['IBMPlexMono-Bold.ttf', 'IBM Plex Mono'],
    ['PlayfairDisplay-Italic.ttf', 'Playfair Display'],
  ];

  for (const [file, family] of fonts) {
    const fontPath = path.join(FONTS_DIR, file);
    if (fs.existsSync(fontPath)) {
      GlobalFonts.registerFromPath(fontPath, family);
    }
  }
} catch (err) {
  console.warn('Font load failed, using fallback:', err.message);
}

// ── Word wrap helper ───────────────────────────────────────────────────────
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Handler ────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { theme = 'neo', date, n } = req.query;
    const allowedThemes = new Set(['neo', 'dark', 'brutal']);

    if (!allowedThemes.has(theme)) {
      return res.status(400).json({
        error: 'Query param "theme" must be neo, dark, or brutal.',
      });
    }

    const quote = n !== undefined
      ? getQuoteByNumber(Number(n))
      : getQuoteOfTheDay(date || null);

    const W = 1170;
    const H = 2532;

    const isDark = theme === 'dark';
    const isBrutal = theme === 'brutal';

    const bg = isDark ? '#0D0D0D' : isBrutal ? '#FFFFFF' : '#FFED47';
    const fg = isDark ? '#F0F0F0' : '#1A1A1A';
    const accent = isDark ? '#FFED47' : '#000000';

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Border (neobrutalism)
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Quote number
    ctx.fillStyle = accent;
    ctx.font = `bold 48px "${FONT}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`#${String(quote.number).padStart(3, '0')}`, 100, 300);

    // Accent bar
    ctx.fillStyle = accent;
    ctx.fillRect(100, 330, 120, 8);

    // Quote text — centred vertically
    ctx.fillStyle = fg;
    ctx.font = `bold 72px "${FONT}"`;
    ctx.textAlign = 'left';

    const lines = wrapText(ctx, quote.text, W - 200);
    const lineHeight = 100;
    let y = (H - lines.length * lineHeight) / 2;

    for (const line of lines) {
      ctx.fillText(line, 100, y);
      y += lineHeight;
    }

    // Date label
    const label = date || new Date().toISOString().split('T')[0];
    ctx.fillStyle = isDark ? 'rgba(240,240,240,0.4)' : 'rgba(0,0,0,0.35)';
    ctx.font = `32px "${FONT}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, W / 2, H - 120);

    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.end(buffer);

  } catch (err) {
    console.error('Image generation error:', err);
    res.status(400).json({ error: err.message });
  }
};
