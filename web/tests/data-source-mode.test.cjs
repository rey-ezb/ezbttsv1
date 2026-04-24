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

test("uses local planner data by default in local dev even when Firebase env exists", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousMode = process.env.PLANNER_DATA_SOURCE;
  process.env.NODE_ENV = "development";
  delete process.env.PLANNER_DATA_SOURCE;

  const { getPlannerDataSourceMode } = requireTs("lib/data-source-mode.ts");

  assert.equal(getPlannerDataSourceMode(), "local");
  process.env.NODE_ENV = previousNodeEnv;
  if (previousMode === undefined) delete process.env.PLANNER_DATA_SOURCE;
  else process.env.PLANNER_DATA_SOURCE = previousMode;
});

test("allows local dev to explicitly opt into live Firestore", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousMode = process.env.PLANNER_DATA_SOURCE;
  process.env.NODE_ENV = "development";
  process.env.PLANNER_DATA_SOURCE = "live";

  const { getPlannerDataSourceMode } = requireTs("lib/data-source-mode.ts");

  assert.equal(getPlannerDataSourceMode(), "live");
  process.env.NODE_ENV = previousNodeEnv;
  if (previousMode === undefined) delete process.env.PLANNER_DATA_SOURCE;
  else process.env.PLANNER_DATA_SOURCE = previousMode;
});
