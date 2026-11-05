"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import styles from "./ImageEditor.module.css";

interface ImageEditorProps {
  imageSrc: string;
  onDone: (file: File) => void;
  onSkip: () => void;
}

type AspectKey = "portrait" | "square" | "landscape";
const ASPECTS: Record<AspectKey, number> = { portrait: 3 / 4, square: 1, landscape: 4 / 3 };

/**
 * Crop + straighten step. Meshy 3D-models everything in the frame, so cropping
 * tight to the furniture is the biggest quality lever; the rotate/straighten
 * controls fix sideways or tilted shots. Exports a baked, upright JPEG (EXIF
 * stripped) so the server's sharp().rotate() is a safe no-op afterwards.
 */
export default function ImageEditor({ imageSrc, onDone, onSkip }: ImageEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(0); // 90° steps
  const [straighten, setStraighten] = useState(0); // ±15°
  const [aspect, setAspect] = useState<AspectKey>("portrait");
  const [pixels, setPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const rotation = ((base + straighten) % 360 + 360) % 360;

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => setPixels(areaPixels), []);

  async function use() {
    if (!pixels || busy) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imageSrc, pixels, rotation);
      onDone(new File([blob], "crop.jpg", { type: "image/jpeg" }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.tip}>
        Drag to position, pinch or use the slider to zoom. <strong>Crop tight to just the
        furniture</strong> — anything else in shot gets built too.
      </p>

      <div className={styles.stage}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={ASPECTS[aspect]}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          restrictPosition={false}
          showGrid
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.aspectRow}>
          {(Object.keys(ASPECTS) as AspectKey[]).map((k) => (
            <button
              key={k}
              type="button"
              className={`${styles.chip} ${aspect === k ? styles.chipOn : ""}`}
              onClick={() => setAspect(k)}
            >
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>

        <label className={styles.sliderRow}>
          <span>Zoom</span>
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </label>

        <label className={styles.sliderRow}>
          <span>Straighten</span>
          <input type="range" min={-15} max={15} step={1} value={straighten} onChange={(e) => setStraighten(Number(e.target.value))} />
        </label>

        <div className={styles.rotateRow}>
          <button type="button" className={styles.chip} onClick={() => setBase((b) => b - 90)}>↺ Rotate left</button>
          <button type="button" className={styles.chip} onClick={() => setBase((b) => b + 90)}>Rotate right ↻</button>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className="btn btn-accent btn-block" onClick={use} disabled={busy || !pixels}>
          {busy ? "Saving…" : (
            <>
              Use this
              <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
                <path d="M1 1l6 6-6 6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
        <button type="button" className={styles.link} onClick={onSkip}>
          Skip — use the photo as-is
        </button>
      </div>
    </div>
  );
}

/* ---- canvas export (bakes crop + rotation into an upright JPEG) ---- */

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = url;
  });
}

function rad(deg: number) {
  return (deg * Math.PI) / 180;
}

async function getCroppedBlob(imageSrc: string, crop: Area, rotation: number): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const r = rad(rotation);
  const bw = Math.abs(Math.cos(r) * image.width) + Math.abs(Math.sin(r) * image.height);
  const bh = Math.abs(Math.sin(r) * image.width) + Math.abs(Math.cos(r) * image.height);

  // Draw the rotated image into a bounding-box canvas.
  const rot = document.createElement("canvas");
  rot.width = Math.ceil(bw);
  rot.height = Math.ceil(bh);
  const rctx = rot.getContext("2d");
  if (!rctx) throw new Error("Canvas unavailable.");
  rctx.translate(bw / 2, bh / 2);
  rctx.rotate(r);
  rctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Cut out the crop region, downscaling so the longest side is ≤ 1024px (matches
  // the server's normalize target — no point sending more).
  const scale = Math.min(1, 1024 / Math.max(crop.width, crop.height));
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(crop.width * scale));
  out.height = Math.max(1, Math.round(crop.height * scale));
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas unavailable.");
  // Fill white first: with restrictPosition off (and after straighten) the crop
  // can extend past the source, leaving transparent areas that JPEG would flatten
  // to BLACK — black bars degrade the Meshy mesh. White matches the plain-bg tip.
  octx.fillStyle = "#ffffff";
  octx.fillRect(0, 0, out.width, out.height);
  octx.drawImage(rot, crop.x, crop.y, crop.width, crop.height, 0, 0, out.width, out.height);

  return new Promise((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed."))), "image/jpeg", 0.85),
  );
}
