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

test("settings auth is disabled when no password is configured", () => {
  const prev = {
    password: process.env.PLANNER_SETTINGS_PASSWORD,
    hash: process.env.PLANNER_SETTINGS_PASSWORD_HASH,
  };
  delete process.env.PLANNER_SETTINGS_PASSWORD;
  delete process.env.PLANNER_SETTINGS_PASSWORD_HASH;

  const { isSettingsAuthEnabled, verifySettingsPassword } = requireTs("lib/settings-auth.ts");
  assert.equal(isSettingsAuthEnabled(), false);
  assert.equal(verifySettingsPassword("anything"), true);

  if (prev.password === undefined) delete process.env.PLANNER_SETTINGS_PASSWORD;
  else process.env.PLANNER_SETTINGS_PASSWORD = prev.password;
  if (prev.hash === undefined) delete process.env.PLANNER_SETTINGS_PASSWORD_HASH;
  else process.env.PLANNER_SETTINGS_PASSWORD_HASH = prev.hash;
});

test("settings auth verifies password and signed token", () => {
  const prev = {
    password: process.env.PLANNER_SETTINGS_PASSWORD,
    hash: process.env.PLANNER_SETTINGS_PASSWORD_HASH,
    secret: process.env.PLANNER_SETTINGS_AUTH_SECRET,
  };

  process.env.PLANNER_SETTINGS_PASSWORD = "test-password";
  delete process.env.PLANNER_SETTINGS_PASSWORD_HASH;
  process.env.PLANNER_SETTINGS_AUTH_SECRET = "unit-test-secret";

  const {
    isSettingsAuthEnabled,
    verifySettingsPassword,
    sha256Base64Url,
    signSettingsAuthToken,
    verifySettingsAuthToken,
  } = requireTs("lib/settings-auth.ts");

  assert.equal(isSettingsAuthEnabled(), true);
  assert.equal(verifySettingsPassword("wrong"), false);
  assert.equal(verifySettingsPassword("test-password"), true);

  const expected = sha256Base64Url("test-password");
  const token = signSettingsAuthToken(Date.now() + 60_000, expected);
  const verified = verifySettingsAuthToken(token, expected);
  assert.equal(verified.ok, true);

  const expired = verifySettingsAuthToken(signSettingsAuthToken(Date.now() - 10, expected), expected);
  assert.equal(expired.ok, false);

  if (prev.password === undefined) delete process.env.PLANNER_SETTINGS_PASSWORD;
  else process.env.PLANNER_SETTINGS_PASSWORD = prev.password;
  if (prev.hash === undefined) delete process.env.PLANNER_SETTINGS_PASSWORD_HASH;
  else process.env.PLANNER_SETTINGS_PASSWORD_HASH = prev.hash;
  if (prev.secret === undefined) delete process.env.PLANNER_SETTINGS_AUTH_SECRET;
  else process.env.PLANNER_SETTINGS_AUTH_SECRET = prev.secret;
});
