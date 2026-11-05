/**
 * Reusable GLB optimiser for AR delivery (server-side / Node).
 * Extracted from scripts/add-design.mjs so both the manual pipeline and the
 * self-serve AI tier share one implementation.
 *
 * Plain JPEG textures only — KTX2/meshopt-compressed textures break iOS
 * on-device USDZ conversion and have Android rendering bugs. (The meshopt
 * *simplifier* used here is fine; it's the texture compression that's banned.)
 */
import fs from "node:fs";
import { NodeIO, getBounds } from "@gltf-transform/core";
import { dedup, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const DEFAULT_MAX_TRIANGLES = 100_000;
const DEFAULT_MAX_TEXTURE = 2048;

function countTriangles(document) {
  let total = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices();
      const position = prim.getAttribute("POSITION");
      total += Math.floor((indices ? indices.getCount() : (position?.getCount() ?? 0)) / 3);
    }
  }
  return total;
}

/**
 * Uniformly scale a scene about the world origin by `factor`. Multiplies each
 * root node's translation AND scale, so a model whose root nodes are offset
 * still scales correctly about the origin (Meshy sets origin_at:"bottom", so
 * the piece stays grounded). gltf-transform/three honour node TRS, so this is
 * enough for model-viewer AR + the on-device USDZ — no vertex baking needed.
 */
function scaleSceneUniform(scene, factor) {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return;
  for (const node of scene.listChildren()) {
    const t = node.getTranslation();
    node.setTranslation([t[0] * factor, t[1] * factor, t[2] * factor]);
    const s = node.getScale();
    node.setScale([s[0] * factor, s[1] * factor, s[2] * factor]);
  }
}

/**
 * Optimise a GLB for mobile AR: simplify dense geometry, compress textures to
 * JPEG, drop unused data, and (if a real dimension is given) scale it to true
 * real-world size. Returns stats including the final real-world bounding size.
 * @param {string|Uint8Array} input  path to a .glb, or GLB bytes
 * @param {string} outputPath        where to write the optimised .glb
 * @param {object} [opts]
 * @param {number} [opts.maxTextureSize]
 * @param {number} [opts.maxTriangles]
 * @param {number} [opts.targetHeightM]  If set, uniformly scale the model so its
 *   bounding-box HEIGHT (Y) equals this many metres. This is how true AR scale
 *   is imposed — Meshy's auto_size is only a guess, so the confirmed real height
 *   is applied here deterministically. Proportions are preserved (uniform).
 * @param {number} [opts.targetWidthM]  Fallback anchor on the X axis when no
 *   height was confirmed (e.g. a wide low unit where width is the known size).
 * @param {number} [opts.targetDepthM]  Fallback anchor on the Z axis.
 *   Height takes priority, then width, then depth — whichever is confirmed.
 */
export async function optimizeGlb(input, outputPath, opts = {}) {
  const maxTextureSize = opts.maxTextureSize ?? DEFAULT_MAX_TEXTURE;
  const maxTriangles = opts.maxTriangles ?? DEFAULT_MAX_TRIANGLES;
  const pos = (v) => (Number.isFinite(v) && v > 0 ? v : undefined);
  const targetHeightM = pos(opts.targetHeightM);
  const targetWidthM = pos(opts.targetWidthM);
  const targetDepthM = pos(opts.targetDepthM);

  const io = new NodeIO();
  const document =
    typeof input === "string" ? await io.read(input) : await io.readBinary(input);

  const trianglesBefore = countTriangles(document);
  if (trianglesBefore > maxTriangles) {
    await MeshoptSimplifier.ready;
    await document.transform(
      weld(),
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: Math.min(1, (maxTriangles / trianglesBefore) * 0.9),
        error: 0.001,
      }),
    );
  }

  await document.transform(
    dedup(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: "jpeg", resize: [maxTextureSize, maxTextureSize] }),
  );

  const scene = document.getRoot().getDefaultScene() ?? document.getRoot().listScenes()[0];

  // Impose true real-world scale BEFORE writing: measure the current bounds,
  // scale uniformly so the confirmed axis matches its target, then re-measure so
  // the returned dimensionsM is the real size (drives the on-screen "true size"
  // caption and is what AR shows). glTF is metres, so this carries through.
  // Height is the preferred anchor; width/depth are fallbacks so a confirmed
  // dimension always imposes scale instead of silently using Meshy's guess.
  let dimensionsM = boundsSize(getBounds(scene));
  const anchor =
    (targetHeightM && [1, targetHeightM]) ||
    (targetWidthM && [0, targetWidthM]) ||
    (targetDepthM && [2, targetDepthM]) ||
    null;
  if (anchor && dimensionsM[anchor[0]] > 0) {
    scaleSceneUniform(scene, anchor[1] / dimensionsM[anchor[0]]);
    dimensionsM = boundsSize(getBounds(scene));
  }

  // Defence-in-depth: a uniform scale assumes Meshy returned an upright Y-up
  // mesh. If the result is implausible for furniture (any axis absurd, or the
  // anchor axis became degenerate) flag it rather than ship a mis-scaled model.
  const scaleWarning =
    anchor && dimensionsM.some((m) => m <= 0.02 || m > 12) ? "post-scale dimensions implausible (check mesh orientation)" : null;

  await io.write(outputPath, document);
  const bytes = fs.statSync(outputPath).size;

  return {
    trianglesBefore,
    trianglesAfter: countTriangles(document),
    bytes,
    sizeMB: bytes / (1024 * 1024),
    dimensionsM, // [width, height, depth] in metres (post-scale = true size)
    scaledToHeightM: targetHeightM ?? null,
    scaleWarning,
  };
}

/** [width, height, depth] in metres from a gltf-transform bounds object. */
function boundsSize(bounds) {
  return bounds.max.map((v, i) => v - bounds.min[i]);
}
