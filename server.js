/**
 * server.js — Local development server
 *
 * Mirrors the Vercel routing locally:
 *   GET /api/quote  → api/quote.js
 *   GET /api/image  → api/image.js
 *   GET /           → public/index.html
 *   GET /*          → public/*
 *
 * Run:  node server.js
 * Open: http://localhost:3000
 */

const express = require("express");
const path    = require("path");

const quoteHandler = require("./api/quote");
const imageHandler = require("./api/image");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ── API routes ────────────────────────────────────────────────────────────────
app.get("/api/quote", quoteHandler);
app.get("/api/image", imageHandler);

// ── Catch-all → index.html (SPA fallback) ─────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Daily Brutal Quotes — Local Server`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n   Endpoints:`);
  console.log(`   GET http://localhost:${PORT}/api/quote`);
  console.log(`   GET http://localhost:${PORT}/api/quote?date=2025-06-15`);
  console.log(`   GET http://localhost:${PORT}/api/image?theme=neo`);
  console.log(`   GET http://localhost:${PORT}/api/image?theme=dark`);
  console.log(`   GET http://localhost:${PORT}/api/image?theme=brutal`);
  console.log(`\n   Press Ctrl+C to stop.\n`);
});
