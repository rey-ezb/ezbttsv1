const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readPublic(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", "public", relativePath), "utf8");
}

test("historical trends tab exposes forecasting helpers instead of tables only", () => {
  const html = readPublic("planner.html");
  const js = readPublic("planner-app.js");

  assert.match(html, /id="historical-forecast-signals"/);
  assert.match(html, /id="historical-demand-trend-chart"/);
  assert.match(html, /id="historical-seasonality-head"/);
  assert.match(html, /id="historical-seasonality-body"/);
  assert.match(html, /id="historical-anchor-head"/);
  assert.match(html, /id="historical-anchor-body"/);

  assert.match(js, /function renderHistoricalForecastSignals/);
  assert.match(js, /function renderHistoricalDemandTrendChart/);
  assert.match(js, /function renderHistoricalSeasonality/);
  assert.match(js, /function renderHistoricalForecastAnchors/);
  assert.match(js, /renderHistoricalForecastSignals\(payload\)/);
  assert.match(js, /renderHistoricalDemandTrendChart\(payload\)/);
  assert.match(js, /Suggested units/);
});
