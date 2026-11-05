/**
 * Generation records for the Instant 3D tier.
 *
 * Production: stored as small JSON blobs (generations/<id>.json) in Vercel
 * Blob — active whenever BLOB_READ_WRITE_TOKEN is set. Local dev: a JSON file
 * at .data/generations.json. All functions are async so the same callers work
 * against both. (A proper Postgres store replaces this in the accounts phase;
 * ids are UUIDs so the public-blob records aren't enumerable in practice.)
 */
import fs from "node:fs";
import path from "node:path";
import { put, list } from "@vercel/blob";
import { blobToken } from "./blob-token.mjs";

const TOKEN = blobToken();
const useBlob = !!TOKEN;
const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "generations.json");

// ---- local dev (JSON file) ----
function readAllLocal() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}
function writeAllLocal(obj) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(obj, null, 2));
}

// ---- production (Vercel Blob) ----
function recordKey(id) {
  return `generations/${id}.json`;
}

// The store's public base URL (https://<store>.public.blob.vercel-storage.com),
// learned from the first put/list on this instance. Once known, records are
// fetched directly by their deterministic path — no list() round-trip per poll.
let storeBase = null;
function learnBase(url) {
  try {
    const u = new URL(url);
    storeBase = `${u.protocol}//${u.host}`;
  } catch {
    /* leave unknown — list() fallback still works */
  }
}

/** Blob URLs are CDN-cached; a unique query param forces a fresh read. */
function freshFetch(url) {
  return fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
}

async function putRecordBlob(record) {
  const { url } = await put(recordKey(record.id), JSON.stringify(record), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
    token: TOKEN,
  });
  learnBase(url);
  return record;
}
async function getRecordBlob(id) {
  if (storeBase) {
    const res = await freshFetch(`${storeBase}/${recordKey(id)}`);
    if (res.ok) return res.json();
    // 404 might mean "wrong base" (multiple stores) — fall through to list().
  }
  const { blobs } = await list({ prefix: recordKey(id), token: TOKEN });
  const match = blobs.find((b) => b.pathname === recordKey(id)) ?? blobs[0];
  if (!match) return null;
  learnBase(match.url);
  const res = await freshFetch(match.url);
  if (!res.ok) return null;
  return res.json();
}

export async function createGeneration(record) {
  if (useBlob) return putRecordBlob(record);
  const all = readAllLocal();
  all[record.id] = record;
  writeAllLocal(all);
  return record;
}

export async function getGeneration(id) {
  if (useBlob) return getRecordBlob(id);
  return readAllLocal()[id] ?? null;
}

export async function updateGeneration(id, patch) {
  if (useBlob) {
    const current = await getRecordBlob(id);
    if (!current) return null;
    const merged = { ...current, ...patch };
    await putRecordBlob(merged);
    return merged;
  }
  const all = readAllLocal();
  if (!all[id]) return null;
  all[id] = { ...all[id], ...patch };
  writeAllLocal(all);
  return all[id];
}

export async function listGenerations() {
  if (useBlob) {
    const { blobs } = await list({ prefix: "generations/", token: TOKEN });
    const records = await Promise.all(
      blobs.map(async (b) => {
        try {
          const res = await fetch(b.url, { cache: "no-store" });
          return res.ok ? await res.json() : null;
        } catch {
          return null;
        }
      }),
    );
    return records.filter(Boolean).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }
  return Object.values(readAllLocal()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}
