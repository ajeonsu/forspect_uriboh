import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "img", "brand-logo.png");

if (!fs.existsSync(src)) {
  console.error("Missing img/brand-logo.png");
  process.exit(1);
}

const sizes = [
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of sizes) {
  const out = path.join(root, name);
  await sharp(src)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(out);
  console.log("wrote", name);
}

// ICO-compatible: use 32px as favicon.ico substitute via png
await sharp(path.join(root, "favicon-32.png")).toFile(path.join(root, "favicon.png"));
