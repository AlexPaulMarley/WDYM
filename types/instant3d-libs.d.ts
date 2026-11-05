/**
 * Ambient types for the plain-JS (.mjs) libs the Instant 3D app imports.
 * Keeps the .mjs files out of the type-check (they're also run directly by
 * Node scripts) while giving the TypeScript routes/pages clean signatures.
 */
declare module "@/lib/meshy.mjs" {
  export interface MeshyTask {
    status: string;
    progress?: number;
    task_error?: { message?: string };
    thumbnail_url?: string;
    model_urls?: { glb?: string; usdz?: string; fbx?: string; obj?: string };
    [key: string]: unknown;
  }
  export function createImageTo3D(opts: {
    imageUrl: string;
    finishPrompt?: string;
    realHeightMeters?: number;
    aiModel?: string;
    targetPolycount?: number;
    webhookUrl?: string;
  }): Promise<string>;
  export function getImageTo3DTask(taskId: string): Promise<MeshyTask>;
  export function createMultiImageTo3D(opts: {
    imageUrls: string[];
    finishPrompt?: string;
    aiModel?: string;
    targetPolycount?: number;
    webhookUrl?: string;
  }): Promise<string>;
  export function getMultiImageTo3DTask(taskId: string): Promise<MeshyTask>;
  export function createRetexture(opts: {
    inputTaskId: string;
    textStylePrompt?: string;
    imageStyleUrl?: string;
    webhookUrl?: string;
  }): Promise<string>;
  export function getRetextureTask(taskId: string): Promise<MeshyTask>;
  export function pollTask(
    getTask: (id: string) => Promise<MeshyTask>,
    taskId: string,
    opts?: { intervalMs?: number; timeoutMs?: number; onProgress?: (t: MeshyTask) => void },
  ): Promise<MeshyTask>;
  export function modelUrls(task: MeshyTask): {
    glb?: string;
    usdz?: string;
    fbx?: string;
    obj?: string;
  };
}

declare module "@/lib/optimize-model.mjs" {
  export function optimizeGlb(
    input: string | Uint8Array,
    outputPath: string,
    opts?: {
      maxTextureSize?: number;
      maxTriangles?: number;
      targetHeightM?: number;
      targetWidthM?: number;
      targetDepthM?: number;
    },
  ): Promise<{
    trianglesBefore: number;
    trianglesAfter: number;
    bytes: number;
    sizeMB: number;
    dimensionsM: number[];
    scaledToHeightM: number | null;
    scaleWarning: string | null;
  }>;
}

declare module "@/lib/storage.mjs" {
  export function saveBytes(id: string, filename: string, bytes: Buffer | Uint8Array): Promise<string>;
}

declare module "@/lib/generations-store.mjs" {
  export interface GenerationRecord {
    id: string;
    status: "pending" | "processing" | "ready" | "failed";
    meshyTaskId: string;
    taskType?: "image" | "multi-image";
    inputType: string;
    finishPrompt: string | null;
    heightCm: number | null;
    widthCm?: number | null;
    depthCm?: number | null;
    inputImageUrl: string | null;
    inputImageUrls?: string[] | null;
    glbUrl: string | null;
    posterUrl: string | null;
    qrDataUrl: string | null;
    dimensionsM: number[] | null;
    /** Optimiser's "this size looks implausible for furniture" note — shown on the result page. */
    scaleWarning?: string | null;
    error: string | null;
    progress: number;
    retryCount?: number;
    /** Staleness lease for the heavy processing step — see generations/[id]/route.ts. */
    processingStartedAt?: number;
    createdAt: number;
    completedAt: number | null;
  }
  export function createGeneration(record: GenerationRecord): Promise<GenerationRecord>;
  export function getGeneration(id: string): Promise<GenerationRecord | null>;
  export function updateGeneration(id: string, patch: Partial<GenerationRecord>): Promise<GenerationRecord | null>;
  export function listGenerations(): Promise<GenerationRecord[]>;
}
