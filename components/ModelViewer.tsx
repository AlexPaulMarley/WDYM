"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@vercel/analytics";
import styles from "./ModelViewer.module.css";

interface ModelViewerProps {
  glb: string;
  usdz?: string;
  poster?: string;
  alt: string;
  placement?: "floor" | "wall";
  /** AR-button colour: accent (sage, default), ink (neutral, white-label), or light (white pill). */
  arTone?: "accent" | "ink" | "light";
  /** Stage background: dark showroom (default) or neutral premium. */
  stage?: "dark" | "neutral";
}

/** Chat-app embedded browsers that often cannot launch AR. */
const IN_APP_UA = /Instagram|FBAN|FBAV|FB_IAB|Line\/|WhatsApp/i;

export default function ModelViewer({
  glb,
  usdz,
  poster,
  alt,
  placement = "floor",
  arTone = "accent",
  stage = "dark",
}: ModelViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [arFailed, setArFailed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Client-only environment check; renders false on the server and during
  // hydration, then the real value — no state-in-effect needed.
  const inAppBrowser = useSyncExternalStore(
    () => () => {},
    () => IN_APP_UA.test(navigator.userAgent),
    () => false,
  );

  useEffect(() => {
    // <model-viewer> is a web component; register it client-side only. If the
    // chunk fails on a flaky mobile connection, surface it instead of leaving
    // a dead grey box with a non-working AR button.
    if (!customElements.get("model-viewer")) {
      import("@google/model-viewer").catch(() => setLoadFailed(true));
    }
  }, []);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    // Only WebXR reports failures here — Quick Look / Scene Viewer launches
    // are fire-and-forget, which is why the in-app banner above exists.
    // We also use ar-status to measure engagement (how often AR is opened and
    // how long clients stay in it) — the signal that justifies investing in the
    // room-scan/wall features later.
    let arStart = 0;
    const onArStatus = (event: Event) => {
      const status = (event as CustomEvent<{ status?: string }>).detail?.status;
      if (status === "failed") setArFailed(true);
      if (status === "session-started") {
        arStart = performance.now();
        track("ar_opened", { placement });
      } else if (status === "not-presenting" && arStart) {
        track("ar_closed", { seconds: Math.round((performance.now() - arStart) / 1000) });
        arStart = 0;
      }
    };
    el.addEventListener("ar-status", onArStatus);
    return () => el.removeEventListener("ar-status", onArStatus);
  }, [loadFailed, placement]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // Clipboard unavailable (some in-app browsers) — selectable URL is below.
    }
  };

  if (loadFailed) {
    return (
      <div className={styles.fallback}>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={alt} className={styles.fallbackPoster} />
        ) : null}
        <p>
          The 3D viewer couldn&apos;t load — please check your connection and
          refresh the page.
        </p>
      </div>
    );
  }

  return (
    <>
      {inAppBrowser ? (
        <div className={styles.banner}>
          <p>
            <strong>Viewing inside an app?</strong> AR works best in your
            phone&apos;s own browser — tap the <strong>⋯</strong> menu and
            choose <strong>“Open in Safari/Chrome”</strong>, or copy the link:
          </p>
          <button type="button" className={styles.copyButton} onClick={copyLink}>
            {linkCopied ? "Link copied ✓" : "Copy link"}
          </button>
        </div>
      ) : null}

      <model-viewer
        ref={viewerRef}
        className={`${styles.viewer} ${stage === "neutral" ? styles.stageNeutral : styles.stageDark}`}
        src={glb}
        // Without ios-src, model-viewer generates a USDZ on-device for Quick
        // Look — fine as a fallback, but real designs should ship the Rhino
        // USDZ export for best material fidelity.
        {...(usdz ? { "ios-src": usdz } : {})}
        {...(poster ? { poster } : {})}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        ar-placement={placement}
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1"
      >
        <button
          slot="ar-button"
          className={`${styles.arButton} ${
            arTone === "ink"
              ? styles.arInk
              : arTone === "light"
                ? styles.arLight
                : styles.arAccent
          }`}
        >
          View in your room
        </button>
      </model-viewer>

      {arFailed ? (
        <p className={styles.arFailed}>
          AR couldn&apos;t start on this device — you can still spin the model
          above with your finger, and the photos show the design in detail.
        </p>
      ) : null}
    </>
  );
}
