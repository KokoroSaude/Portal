import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const svg = readFileSync(path.join(publicDir, "favicon.svg"), "utf8");

const coralSvg = svg.replace("#F57170", "#E8573F");

async function renderIcon(size) {
  const padding = Math.round(size * 0.12);
  const inner = size - padding * 2;

  const icon = await sharp(Buffer.from(coralSvg))
    .resize(inner, inner)
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#E8573F",
    },
  })
    .composite([{ input: icon, gravity: "centre" }])
    .png()
    .toBuffer();
}

for (const size of [192, 512]) {
  const buffer = await renderIcon(size);
  const out = path.join(publicDir, `web-app-manifest-${size}x${size}.png`);
  writeFileSync(out, buffer);
  console.log(`Wrote ${out}`);
}
