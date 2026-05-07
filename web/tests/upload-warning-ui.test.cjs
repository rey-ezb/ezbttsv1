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

test("upload flow exposes a warning dialog for unmapped SKUs", () => {
  const js = readPlannerApp();
  const html = readPlannerHtml();

  assert.match(html, /id="upload-sku-warning-dialog"/);
  assert.match(html, /id="upload-sku-warning-body"/);
  assert.match(html, /id="upload-sku-warning-continue"/);
  assert.match(html, /id="upload-sku-warning-save-continue"/);

  assert.match(js, /inspectUploadSkuMappings/);
  assert.match(js, /openUploadSkuWarningDialog/);
  assert.match(js, /continue upload with warning/i);
});
