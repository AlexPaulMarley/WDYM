import { NextResponse } from "next/server";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import QRCode from "qrcode";
import { getImageTo3DTask, getMultiImageTo3DTask, modelUrls } from "@/lib/meshy.mjs";
import { optimizeGlb } from "@/lib/optimize-model.mjs";
import { getGeneration, updateGeneration } from "@/lib/generations-store.mjs";
import type { GenerationRecord } from "@/lib/generations-store.mjs";
import { saveBytes } from "@/lib/storage.mjs";

export const runtime = "nodejs";
// The heavy step (download multi-MB GLB from Meshy + optimize + upload) can
// exceed 60s — give it real headroom so the platform doesn't kill it mid-way.
export const maxDuration = 300;

// A "processing" claim older than this is a corpse: the request that wrote it
// was killed (timeout/OOM/recycle) before finishing. Must exceed maxDuration
// so we never re-drive work a live request is still doing.
const PROCESSING_STALE_MS = 330_000;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rec = await getGeneration(id);
  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Terminal states, or another request is already doing the heavy step.
  if (rec.status === "ready" || rec.status === "failed") {
    return NextResponse.json(rec);
  }
  if (rec.status === "processing") {
    const age = Date.now() - (rec.processingStartedAt ?? rec.createdAt);
    if (age < PROCESSING_STALE_MS) return NextResponse.json(rec);
    // Stale claim — the worker died mid-processing and nothing else will ever
    // recover this record. Re-open it (capped like the failure path) so this
    // poll retries the download/optimize instead of stranding the user with a
    // spent Meshy credit and an eternal progress bar.
    const attempts = (rec.retryCount ?? 0) + 1;
    if (attempts >= 3) {
      return NextResponse.json(
        await updateGeneration(id, {
          status: "failed",
          error: "Processing took too long — please try again.",
          completedAt: Date.now(),
        }),
      );
    }
    rec.status = "pending";
    rec.retryCount = attempts;
    await updateGeneration(id, { status: "pending", retryCount: attempts });
  }

  // status === "pending": check Meshy (single- or multi-image task).
  const getTask = rec.taskType === "multi-image" ? getMultiImageTo3DTask : getImageTo3DTask;
  let task;
  try {
    task = await getTask(rec.meshyTaskId);
  } catch {
    return NextResponse.json(rec); // transient — client polls again
  }

  if (task.status === "FAILED" || task.status === "CANCELED") {
    return NextResponse.json(
      await updateGeneration(id, {
        status: "failed",
        error: task.task_error?.message ?? "The 3D generation failed. Please try another photo.",
        completedAt: Date.now(),
      }),
    );
  }

  if (task.status !== "SUCCEEDED") {
    // Don't persist progress-only ticks — repeated record writes cause Blob
    // list() lookups to lag ("Not found"). Just report live progress; the
    // record is only written on real state changes (processing/ready/failed).
    return NextResponse.json({ ...rec, progress: task.progress ?? rec.progress });
  }

  // SUCCEEDED — claim the work so concurrent polls don't double-process.
  // processingStartedAt is the staleness lease: if we die past this point,
  // a later poll re-opens the record instead of waiting forever.
  await updateGeneration(id, { status: "processing", progress: 100, processingStartedAt: Date.now() });
  try {
    const urls = modelUrls(task);
    if (!urls.glb) throw new Error("Meshy returned no GLB to download.");

    const rawRes = await fetch(urls.glb);
    if (!rawRes.ok) throw new Error(`Could not download the model (HTTP ${rawRes.status}).`);
    const rawBytes = Buffer.from(await rawRes.arrayBuffer());

    // Optimise into a temp file (the only writable path on Vercel), then hand
    // the bytes to storage (Vercel Blob in prod, public/ in dev). Unique name
    // per request — two concurrent workers must never share a temp file.
    const tmpOut = path.join(os.tmpdir(), `${id}-${crypto.randomUUID()}.glb`);
    // Aggressive settings for the cheap AI tier: 1K textures, ~60k triangles.
    // Impose TRUE real-world scale here: the confirmed height (cm) is the trust
    // anchor — Meshy only guesses size via auto_size. When no height was given
    // we fall back to Meshy's guess (targetHeightM stays undefined).
    const cmToM = (v: number | null | undefined) => (v && v > 0 ? v / 100 : undefined);
    const stats = await optimizeGlb(rawBytes, tmpOut, {
      maxTextureSize: 1024,
      maxTriangles: 60000,
      targetHeightM: cmToM(rec.heightCm),
      targetWidthM: cmToM(rec.widthCm),
      targetDepthM: cmToM(rec.depthCm),
    });
    if (stats.scaleWarning) console.warn(`[generation ${id}] ${stats.scaleWarning}`, stats.dimensionsM);
    const glbBytes = fs.readFileSync(tmpOut);
    fs.rmSync(tmpOut, { force: true });
    const glbUrl = await saveBytes(id, "model.glb", glbBytes);

    let posterUrl: string | null = null;
    if (task.thumbnail_url) {
      try {
        const tRes = await fetch(task.thumbnail_url);
        if (tRes.ok) posterUrl = await saveBytes(id, "poster.png", Buffer.from(await tRes.arrayBuffer()));
      } catch {
        /* poster is non-essential */
      }
    }

    const base = process.env.SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
    const qrDataUrl = await QRCode.toDataURL(`${base}/g/${id}`, { width: 512, margin: 2 });

    return NextResponse.json(
      await updateGeneration(id, {
        status: "ready",
        glbUrl,
        posterUrl,
        qrDataUrl,
        dimensionsM: stats.dimensionsM,
        // Surfaced on the result page — a mis-scaled model must not ship
        // under a confident "its real size" caption (it was console-only).
        scaleWarning: stats.scaleWarning ?? null,
        progress: 100,
        completedAt: Date.now(),
      }),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Processing the model failed.";
    // A concurrent poll may have finished the work while we were failing —
    // never let a late failure clobber a delivered model.
    const current = await getGeneration(id);
    if (current?.status === "ready") return NextResponse.json(current);
    // The Meshy task SUCCEEDED (credits already spent) — a transient download/
    // optimise hiccup shouldn't bin it. Revert to "pending" so the next poll
    // retries the cheap status check + download, capped to avoid a hard loop.
    const attempts = (rec.retryCount ?? 0) + 1;
    const patch: Partial<GenerationRecord> =
      attempts >= 3
        ? { status: "failed", error: msg, completedAt: Date.now() }
        : { status: "pending", retryCount: attempts, error: msg };
    return NextResponse.json(await updateGeneration(id, patch));
  }
}
