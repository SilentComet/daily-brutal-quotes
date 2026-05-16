/**
 * api/image.js — Local development fallback for image generation.
 *
 * This version uses 'sharp' to create a simple PNG representation.
 * It's meant for local testing when @vercel/og (Satori) isn't available.
 */

const sharp = require('sharp');
const { getQuoteOfTheDay, getQuoteByNumber } = require("../lib/quotes");

module.exports = async function handler(req, res) {
  try {
    const { theme = 'neo', date, n } = req.query;

    let quote;
    if (n) {
      quote = getQuoteByNumber(parseInt(n, 10));
    } else {
      quote = getQuoteOfTheDay(date || null);
    }

    const isDark = theme === 'dark';
    const isBrutal = theme === 'brutal';

    const bg = isDark ? '#0D0D0D' : (isBrutal ? '#FFFFFF' : '#FFED47');
    const textCol = isDark ? '#F0F0F0' : (isBrutal ? '#000000' : '#1A1A1A');

    const width = 1170;
    const height = 2532;

    // Create a simple SVG template
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bg}" />
        <text x="50%" y="40%" font-family="monospace" font-size="60" fill="${textCol}" text-anchor="middle" font-weight="bold">
          ${quote.text.length > 40 ? quote.text.substring(0, 40) + '...' : quote.text}
        </text>
        <text x="50%" y="50%" font-family="monospace" font-size="40" fill="${textCol}" text-anchor="middle">
          No. ${String(quote.number).padStart(3, '0')}
        </text>
        <text x="50%" y="90%" font-family="monospace" font-size="30" fill="${textCol}" text-anchor="middle" opacity="0.5">
          [LOCAL DEV MODE]
        </text>
      </svg>
    `;

    const png = await sharp(Buffer.from(svg)).png().toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(png);

  } catch (err) {
    console.error(err);
    res.status(500).send('Local image generation failed');
  }
};
