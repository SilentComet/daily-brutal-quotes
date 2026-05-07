/**
 * /api/quote — Returns today's quote as JSON.
 *
 * Query params:
 *   ?date=YYYY-MM-DD   Override the date
 *   ?n=42              Get quote by number (1–365)
 *
 * Example response:
 *   {
 *     "success": true,
 *     "text": "Action is the only language reality understands.",
 *     "number": 1,
 *     "index": 0,
 *     "date": "2025-01-01",
 *     "total": 365,
 *     "generatedAt": "2025-05-07T10:23:45.123Z"
 *   }
 */

const { getQuoteOfTheDay, getQuoteByNumber } = require("../lib/quotes");

module.exports = function handler(req, res) {
  // CORS — allow any client (needed for iPhone Shortcuts via web fetch)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // Cache for 1 hour on Vercel CDN
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { date, n } = req.query;

    let quote;
    if (n !== undefined) {
      const num = parseInt(n, 10);
      if (isNaN(num) || num < 1) {
        return res.status(400).json({
          success: false,
          error: 'Query param "n" must be a positive integer.',
        });
      }
      quote = getQuoteByNumber(num);
    } else {
      quote = getQuoteOfTheDay(date || null);
    }

    return res.status(200).json({
      success: true,
      ...quote,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};
