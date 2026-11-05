/**
 * Find the Vercel Blob read/write token. Normally BLOB_READ_WRITE_TOKEN, but
 * Vercel sometimes creates it under a store-prefixed name (e.g.
 * INSTANT_3D_MODELS_READ_WRITE_TOKEN), which the SDK's default lookup misses.
 * Returns undefined when no Blob store is wired up (local dev).
 */
export function blobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find(
    (k) => k.endsWith("_READ_WRITE_TOKEN") && process.env[k],
  );
  return key ? process.env[key] : undefined;
}
