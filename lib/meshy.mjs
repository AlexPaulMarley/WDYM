/**
 * Meshy AI API client (server-side only — never import into client components;
 * it reads MESHY_API_KEY). Plain ESM + JSDoc so both the Next.js app and the
 * Node test scripts can import the same module.
 *
 * Docs: https://docs.meshy.ai/en/api
 * Key facts baked in (researched & verified June 2026):
 *  - API needs a paid (Pro+) Meshy plan; paid output is commercially resellable.
 *  - Image drives geometry; a text prompt only steers the TEXTURE/finish.
 *  - Output formats include glb + usdz (so the existing model-viewer/AR pipeline
 *    is reused with no Blender step).
 *  - Real-world scale: auto_size (AI height estimate) + origin_at.
 *  - Async: create task -> poll (or webhook). FAILED tasks refund credits.
 */

const MESHY_BASE = "https://api.meshy.ai/openapi/v1";

function meshyKey() {
  const key = process.env.MESHY_API_KEY;
  if (!key) throw new Error("MESHY_API_KEY is not set in the environment.");
  return key;
}

/** @typedef {"PENDING"|"IN_PROGRESS"|"SUCCEEDED"|"FAILED"|"CANCELED"} MeshyStatus */

async function meshyFetch(path, { method = "GET", body } = {}) {
  const headers = { Authorization: `Bearer ${meshyKey()}` };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${MESHY_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(
      `Meshy ${method} ${path} -> HTTP ${res.status}: ${text.slice(0, 500)}`,
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

/**
 * Create an Image-to-3D task. The image sets the SHAPE; finishPrompt only
 * affects the texture/finish.
 * @param {object} opts
 * @param {string} opts.imageUrl  Public URL or data: URI of the drawing/photo.
 * @param {string} [opts.finishPrompt]  e.g. "oak doors, matte black handles".
 * @param {number} [opts.realHeightMeters]  Accepted for callers but NOT sent to Meshy (no such param); kept as metadata. Sizing uses auto_size.
 * @param {string} [opts.aiModel]  Default "meshy-6".
 * @param {number} [opts.targetPolycount]  Default 30000.
 * @param {string} [opts.webhookUrl]  If set, Meshy POSTs status updates here (prod).
 * @returns {Promise<string>} the Meshy task id
 */
export async function createImageTo3D({
  imageUrl,
  finishPrompt,
  realHeightMeters,
  aiModel = "meshy-6",
  targetPolycount = 30000,
  webhookUrl,
}) {
  const body = {
    image_url: imageUrl,
    ai_model: aiModel,
    topology: "triangle",
    // should_remesh is required for target_polycount to take effect — without
    // it Meshy returns a ~1M-triangle mesh (verified). Remeshing to ~50k keeps
    // the raw download small before our optimiser runs.
    should_remesh: true,
    target_polycount: targetPolycount,
    should_texture: true,
    enable_pbr: true,
    // glb for web/Android, usdz for iOS Quick Look — reuses our AR pipeline.
    target_formats: ["glb", "usdz"],
    origin_at: "bottom",
  };
  if (finishPrompt) body.texture_prompt = finishPrompt;
  // Meshy's image-to-3d has no real-world height parameter. We keep auto_size on
  // purely for the origin_at:"bottom" grounding (origin_at only applies when
  // auto_size is on) so the piece sits on the floor in AR. Meshy's size is just
  // a guess — the TRUE real-world height is imposed deterministically AFTER
  // meshing in optimizeGlb (lib/optimize-model.mjs, targetHeightM), driven by
  // the height the user confirms. realHeightMeters is accepted for callers but
  // applied downstream, not here.
  body.auto_size = true;
  void realHeightMeters;
  if (webhookUrl) body.webhook_url = webhookUrl;

  const json = await meshyFetch("/image-to-3d", { method: "POST", body });
  const taskId = json.result ?? json.id ?? json.task_id;
  if (!taskId) throw new Error(`Meshy returned no task id: ${JSON.stringify(json)}`);
  return taskId;
}

/** Fetch one Image-to-3D task's current state. */
export async function getImageTo3DTask(taskId) {
  return meshyFetch(`/image-to-3d/${taskId}`);
}

/**
 * Create a Multi-Image-to-3D task from 2–4 consistent views of one piece
 * (front/side/back/¾). Multiple views give far better geometry than a single
 * guessed view. Separate endpoint + body field (image_urls) from image-to-3d.
 * @param {object} opts
 * @param {string[]} opts.imageUrls  1–4 public URLs or data: URIs (same piece).
 * @param {string} [opts.finishPrompt]
 * @param {string} [opts.aiModel]  Default "meshy-6".
 * @param {number} [opts.targetPolycount]  Default 30000.
 * @param {string} [opts.webhookUrl]
 * @returns {Promise<string>} the Meshy task id
 */
export async function createMultiImageTo3D({
  imageUrls,
  finishPrompt,
  aiModel = "meshy-6",
  targetPolycount = 30000,
  webhookUrl,
}) {
  if (!Array.isArray(imageUrls) || imageUrls.length < 1 || imageUrls.length > 4) {
    throw new Error("Multi-image needs between 1 and 4 images.");
  }
  const body = {
    image_urls: imageUrls,
    ai_model: aiModel,
    topology: "triangle",
    // should_remesh defaults FALSE on meshy-6 — set it so target_polycount
    // applies and the raw download stays small before our optimiser runs.
    should_remesh: true,
    target_polycount: targetPolycount,
    should_texture: true,
    enable_pbr: true,
    // image_enhancement (meshy-6+, default true) neutralises sketch/AI-render
    // noise across the view set — keep it on.
    image_enhancement: true,
    target_formats: ["glb", "usdz"],
    origin_at: "bottom",
    auto_size: true,
  };
  if (finishPrompt) body.texture_prompt = finishPrompt;
  if (webhookUrl) body.webhook_url = webhookUrl;

  const json = await meshyFetch("/multi-image-to-3d", { method: "POST", body });
  const taskId = json.result ?? json.id ?? json.task_id;
  if (!taskId) throw new Error(`Meshy multi-image returned no task id: ${JSON.stringify(json)}`);
  return taskId;
}

/** Fetch one Multi-Image-to-3D task's current state. */
export async function getMultiImageTo3DTask(taskId) {
  return meshyFetch(`/multi-image-to-3d/${taskId}`);
}

/**
 * Re-skin existing geometry without changing the shape ("change the finish").
 * Cheap and shape-stable — the honest "iteration" primitive.
 * @param {object} opts
 * @param {string} opts.inputTaskId  A prior task whose mesh to re-texture.
 * @param {string} [opts.textStylePrompt]
 * @param {string} [opts.imageStyleUrl]
 * @param {string} [opts.webhookUrl]
 * @returns {Promise<string>} task id
 */
export async function createRetexture({ inputTaskId, textStylePrompt, imageStyleUrl, webhookUrl }) {
  const body = { input_task_id: inputTaskId, enable_pbr: true };
  if (textStylePrompt) body.text_style_prompt = textStylePrompt;
  if (imageStyleUrl) body.image_style_url = imageStyleUrl;
  if (webhookUrl) body.webhook_url = webhookUrl;
  const json = await meshyFetch("/retexture", { method: "POST", body });
  const taskId = json.result ?? json.id;
  if (!taskId) throw new Error(`Meshy retexture returned no task id: ${JSON.stringify(json)}`);
  return taskId;
}

export async function getRetextureTask(taskId) {
  return meshyFetch(`/retexture/${taskId}`);
}

const TERMINAL = new Set(["SUCCEEDED", "FAILED", "CANCELED"]);

/**
 * Poll a task to completion. For local/dev use; production uses webhooks.
 * @param {(id:string)=>Promise<any>} getTask
 * @param {string} taskId
 * @param {object} [opts]
 * @param {number} [opts.intervalMs]
 * @param {number} [opts.timeoutMs]
 * @param {(t:any)=>void} [opts.onProgress]
 */
export async function pollTask(getTask, taskId, { intervalMs = 5000, timeoutMs = 600000, onProgress } = {}) {
  const start = Date.now();
  while (true) {
    const task = await getTask(taskId);
    if (onProgress) onProgress(task);
    if (TERMINAL.has(task.status)) return task;
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for Meshy task ${taskId} (last status ${task.status}).`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/** Pull the glb/usdz download URLs out of a finished task, tolerating shape differences. */
export function modelUrls(task) {
  const urls = task.model_urls ?? task.model_url ?? {};
  return { glb: urls.glb, usdz: urls.usdz, fbx: urls.fbx, obj: urls.obj };
}

export { MESHY_BASE };
