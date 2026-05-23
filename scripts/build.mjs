import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

function loadEnvFile(filename) {
  const p = path.join(root, filename);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

function pick(...keys) {
  for (const k of keys) {
    const v = process.env[k];
    if (v) return v;
  }
  return "";
}

function firebaseConfigFromEnv() {
  const apiKey = pick("NEXT_PUBLIC_FIREBASE_API_KEY", "FIREBASE_API_KEY");
  if (!apiKey) return null;
  return {
    apiKey,
    authDomain: pick("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "FIREBASE_AUTH_DOMAIN"),
    projectId: pick("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "FIREBASE_PROJECT_ID"),
    storageBucket: pick("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: pick(
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "FIREBASE_MESSAGING_SENDER_ID"
    ),
    appId: pick("NEXT_PUBLIC_FIREBASE_APP_ID", "FIREBASE_APP_ID"),
  };
}

const COPY = [
  { from: "index.html", type: "file" },
  { from: "auth-gate.mjs", type: "file" },
  { from: "favicon.png", type: "file" },
  { from: "favicon-16.png", type: "file" },
  { from: "favicon-32.png", type: "file" },
  { from: "apple-touch-icon.png", type: "file" },
  { from: "img", type: "dir" },
];

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, name.name);
    const d = path.join(dest, name.name);
    if (name.isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

function countFiles(dir) {
  let n = 0;
  let bytes = 0;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      const sub = countFiles(p);
      n += sub.files;
      bytes += sub.bytes;
    } else {
      n += 1;
      bytes += fs.statSync(p).size;
    }
  }
  return { files: n, bytes };
}

function writeConfig(outDir) {
  const FIREBASE_CONFIG = firebaseConfigFromEnv();
  const allowedRaw = process.env.ALLOWED_EMAILS || "";
  const ALLOWED_EMAILS = allowedRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const payload = { FIREBASE_CONFIG, ALLOWED_EMAILS };
  const dest = path.join(outDir, "config.js");
  fs.writeFileSync(dest, `window.__ENV__=${JSON.stringify(payload)};\n`, "utf8");
}

rmDir(dist);
fs.mkdirSync(dist, { recursive: true });

for (const item of COPY) {
  const src = path.join(root, item.from);
  const dest = path.join(dist, item.from);
  if (!fs.existsSync(src)) {
    console.error(`Missing: ${item.from}`);
    process.exit(1);
  }
  if (item.type === "file") copyFile(src, dest);
  else copyDir(src, dest);
}

writeConfig(dist);

const stats = countFiles(dist);
const mb = (stats.bytes / (1024 * 1024)).toFixed(2);
console.log(`dist ready: ${stats.files} files, ${mb} MB → ${dist}`);
if (!firebaseConfigFromEnv()?.apiKey) {
  console.warn(
    "warn: Firebase not set — add .env.local with NEXT_PUBLIC_FIREBASE_* from Firebase Console"
  );
}
