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

test("expands TikTok mapped bundle listings into core product demand", () => {
  const { expandMappedDemandRows, parseTiktokSkuMappingCsv } = requireTs("lib/sku-mapping.ts");
  const csv = [
    "SKU ID,Product Name,Product 1,Product 2,Product 3,Product 4",
    "BIRRIA_POZOLE,Birria and Pozole bundle,Birria Bombs 2P,Pozole Bombs 2P,,",
    "DOUBLE_BIRRIA,Birria bundle,Birria Bombs 2P,Birria Bombs 2P,,",
  ].join("\n");

  const rows = expandMappedDemandRows(
    [
      {
        order_date: "2026-04-01",
        platform: "TikTok",
        product_name: "Birria and Pozole bundle",
        seller_sku_resolved: "BIRRIA_POZOLE",
        net_units: 3,
        gross_sales: 90,
        net_gross_sales: 75,
      },
      {
        order_date: "2026-04-01",
        platform: "TikTok",
        product_name: "Birria bundle",
        seller_sku_resolved: "DOUBLE_BIRRIA",
        net_units: 2,
        gross_sales: 60,
        net_gross_sales: 0,
      },
    ],
    parseTiktokSkuMappingCsv(csv),
  );

  assert.deepEqual(rows, [
    {
      date: "2026-04-01",
      platform: "TikTok",
      product_name: "Birria Bomb 2-Pack",
      seller_sku_resolved: "BIRRIA_POZOLE",
      net_units: 3,
      gross_sales: 45,
      net_gross_sales: 37.5,
    },
    {
      date: "2026-04-01",
      platform: "TikTok",
      product_name: "Birria Bomb 2-Pack",
      seller_sku_resolved: "DOUBLE_BIRRIA",
      net_units: 4,
      gross_sales: 60,
      net_gross_sales: 60,
    },
    {
      date: "2026-04-01",
      platform: "TikTok",
      product_name: "Pozole Bomb 2-Pack",
      seller_sku_resolved: "BIRRIA_POZOLE",
      net_units: 3,
      gross_sales: 45,
      net_gross_sales: 37.5,
    },
  ]);
});

test("allocates mapped bundle gross sales by component unit list price", () => {
  const { expandMappedDemandRows, parseTiktokSkuMappingCsv } = requireTs("lib/sku-mapping.ts");
  const mappings = parseTiktokSkuMappingCsv(
    "SKU ID,Product Name,Product 1,Product 2,Product 3,Product 4\nMIXED,Mixed bundle,Birria Bombs 2P,Brine Bombs,,",
  );

  const rows = expandMappedDemandRows(
    [
      {
        order_date: "2026-04-01",
        platform: "TikTok",
        product_name: "Mixed bundle",
        seller_sku_resolved: "MIXED",
        net_units: 1,
        gross_sales: 60,
        net_gross_sales: 50,
      },
    ],
    mappings,
    {
      productUnitPrices: {
        "Birria Bomb 2-Pack": 20,
        "Brine Bomb": 40,
      },
    },
  );

  assert.equal(rows.find((row) => row.product_name === "Birria Bomb 2-Pack").gross_sales, 20);
  assert.equal(rows.find((row) => row.product_name === "Brine Bomb").gross_sales, 40);
  assert.equal(rows.find((row) => row.product_name === "Birria Bomb 2-Pack").net_gross_sales, 16.67);
  assert.equal(rows.find((row) => row.product_name === "Brine Bomb").net_gross_sales, 33.33);
});

test("builds lean listing summary rows without expanding bundle gross sales", () => {
  const { buildSkuSalesSummaryRows, parseTiktokSkuMappingCsv } = requireTs("lib/sku-mapping.ts");
  const mappings = parseTiktokSkuMappingCsv(
    "SKU ID,Product Name,Product 1,Product 2,Product 3,Product 4\nDOUBLE_BIRRIA,Birria bundle,Birria Bombs 2P,Birria Bombs 2P,,",
  );

  const rows = buildSkuSalesSummaryRows(
    [
      {
        order_date: "2026-04-01",
        platform: "TikTok",
        product_name: "Birria bundle",
        seller_sku_resolved: "DOUBLE_BIRRIA",
        net_units: 2,
        gross_sales: 69.98,
        net_gross_sales: 0,
      },
    ],
    mappings,
  );

  assert.deepEqual(rows, [
    {
      date: "2026-04-01",
      platform: "TikTok",
      sku_id: "DOUBLE_BIRRIA",
      product_name: "Birria bundle",
      sku_type: "virtual_bundle",
      core_products: "Birria Bomb 2-Pack x2",
      units_sold: 2,
      gross_sales: 69.98,
      avg_gross_per_unit: 34.99,
      net_gross_sales: 69.98,
      avg_net_gross_per_unit: 34.99,
    },
  ]);
});

test("rejects unmapped TikTok listing rows instead of guessing from title text", () => {
  const { expandMappedDemandRows, parseTiktokSkuMappingCsv } = requireTs("lib/sku-mapping.ts");
  const mappings = parseTiktokSkuMappingCsv("SKU ID,Product Name,Product 1,Product 2,Product 3,Product 4\nKNOWN,Known Product,Birria Bombs 2P,,,");

  assert.throws(
    () =>
      expandMappedDemandRows(
        [
          {
            order_date: "2026-04-01",
            platform: "TikTok",
            product_name: "Unknown TikTok marketing title",
            seller_sku_resolved: "UNKNOWN",
            net_units: 1,
            gross_sales: 20,
          },
        ],
        mappings,
      ),
    /Unmapped TikTok SKU UNKNOWN/,
  );
});

test("skips explicitly ignored non-planning mapped SKUs", () => {
  const { buildSkuSalesSummaryRows, expandMappedDemandRows, parseTiktokSkuMappingCsv } = requireTs("lib/sku-mapping.ts");
  const mappings = parseTiktokSkuMappingCsv("SKU ID,Product Name,Product 1,Product 2,Product 3,Product 4\nBOX,Collectors Box,Ignore,,,");
  const rows = [
    {
      order_date: "2026-04-01",
      platform: "TikTok",
      product_name: "Collectors Box",
      seller_sku_resolved: "BOX",
      net_units: 1,
      gross_sales: 0,
    },
  ];

  assert.deepEqual(expandMappedDemandRows(rows, mappings), []);
  assert.deepEqual(buildSkuSalesSummaryRows(rows, mappings), []);
});
