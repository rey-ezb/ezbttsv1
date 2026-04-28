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

test("planner exposes a separate history-only drivers tab", () => {
  const html = readPlannerHtml();
  const js = readPlannerApp();

  assert.match(html, /data-results-tab="history-only"/);
  assert.match(html, />History-only drivers</);
  assert.match(js, /activeResultsTab === "history-only"/);
  assert.match(js, /History-only drivers/);
  assert.match(js, /History-only cover/);
});

test("planned drivers expose a planned order trigger column", () => {
  const js = readPlannerApp();

  assert.match(js, /Planned order trigger/);
  assert.match(js, /reorder_point_units/);
});

test("drivers views expose trigger visibility badges and row emphasis hooks", () => {
  const js = readPlannerApp();
  const css = fs.readFileSync(path.join(__dirname, "..", "public", "planner-styles.css"), "utf8");

  assert.match(js, /trigger-badge/);
  assert.match(js, /results-row-risk-below/);
  assert.match(js, /results-row-risk-close/);
  assert.match(js, /Order in/);
  assert.match(js, /Order now/);
  assert.match(js, /overdue/);
  assert.match(css, /\.trigger-badge/);
  assert.match(css, /\.results-row-risk-below td/);
  assert.match(css, /\.results-row-risk-close td/);
});

test("recommended order stays planned-only with its own trigger column", () => {
  const js = readPlannerApp();

  assert.match(js, /\["Planned order trigger", "reorder_point_units"\]/);
  assert.doesNotMatch(js, /Planned trig/);
  assert.doesNotMatch(js, /History trig/);
  assert.match(
    js,
    /\["Status", "status"\][\s\S]*\["On hand", "on_hand"\][\s\S]*\["In transit", "in_transit"\][\s\S]*\["Planned order trigger", "reorder_point_units"\][\s\S]*\["Order now", "recommended_order_units"\][\s\S]*\["Capital needed", "capital_required"\][\s\S]*\["Order-by date", "reorder_date"\][\s\S]*\["Projected stockout date", "projected_stockout_date"\]/
  );
});

test("recommended order includes a reading guide pill row", () => {
  const html = readPlannerHtml();
  const js = readPlannerApp();
  const css = fs.readFileSync(path.join(__dirname, "..", "public", "planner-styles.css"), "utf8");

  assert.match(html, /id="results-reading-guide"/);
  assert.match(html, /Current position/);
  assert.match(html, /Planned order trigger/);
  assert.match(js, /resultsReadingGuide/);
  assert.match(js, /activeResultsTab !== "reorder"/);
  assert.match(css, /\.results-reading-guide/);
  assert.match(css, /\.results-guide-pill/);
});

test("recommended order visually emphasizes the order now cell", () => {
  const js = readPlannerApp();
  const css = fs.readFileSync(path.join(__dirname, "..", "public", "planner-styles.css"), "utf8");

  assert.match(js, /order-now-emphasis/);
  assert.match(js, /order-now-cell/);
  assert.match(css, /\.order-now-emphasis/);
  assert.match(css, /\.order-now-value/);
});
