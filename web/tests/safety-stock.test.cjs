const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

function requireTs(relativePath) {
  const filePath = path.join(__dirname, "..", relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = new Module(filePath, module);
  mod.filename = filePath;
  mod.paths = Module._nodeModulePaths(path.dirname(filePath));
  mod._compile(output.outputText, filePath);
  return mod.exports;
}

test("safety stock weeks switches by half-year and respects overrides", () => {
  const { safetyStockWeeksForDate, safetyStockWeeksForProduct } = requireTs("lib/safety-stock.ts");

  assert.equal(
    safetyStockWeeksForDate("2026-03-01", { safetyStockWeeksH1: 3, safetyStockWeeksH2: 5 }),
    3,
  );
  assert.equal(
    safetyStockWeeksForDate("2026-10-15", { safetyStockWeeksH1: 3, safetyStockWeeksH2: 5 }),
    5,
  );

  assert.equal(
    safetyStockWeeksForProduct({ date: "2026-03-01", global: { safetyStockWeeksH1: 3, safetyStockWeeksH2: 5 }, productOverrideWeeks: 0 }),
    3,
  );
  assert.equal(
    safetyStockWeeksForProduct({ date: "2026-10-15", global: { safetyStockWeeksH1: 3, safetyStockWeeksH2: 5 }, productOverrideWeeks: 7 }),
    7,
  );
});

