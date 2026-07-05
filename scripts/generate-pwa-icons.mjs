import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const sourceLogo = path.join(publicDir, "brand/pwa-logo-source.png");
const backgroundColor = "#FAFAF8";

async function renderIcon(size, { maskable = false } = {}) {
  const paddingRatio = maskable ? 0.2 : 0.12;
  const padding = Math.round(size * paddingRatio);
  const inner = size - padding * 2;

  const logo = await sharp(sourceLogo)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: backgroundColor,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

for (const size of [192, 512]) {
  const buffer = await renderIcon(size);
  const out = path.join(publicDir, `web-app-manifest-${size}x${size}.png`);
  writeFileSync(out, buffer);
  console.log(`Wrote ${out}`);
}

for (const size of [192, 512]) {
  const buffer = await renderIcon(size, { maskable: true });
  const out = path.join(publicDir, `web-app-manifest-${size}x${size}-maskable.png`);
  writeFileSync(out, buffer);
  console.log(`Wrote ${out}`);
}

// Apple touch icon — slightly tighter crop for iOS
const appleSize = 180;
const applePadding = Math.round(appleSize * 0.1);
const appleInner = appleSize - applePadding * 2;
const appleLogo = await sharp(sourceLogo)
  .resize(appleInner, appleInner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
const appleBuffer = await sharp({
  create: {
    width: appleSize,
    height: appleSize,
    channels: 4,
    background: backgroundColor,
  },
})
  .composite([{ input: appleLogo, gravity: "centre" }])
  .png()
  .toBuffer();
writeFileSync(path.join(publicDir, "apple-touch-icon.png"), appleBuffer);
console.log("Wrote apple-touch-icon.png");
