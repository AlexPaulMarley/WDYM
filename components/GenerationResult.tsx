"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ModelViewer from "@/components/ModelViewer";
import ShareLink from "@/components/ShareLink";
import CubeSpinner from "@/components/CubeSpinner";
import StatusBadge from "@/components/StatusBadge";
import styles from "./GenerationResult.module.css";

interface Gen {
  id: string;
  status: "pending" | "processing" | "ready" | "failed";
  glbUrl: string | null;
  posterUrl: string | null;
  qrDataUrl: string | null;
  finishPrompt: string | null;
  heightCm: number | null;
  widthCm: number | null;
  depthCm: number | null;
  dimensionsM: number[] | null;
  scaleWarning?: string | null;
  inputImageUrls?: string[] | null;
  error: string | null;
  progress: number;
}

const WAIT_MESSAGES = [
  "Reading your photo…",
  "Sculpting the 3D shape…",
  "Adding the materials and finish…",
  "Tidying it up for your phone…",
  "Almost there…",
];

// Presentation-only checklist derived from the existing `progress` value — no
// new data or behaviour. A step is done once progress passes its threshold.
const STEPS = [
  { label: "Reading your photo", at: 20 },
  { label: "Generating the 3D shape", at: 55 },
  { label: "Adding materials & finish", at: 85 },
  { label: "Preparing AR", at: 100 },
];

// Give up polling entirely after this long — the server-side staleness
// recovery gets ~3 attempts well within it, so past this the record is stuck.
const MAX_POLL_MS = 10 * 60_000;
// Blob reads can lag briefly right after creation — tolerate a few 404s
// before concluding the link is genuinely wrong or expired.
const MAX_CONSECUTIVE_404 = 5;

export default function GenerationResult({ id }: { id: string }) {
  const [gen, setGen] = useState<Gen | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    // Local flag (not a shared ref) so each effect instance can only be
    // cancelled by its own cleanup — avoids a doubled poll loop under
    // React StrictMode's mount/cleanup/mount in dev.
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let misses = 0;
    const startedAt = Date.now();

    const notFoundGen = (): Gen => ({
      id,
      status: "failed",
      glbUrl: null,
      posterUrl: null,
      qrDataUrl: null,
      finishPrompt: null,
      heightCm: null,
      widthCm: null,
      depthCm: null,
      dimensionsM: null,
      error: "We couldn't find this model — the link may be wrong or expired.",
      progress: 100,
    });

    function schedule() {
      if (!active) return;
      // Back off once the first minute has passed — nothing moves that fast.
      timer = setTimeout(poll, Date.now() - startedAt > 60_000 ? 10_000 : 4_000);
    }

    async function poll() {
      if (!active) return;
      // Don't burn requests while the tab is hidden — the visibilitychange
      // listener below resumes the instant it's visible again.
      if (document.visibilityState === "hidden") {
        schedule();
        return;
      }
      if (Date.now() - startedAt > MAX_POLL_MS) {
        setStalled(true);
        return;
      }
      try {
        const res = await fetch(`/api/generations/${id}`, { cache: "no-store" });
        if (res.status === 404) {
          misses += 1;
          if (misses >= MAX_CONSECUTIVE_404) {
            setGen(notFoundGen());
            return;
          }
          schedule();
          return;
        }
        if (!res.ok) {
          // Transient server blip — keep polling.
          schedule();
          return;
        }
        misses = 0;
        const data: Gen = await res.json();
        if (!active) return;
        setGen(data);
        if (data.status === "ready" || data.status === "failed") return;
      } catch {
        /* transient network error — keep polling */
      }
      schedule();
    }
    poll();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id]);

  // Rotate reassuring messages while waiting.
  useEffect(() => {
    if (gen && (gen.status === "ready" || gen.status === "failed")) return;
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % WAIT_MESSAGES.length), 3500);
    return () => clearInterval(t);
  }, [gen]);

  const status = gen?.status ?? "pending";

  if (status === "failed") {
    return (
      <main className={styles.main}>
        <div className={styles.failCard}>
          <span className={styles.failIcon} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M10.3 3.8 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 className={styles.failTitle}>That one didn&apos;t generate</h1>
          <p className={styles.muted}>
            {gen?.error ?? "The 3D generation failed."} It can struggle with busy backgrounds
            or blurry photos — a clear, straight-on shot, cropped to just the furniture, works best.
          </p>
          <p className={styles.reassure}>This didn&apos;t count against your free models.</p>
          <div className={styles.failActions}>
            <Link href="/dashboard" className="btn btn-secondary btn-block">Back to dashboard</Link>
          </div>
          <p className={styles.failFallback}>
            Rather not fight with photos? We can{" "}
            <Link href="/#pricing" className={styles.accentLink}>hand-build it for you</Link> from £149.
          </p>
        </div>
      </main>
    );
  }

  if (status !== "ready" || !gen?.glbUrl) {
    const pct = Math.max(5, Math.min(99, gen?.progress ?? 5));
    const activeStep = STEPS.findIndex((s) => pct < s.at);
    return (
      <main className={styles.main}>
        <div className={styles.generatingStage}>
          <CubeSpinner size={84} onDark />
          <h1 className={styles.waitTitle}>Building your 3D model</h1>
          <p className={styles.waitMsg} aria-live="polite">{WAIT_MESSAGES[msgIndex]}</p>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Building your 3D model"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          {stalled ? (
            <p className={styles.stalledNote} role="alert">
              This is taking longer than usual. We&apos;ve stopped checking for now —
              your model may still finish; look in your{" "}
              <Link href="/dashboard">dashboard</Link> in a few minutes.
            </p>
          ) : (
            <p className={styles.finePrint}>
              You can leave this page — we&apos;ll keep it in your dashboard.
            </p>
          )}
        </div>

        <ol className={styles.steps}>
          {STEPS.map((step, i) => {
            const done = activeStep === -1 || i < activeStep;
            const current = i === activeStep;
            const state = done ? "done" : current ? "current" : "pending";
            return (
              <li key={step.label} className={`${styles.step} ${styles[state]}`}>
                <span className={styles.stepMark} aria-hidden="true">
                  {done ? (
                    "✓"
                  ) : current ? (
                    <span className={styles.stepSpinner} />
                  ) : (
                    <span className={styles.stepDot} />
                  )}
                </span>
                <span className={styles.stepLabel}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      </main>
    );
  }

  const dims = gen.dimensionsM;
  const dimsCm = dims ? dims.map((d) => Math.round(d * 100)) : null;
  // Anchor priority mirrors the optimiser: height, then width, then depth.
  const heightAnchored = gen.heightCm != null && gen.heightCm > 0;
  const widthAnchored = !heightAnchored && gen.widthCm != null && gen.widthCm > 0;
  const depthAnchored = !heightAnchored && !widthAnchored && gen.depthCm != null && gen.depthCm > 0;
  const anchored = heightAnchored || widthAnchored || depthAnchored;
  // Cross-check the AI-estimated axes against what the builder confirmed: a big
  // gap means Meshy's proportions are off (the estimated axes aren't
  // trustworthy). The anchored axis matches by construction, so checking all
  // three only ever flags the estimated ones.
  const off = (confirmed: number | null, actualCm: number | undefined) =>
    confirmed != null && confirmed > 0 && actualCm != null && Math.abs(actualCm - confirmed) / confirmed > 0.15;
  const proportionMismatch =
    !!dimsCm && (off(gen.widthCm, dimsCm[0]) || off(gen.heightCm, dimsCm[1]) || off(gen.depthCm, dimsCm[2]));
  return (
    <main className={styles.main}>
      <header className={styles.resultHeader}>
        <div className={styles.resultHeaderTop}>
          <p className="kicker kickerAccent">Instant 3D</p>
          <StatusBadge status="ready" />
        </div>
        <h1>Here it is — view it in your room</h1>
      </header>

      <section className={styles.viewerWrap}>
        <ModelViewer
          glb={gen.glbUrl}
          poster={gen.posterUrl ?? undefined}
          alt="Your AI-generated 3D model"
          placement="floor"
          stage="dark"
          arTone="accent"
        />
        {dimsCm ? (
          <p className={styles.sizeCaption}>
            {anchored ? (
              <>
                {/* Name the anchored axis as real, and ONLY the others as
                    estimates — calling the same number both undermines the
                    honesty that sells the paid tier. */}
                {heightAnchored ? (
                  <>
                    <strong>Height {dimsCm[1]} cm</strong> — its real height, built into the model.{" "}
                    Width &amp; depth (<strong>{dimsCm[0]} × {dimsCm[2]} cm</strong>) are an AI estimate.
                  </>
                ) : widthAnchored ? (
                  <>
                    <strong>Width {dimsCm[0]} cm</strong> — its real width, built into the model.{" "}
                    Height &amp; depth (<strong>{dimsCm[1]} × {dimsCm[2]} cm</strong>) are an AI estimate.
                  </>
                ) : (
                  <>
                    <strong>Depth {dimsCm[2]} cm</strong> — its real depth, built into the model.{" "}
                    Width &amp; height (<strong>{dimsCm[0]} × {dimsCm[1]} cm</strong>) are an AI estimate.
                  </>
                )}
                {proportionMismatch ? (
                  <span className={styles.warn}> The AI&apos;s estimated proportions differ from the sizes you entered — treat the estimated sizes as rough.</span>
                ) : null}
              </>
            ) : (
              <>Approx <strong>{dimsCm[0]} × {dimsCm[1]} × {dimsCm[2]} cm</strong> (W×H×D) — auto-estimated. Add the real height for true size.</>
            )}
            {gen.scaleWarning ? (
              <span className={styles.warn}> The final size came out unusual for furniture — double-check it looks right before showing a client.</span>
            ) : null}
          </p>
        ) : null}
        <p className={styles.hint}>
          {gen.inputImageUrls && gen.inputImageUrls.length >= 2 ? (
            <>Built from <strong>{gen.inputImageUrls.length} angles</strong> for a sharper shape. </>
          ) : null}
          Drag to spin it. On your phone, tap <strong>View in your room</strong>, point at
          the floor by your wall, then slide it back to the wall and walk around it.
        </p>
        <p className={styles.arNote}>
          Android locks it at the real size. iPhone opens it at roughly the right size but
          lets you pinch to resize — an exact, locked-to-the-millimetre fit comes with the
          hand-built service.
        </p>
      </section>

      {dimsCm ? (
        <section className={styles.dims} aria-label="Dimensions">
          <div className={styles.dimCard}>
            <span className={styles.dimLabel}>Width</span>
            <span className={styles.dimValue}>{dimsCm[0]}</span>
          </div>
          <div className={styles.dimCard}>
            <span className={styles.dimLabel}>Height</span>
            <span className={styles.dimValue}>{dimsCm[1]}</span>
          </div>
          <div className={styles.dimCard}>
            <span className={styles.dimLabel}>Depth</span>
            <span className={styles.dimValue}>{dimsCm[2]}</span>
          </div>
          <p className={styles.dimsUnit}>centimetres</p>
        </section>
      ) : null}

      <ShareLink title="Your 3D design — view it in your room" />

      {gen.qrDataUrl ? (
        <section className={styles.qrCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gen.qrDataUrl} alt="QR code linking to this 3D model" className={styles.qr} />
          <div>
            <p className={styles.qrTitle}>Scan to view in your room</p>
            <p className={styles.qrText}>
              Point your client&apos;s phone camera here — no app needed.
            </p>
          </div>
        </section>
      ) : null}

      <section className={`card-dark ${styles.upsell}`}>
        <p className="kicker kickerAccent">Need it exact?</p>
        <h2 className={styles.upsellTitle}>Want it millimetre-accurate?</h2>
        <p className={styles.upsellText}>
          This is a quick AI preview — great for getting your client excited. When you&apos;ve
          won the job, we&apos;ll hand-build the real design in Rhino, true to your measurements,
          with photoreal renders.
        </p>
        <Link href="/#pricing" className="btn btn-ghost-dark btn-block">See the hand-built service →</Link>
      </section>

      <footer className={styles.footer}>
        <p>
          AI-generated visual — an indication only. Final dimensions, materials and finishes
          are confirmed on your written quote.
        </p>
      </footer>
    </main>
  );
}
