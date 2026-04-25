/* eslint-disable no-console */
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const LOCK_PATH = path.join(__dirname, "..", ".next-dev.lock");

function parsePort(argv) {
  const args = Array.isArray(argv) ? argv : [];
  for (let i = 0; i < args.length; i += 1) {
    const value = String(args[i] || "");
    if (value === "-p" || value === "--port") {
      const next = args[i + 1];
      const parsed = Number(next);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    if (value.startsWith("--port=")) {
      const parsed = Number(value.slice("--port=".length));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  const envPort = Number(process.env.PORT);
  if (Number.isFinite(envPort) && envPort > 0) return envPort;
  return 3000;
}

function isPidRunning(pid) {
  const numeric = Number(pid);
  if (!Number.isFinite(numeric) || numeric <= 0) return false;
  try {
    process.kill(numeric, 0);
    return true;
  } catch {
    return false;
  }
}

function readExistingLock() {
  try {
    if (!fs.existsSync(LOCK_PATH)) return null;
    const raw = fs.readFileSync(LOCK_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeLock(port) {
  try {
    fs.writeFileSync(
      LOCK_PATH,
      JSON.stringify({ pid: process.pid, port, startedAt: new Date().toISOString() }, null, 2),
      "utf8",
    );
  } catch (err) {
    console.warn("[dev] Could not write lock file (continuing):", err?.message || err);
  }
}

function cleanupLock() {
  try {
    const lock = readExistingLock();
    if (lock && Number(lock.pid) === process.pid) {
      fs.rmSync(LOCK_PATH, { force: true });
    }
  } catch {
    // ignore
  }
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", (err) => {
      resolve(Boolean(err && err.code === "EADDRINUSE"));
    });
    server.listen({ port, host: "127.0.0.1" }, () => {
      server.close(() => resolve(false));
    });
  });
}

async function main() {
  const port = parsePort(process.argv.slice(2));

  // Important: if a dev server is already running, do NOT delete `.next`.
  // Running `npm run dev` twice on Windows can otherwise corrupt the live server
  // and produce "Cannot find module ... vendor-chunks/next.js" 500s.
  const existingLock = readExistingLock();
  if (existingLock && isPidRunning(existingLock.pid)) {
    console.error(`[dev] Another dev server is already running (pid ${existingLock.pid}${existingLock.port ? `, port ${existingLock.port}` : ""}). Not cleaning .next.`);
    process.exit(1);
  }
  if (await isPortInUse(port)) {
    console.error(`[dev] Port ${port} is already in use. Not cleaning .next. Stop the running dev server first, then try again.`);
    process.exit(1);
  }

  writeLock(port);
  process.on("exit", cleanupLock);
  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));

  const nextDir = path.join(__dirname, "..", ".next");
  try {
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log(`[dev] cleaned ${nextDir}`);
    }
  } catch (err) {
    console.warn("[dev] could not clean .next (continuing):", err?.message || err);
  }

  let nextBin = null;
  try {
    nextBin = require.resolve("next/dist/bin/next");
  } catch (err) {
    console.error("[dev] Could not resolve Next.js binary. Did you run npm install?", err?.message || err);
    process.exit(1);
  }

  const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    process.exit(Number.isFinite(code) ? code : 0);
  });
}

main().catch((err) => {
  console.error("[dev] Unhandled error:", err?.message || err);
  process.exit(1);
});
