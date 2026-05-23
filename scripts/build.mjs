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

function supabaseEnv() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  return { url, key };
}

const COPY = [
  { from: "index.html", type: "file" },
  { from: "auth-gate.mjs", type: "file" },
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
  const { url, key } = supabaseEnv();
  const allowedRaw = process.env.ALLOWED_EMAILS || "";
  const ALLOWED_EMAILS = allowedRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const payload = { SUPABASE_URL: url, SUPABASE_ANON_KEY: key, ALLOWED_EMAILS };
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
const { url: builtUrl } = supabaseEnv();
if (!builtUrl) {
  console.warn(
    "warn: Supabase URL not set — add .env.local or SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL"
  );
}
