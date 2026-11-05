"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge, { type ModelStatus } from "@/components/StatusBadge";
import styles from "./dashboard.module.css";

const FREE_LIMIT = 5;

/**
 * The ids of models created in THIS browser (written by /create on success).
 * Until accounts land this is what scopes the dashboard to "your models" —
 * the server no longer lists every visitor's generation to everyone.
 */
export const MODELS_STORAGE_KEY = "wdym:models";

interface Gen {
  id: string;
  status: "pending" | "processing" | "ready" | "failed";
  finishPrompt: string | null;
  posterUrl: string | null;
  dimensionsM: number[] | null;
  createdAt: number;
}

// Store statuses are pending | processing | ready | failed.
// StatusBadge speaks ready | generating | failed.
function toBadgeStatus(status: string): ModelStatus {
  if (status === "ready") return "ready";
  if (status === "failed") return "failed";
  return "generating";
}

function formatDims(dimensionsM: number[] | null | undefined): string | null {
  if (!dimensionsM || dimensionsM.length < 3) return null;
  const [w, h, d] = dimensionsM.map((m) => Math.round(m * 1000));
  if (!w || !h || !d) return null;
  return `${w} × ${h} × ${d} mm`;
}

export default function DashboardClient() {
  const [gens, setGens] = useState<Gen[] | null>(null); // null = loading

  useEffect(() => {
    let on = true;
    (async () => {
      let ids: string[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem(MODELS_STORAGE_KEY) ?? "[]");
        if (Array.isArray(parsed)) ids = parsed;
      } catch {
        /* corrupted — treat as empty */
      }
      const records = await Promise.all(
        ids.slice(0, 50).map(async (id) => {
          try {
            const res = await fetch(`/api/generations/${id}`, { cache: "no-store" });
            return res.ok ? ((await res.json()) as Gen) : null;
          } catch {
            return null;
          }
        }),
      );
      if (!on) return;
      setGens(
        records
          .filter((r): r is Gen => !!r && !!r.id)
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
      );
    })();
    return () => {
      on = false;
    };
  }, []);

  if (gens === null) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>Your models</h1>
        <p className={styles.loading}>Loading your models…</p>
      </main>
    );
  }

  // A failed attempt delivered nothing — don't count it against the free quota.
  const used = gens.filter((g) => g.status !== "failed").length;
  const remaining = Math.max(0, FREE_LIMIT - used);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Your models</h1>

      {gens.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke="var(--accent)" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M12 12l9-5M12 12v10M12 12L3 7" stroke="var(--accent)" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>No models yet</h2>
          <p className={styles.emptyText}>
            Turn a photo or sketch into a 3D model your customer can stand in front of — it takes about two minutes.
            (Models are remembered per device until accounts arrive.)
          </p>
          <p className={styles.emptyMeta}>{FREE_LIMIT} free models included</p>
        </div>
      ) : (
        <>
          <section className={`card ${styles.quota}`}>
            <div className={styles.quotaTop}>
              <span className={styles.quotaLabel}>
                {used} of {FREE_LIMIT} free models used
              </span>
              <span className={styles.quotaTier}>Free tier</span>
            </div>
            <div className={styles.quotaBar} aria-hidden="true">
              {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                <span key={i} className={i < used ? styles.segFilled : styles.segEmpty} />
              ))}
            </div>
            <p className={styles.quotaHint}>
              {remaining > 0
                ? `${remaining} model${remaining === 1 ? "" : "s"} left on the free tier.`
                : "You've used your free models — upgrade to keep creating."}
            </p>
          </section>

          <p className={`kicker ${styles.recentLabel}`}>Recent</p>
          <ul className={styles.list}>
            {gens.map((g) => {
              const dims = formatDims(g.dimensionsM);
              const date = new Date(g.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              });
              return (
                <li key={g.id}>
                  <Link href={`/g/${g.id}`} className={`card ${styles.card}`}>
                    <div className={styles.thumb}>
                      {g.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.posterUrl} alt="" />
                      ) : (
                        <span className={styles.thumbPlaceholder}>3D</span>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <strong className={styles.cardTitle}>{g.finishPrompt || "Untitled model"}</strong>
                      <span className={styles.cardMeta}>{dims ? `${date} · ${dims}` : date}</span>
                    </div>
                    <StatusBadge status={toBadgeStatus(g.status)} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
