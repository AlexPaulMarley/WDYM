/**
 * File storage for the Instant 3D tier.
 *
 * Production (Vercel, read-only filesystem): Vercel Blob — active whenever
 * BLOB_READ_WRITE_TOKEN is set (auto-injected once a Blob store is linked to
 * the project). Local dev: writes into public/generated/<id>/ served at
 * /generated/<id>/<file>. saveBytes returns the public URL either way.
 */
import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { blobToken } from "./blob-token.mjs";

const TOKEN = blobToken();
const useBlob = !!TOKEN;
const PUBLIC_GENERATED = path.join(process.cwd(), "public", "generated");

const CONTENT_TYPE = {
  glb: "model/gltf-binary",
  usdz: "model/vnd.usdz+zip",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

/** Persist bytes for a generation and return the public URL to serve them. */
export async function saveBytes(id, filename, bytes) {
  // ids are UUIDs minted by us or validated at the API edge — enforce that
  // here too so a bad id can never become a path traversal (local fs) or
  // clobber another draft's folder (Blob).
  if (!/^[0-9a-f-]{10,64}$/i.test(id)) throw new Error(`saveBytes: unsafe id "${id}"`);
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPE[ext] ?? "application/octet-stream";

  if (useBlob) {
    const { url } = await put(`generated/${id}/${filename}`, buf, {
      access: "public",
      contentType,
      allowOverwrite: true,
      token: TOKEN,
    });
    return url;
  }

  const dir = path.join(PUBLIC_GENERATED, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buf);
  return `/generated/${id}/${filename}`;
}
