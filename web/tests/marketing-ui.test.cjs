const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readPublic(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", "public", relativePath), "utf8");
}

test("planner marketing pages are present and wired in UI bundle", () => {
  const html = readPublic("planner.html");
  const js = readPublic("planner-app.js");

  assert.match(html, /data-page-target="campaigns"/);
  assert.match(html, /data-page-target="launch-planning"/);
  assert.match(html, /id="page-campaigns"/);
  assert.match(html, /id="page-launch-planning"/);
  assert.match(html, /id="campaign-form"/);
  assert.match(html, /id="launch-plan-form"/);

  assert.match(js, /MARKETING_STORAGE_KEY/);
  assert.match(js, /\/api\/marketing-config/);
  assert.match(js, /marketingConfig/);
  assert.match(js, /page-campaigns/);
  assert.match(js, /page-launch-planning/);
});

test("gross sales helper explicitly calls out cancelled orders", () => {
  const js = readPublic("planner-app.js");
  assert.match(js, /Gross sales[^]*cancelled orders/);
});

test("planner UI has shared product display formatting and alphabetical product sorting", () => {
  const js = readPublic("planner-app.js");
  assert.match(js, /function displayProductName/);
  assert.match(js, /replaceAll\("2-Pack", "2P"\)/);
  assert.match(js, /function sortRowsByProductName/);
});
