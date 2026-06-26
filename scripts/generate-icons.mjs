import sharp from "sharp";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const svg = readFileSync(join(publicDir, "icon.svg"));

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "maskable-icon-512.png", size: 512, padding: 0.12 },
];

for (const { name, size, padding = 0 } of sizes) {
  const inset = Math.round(size * padding);
  const inner = size - inset * 2;

  await sharp(svg)
    .resize(inner, inner, { fit: "contain", background: "#F2EEE7" })
    .extend({
      top: inset,
      bottom: inset,
      left: inset,
      right: inset,
      background: "#F2EEE7",
    })
    .png()
    .toFile(join(publicDir, name));

  console.log(`Created ${name}`);
}
