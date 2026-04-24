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

test("promotions: planner source keeps past campaign dates in the baseline window", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "lib", "hosted-planner.ts"), "utf8");
  assert.doesNotMatch(source, /baselineDemandRowsRaw\.filter\(\(row\) => !excludedBaselineDates\.has\(row\.date\)\)/);
  assert.doesNotMatch(source, /baselineSampleRowsRaw\.filter\(\(row\) => !excludedBaselineDates\.has\(row\.date\)\)/);
  assert.doesNotMatch(source, /baselineDaysRaw - excludedBaselineDates\.size/);
});

test("promotions: horizon lift factor averages the lift over the planning range", () => {
  const { campaignAverageLiftFactor } = requireTs("lib/marketing-math.ts");
  const campaigns = [{ startDate: "2026-05-03", endDate: "2026-05-04", liftPct: 50 }];
  const factor = campaignAverageLiftFactor(campaigns, "2026-05-01", "2026-05-10");
  // 10 days horizon, 2 promo days at +50% => avg factor = 1 + 0.5*(2/10) = 1.1
  assert.ok(Math.abs(factor - 1.1) < 1e-9);
});

test("launch plans: proxy daily demand + strength and horizon active days are computed correctly", () => {
  const { launchActiveDaysInHorizon, launchDailyDemandFromProxyAvg } = requireTs("lib/marketing-math.ts");
  const plan = {
    productName: "New Product",
    proxyProductName: "Birria Bomb 2-Pack",
    launchDate: "2026-05-05",
    endDate: null,
    launchUnitsCommitted: 500,
    launchStrengthPct: 50,
  };
  assert.equal(launchActiveDaysInHorizon(plan, "2026-05-01", "2026-05-10"), 6);
  assert.equal(launchDailyDemandFromProxyAvg(20, 50), 10);
});

test("gross sales regression: gross can include cancelled GMV even when net units are 0", () => {
  const { computeBaselineDemandByProduct } = requireTs("lib/planner-math.ts");
  const rows = [
    { date: "2026-03-01", product_name: "Birria Bomb 2-Pack", net_units: 0, gross_sales: 100 }, // cancelled GMV
    { date: "2026-03-02", product_name: "Birria Bomb 2-Pack", net_units: 2, gross_sales: 40 },
  ];

  const demandByProduct = computeBaselineDemandByProduct({
    productNames: ["Birria Bomb 2-Pack"],
    baselineDemandRows: rows,
    baselineSampleRows: [],
    baselineDays: 2,
    velocityMode: "sales_only",
    excludeSpikes: false,
  });

  const stats = demandByProduct.get("Birria Bomb 2-Pack");
  assert.equal(stats.salesUnits, 2);
  // Planner uses "active selling days" when there are too many zero-unit days in the baseline window.
  assert.equal(stats.avgDailyDemand, 2);
  assert.equal(stats.grossSales, 140);
  assert.equal(stats.netGrossSales, 40);
});
