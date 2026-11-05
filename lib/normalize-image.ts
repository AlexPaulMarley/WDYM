/**
 * Normalise an uploaded image to a small, upright JPEG for the AI pipeline:
 * auto-orient from EXIF (then the tag is stripped), downscale to fit 1024, and
 * re-encode as JPEG. Keeps Meshy/vision/image-gen requests small and consistent.
 * Server-only (sharp is a native module).
 */
import sharp from "sharp";

export async function normalizeToJpeg(bytes: Buffer, max = 1024): Promise<Buffer> {
  return sharp(bytes)
    .rotate()
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}
