const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const { getQuoteOfTheDay, getQuoteByNumber } = require('../lib/quotes');

// Register fonts using process.cwd() so it works reliably in Vercel Node runtime
const fontsDir = path.join(process.cwd(), 'public', 'fonts');
try {
  GlobalFonts.registerFromPath(path.join(fontsDir, 'IBMPlexMono-Regular.ttf'), 'IBM Plex Mono');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'IBMPlexMono-Bold.ttf'), 'IBM Plex Mono Bold');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'PlayfairDisplay-Variable.ttf'), 'Playfair Display');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'PlayfairDisplay-Italic.ttf'), 'Playfair Display Italic');
} catch (e) {
  console.error("Failed to register fonts. Text may render incorrectly.", e);
}

// Word wrapping helper for Canvas
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let startY = y;

  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, startY);
      line = words[n] + ' ';
      startY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, startY);
  return startY;
}

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const theme = url.searchParams.get('theme') || 'neo';
    const dateParam = url.searchParams.get('date');
    const nParam = url.searchParams.get('n');

    if (!['neo', 'dark', 'brutal'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    const quote = nParam 
      ? getQuoteByNumber(parseInt(nParam, 10))
      : getQuoteOfTheDay(dateParam || null);

    const isDark = theme === 'dark';
    const isBrutal = theme === 'brutal';
    const isNeo = theme === 'neo';

    const W = 1170;
    const H = 2532;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Theme Variables
    const bg = isDark ? '#0D0D0D' : (isBrutal ? '#FFFFFF' : '#FFED47');
    const textCol = isDark ? '#F0F0F0' : (isBrutal ? '#000000' : '#1A1A1A');
    const accent = isDark ? '#FFED47' : (isBrutal ? '#000000' : '#1A1A1A');
    const border = isDark ? '#2A2A2A' : (isBrutal ? '#000000' : '#1A1A1A');
    const tagBg = isDark ? '#FFED47' : (isBrutal ? '#000000' : '#1A1A1A');
    const tagText = isDark ? '#0D0D0D' : (isBrutal ? '#FFFFFF' : '#FFED47');
    const mutedText = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.45)';
    const numColor = isDark ? 'rgba(255,237,71,0.05)' : (isBrutal ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.07)');

    // 1. Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Inner Frame (Neo & Brutal)
    if (isNeo || isBrutal) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 24;
      ctx.strokeRect(48, 48, W - 96, H - 96);
      
      ctx.fillStyle = border;
      ctx.fillRect(36, 36, 24, 24);
      ctx.fillRect(W - 60, 36, 24, 24);
      ctx.fillRect(36, H - 60, 24, 24);
      ctx.fillRect(W - 60, H - 60, 24, 24);
    }

    // 3. Huge Watermark Number
    ctx.fillStyle = numColor;
    ctx.font = '700 620px "IBM Plex Mono Bold"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(quote.number, W / 2, H / 2 + 50);

    // 4. Top Header
    ctx.fillStyle = accent;
    ctx.font = '700 34px "IBM Plex Mono Bold"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headerStr = "DAILY  BRUTAL  QUOTES";
    ctx.fillText(headerStr, W / 2, 168);
    ctx.fillRect(96, 230, W - 192, isBrutal ? 6 : 4);

    // 5. Quote Area
    const qX = 96 + 8;
    let qY = H * 0.27;

    // Opening Quote Mark
    ctx.font = '700 200px "Playfair Display"';
    if (isBrutal) ctx.font = '700 200px "IBM Plex Mono Bold"';
    ctx.fillStyle = isDark ? 'rgba(255,237,71,0.07)' : (isBrutal ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.10)');
    ctx.textAlign = 'left';
    ctx.fillText('"', qX - 20, qY);

    // Quote Text
    let fontSize = 88;
    if (quote.text.length > 150) fontSize = 72;
    if (quote.text.length > 200) fontSize = 60;
    if (quote.text.length > 250) fontSize = 50;

    ctx.font = `italic 700 ${fontSize}px "Playfair Display Italic"`;
    if (isBrutal) ctx.font = `700 ${fontSize}px "IBM Plex Mono Bold"`;
    ctx.fillStyle = textCol;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const lastY = wrapText(ctx, quote.text, qX, qY + 40, W - 208, fontSize * 1.35);

    // 6. Accent Line
    const currentY = lastY + 100;
    ctx.fillStyle = isDark ? '#FFED47' : (isBrutal ? '#000000' : '#FF4B4B');
    ctx.fillRect(qX, currentY, 140, 7);

    // 7. Meta (Badge + Date)
    const metaY = currentY + 60;

    if (isNeo) {
      ctx.fillStyle = border;
      ctx.fillRect(qX + 7, metaY + 7, 180, 60);
    }

    ctx.fillStyle = tagBg;
    if (isBrutal) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 4;
      ctx.strokeRect(qX, metaY, 180, 60);
    }
    ctx.fillRect(qX, metaY, 180, 60);

    ctx.fillStyle = tagText;
    ctx.font = '700 30px "IBM Plex Mono Bold"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`No. ${String(quote.number).padStart(3, "0")}`, qX + 90, metaY + 30);

    const dateStr = new Date(quote.date + "T00:00:00Z").toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
    });
    ctx.fillStyle = mutedText;
    ctx.font = '400 26px "IBM Plex Mono"';
    ctx.textAlign = 'left';
    ctx.fillText(dateStr, qX + 210, metaY + 30);

    // 8. Footer URL
    ctx.fillStyle = mutedText;
    ctx.font = '400 24px "IBM Plex Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('daily-brutal-quotes.vercel.app', W / 2, H - 110);

    const buffer = await canvas.encode('png');
    
    res.setHeader('Content-Type', 'image/png');
    // We intentionally removed the aggressive Cache-Control in vercel.json. We can add a simple one here.
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.send(buffer);
  } catch (error) {
    console.error('Canvas rendering error:', error);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
};
