const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readPlannerApp() {
  return fs.readFileSync(path.join(__dirname, "..", "public", "planner-app.js"), "utf8");
}

function readPlannerHtml() {
  return fs.readFileSync(path.join(__dirname, "..", "public", "planner.html"), "utf8");
}

test("forecast dialog keeps lift inputs editable when product lifts are active", () => {
  const js = readPlannerApp();
  const html = readPlannerHtml();

  // Do not disable the mix inputs just because lifts are present.
  assert.ok(js.includes('querySelectorAll("input[data-product-mix]")'));
  assert.ok(js.includes("input.disabled = readOnly;"));

  // When lifts are present, keep the product grid stable (no innerHTML rewrite per keystroke),
  // otherwise the cursor jumps to the front while typing.
  const syncStart = js.indexOf("function syncForecastInputsFromProductLifts");
  assert.ok(syncStart > -1);
  const syncBlock = js.slice(syncStart, js.indexOf("function renderForecastProductMixInputs", syncStart));
  assert.ok(!syncBlock.includes("renderForecastProductMixInputs("));

  // Saving should always persist the user-entered mix inputs (even when lifts are active).
  assert.ok(js.includes("const productMix = Object.fromEntries("));
  assert.ok(js.includes("productMix,")); // used in the setting payload

  // Copy mix controls exist.
  assert.match(html, /id="forecast-copy-mix-month"/);
  assert.match(html, /id="forecast-copy-mix-apply"/);
  assert.match(html, /id="forecast-copy-mix-hint"/);
  assert.match(js, /applyCopiedMixFromMonth/);
});
