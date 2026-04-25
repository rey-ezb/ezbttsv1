/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

// Dev-only safety: stale/half-written .next output can cause "Cannot find module ...chunk..."
// on Windows. Starting from a clean folder is cheap and prevents confusing 500s.
const nextDir = path.join(__dirname, "..", ".next");

try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log(`[predev] cleaned ${nextDir}`);
  }
} catch (err) {
  console.warn("[predev] could not clean .next (continuing):", err?.message || err);
}

