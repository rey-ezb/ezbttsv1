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

test("baseline net gross falls back to gross when net units are positive and net_gross_sales is 0 (back-compat)", () => {
  const { computeBaselineDemandByProduct } = requireTs("lib/planner-math.ts");
  const stats = computeBaselineDemandByProduct({
    productNames: ["Birria Bomb 2-Pack"],
    baselineDemandRows: [
      {
        date: "2026-04-01",
        product_name: "Birria Bomb 2-Pack",
        net_units: 2,
        gross_sales: 39.98,
        net_gross_sales: 0,
      },
      {
        date: "2026-04-02",
        product_name: "Birria Bomb 2-Pack",
        net_units: 0,
        gross_sales: 19.99,
        net_gross_sales: 0,
      },
    ],
    baselineSampleRows: [],
    baselineDays: 2,
    velocityMode: "sales_only",
    excludeSpikes: false,
  });

  const row = stats.get("Birria Bomb 2-Pack");
  assert.ok(row);
  // Net units > 0 row falls back to gross, net_units=0 row contributes $0.
  assert.equal(row.netGrossSales, 39.98);
});

