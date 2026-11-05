"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./examples.module.css";

/**
 * Public, filterable gallery of hand-built designs.
 * Distinct from /dashboard (the private, logged-in builder's own models).
 * Cards link to the white-label /d/[slug] viewer.
 *
 * Sample items are placeholders defined in this file (no live data source yet).
 * Thumbnails are CSS-built piece glyphs until real posters are wired in.
 */

type Category = "wardrobes" | "media-walls" | "alcoves";
type Shape = "tall-split" | "wide-split" | "tall-single" | "wide-shelf";

interface Example {
  name: string;
  builder: string;
  /** Live design slug for /d/[slug]. Omitted while the piece is a placeholder. */
  slug?: string;
  category: Category;
  shape: Shape;
  /** No real design yet — rendered as a non-clickable "Coming soon" tile. */
  comingSoon?: boolean;
}

const FILTERS: { id: "all" | Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "wardrobes", label: "Wardrobes" },
  { id: "media-walls", label: "Media walls" },
  { id: "alcoves", label: "Alcoves" },
];

// Only pieces with a real design JSON are clickable; the rest are honest
// placeholders until real jobs land (no fabricated sizes — this app's whole
// promise is honesty about size).
const EXAMPLES: Example[] = [
  { name: "Three-door wardrobe", builder: "We Design You Make", slug: "sample-wardrobe", category: "wardrobes", shape: "tall-split" },
  { name: "Media wall", builder: "Coming soon", category: "media-walls", shape: "wide-split", comingSoon: true },
  { name: "Alcove wardrobe", builder: "Coming soon", category: "alcoves", shape: "tall-split", comingSoon: true },
  { name: "Larder cupboard", builder: "Coming soon", category: "wardrobes", shape: "tall-single", comingSoon: true },
  { name: "Fitted bookcase", builder: "Coming soon", category: "alcoves", shape: "tall-split", comingSoon: true },
  { name: "TV unit & shelving", builder: "Coming soon", category: "media-walls", shape: "wide-shelf", comingSoon: true },
];

function Thumb({ shape }: { shape: Shape }) {
  const tall = shape === "tall-split" || shape === "tall-single";
  const panels =
    shape === "tall-split" ? 2 : shape === "wide-split" ? 2 : shape === "wide-shelf" ? 2 : 1;

  return (
    <div className={styles.thumb} aria-hidden="true">
      <div
        className={`${styles.piece} ${tall ? styles.pieceTall : styles.pieceWide}`}
        data-shape={shape}
      >
        {Array.from({ length: panels }).map((_, i) => (
          <span key={i} className={styles.panel} />
        ))}
      </div>
    </div>
  );
}

export default function ExamplesPage() {
  const [active, setActive] = useState<"all" | Category>("all");

  const items =
    active === "all" ? EXAMPLES : EXAMPLES.filter((e) => e.category === active);

  return (
    <>
      <Header />

      <main className={styles.main}>
        <section className={styles.intro}>
          <p className="kicker">Examples</p>
          <h1 className={styles.title}>Real pieces, viewable in your room</h1>
          <p className={styles.lede}>
            Tap any design to walk around it in 3D — and, on a phone, stand it in your room
            with AR (locked to size on Android; roughly to size on iPhone).
          </p>
        </section>

        <div className={styles.filters} role="tablist" aria-label="Filter examples by category">
          {FILTERS.map((f) => {
            const selected = active === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`${styles.chip} ${selected ? styles.chipActive : ""}`}
                onClick={() => setActive(f.id)}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <ul className={styles.grid}>
          {items.map((item) => {
            const key = item.slug ?? `${item.name}-${item.shape}`;
            if (item.comingSoon || !item.slug) {
              return (
                <li key={key}>
                  <div className={styles.cardSoon} aria-disabled="true">
                    <span className={styles.soonBadge}>Coming soon</span>
                    <Thumb shape={item.shape} />
                    <div className={styles.cardBody}>
                      <span className={styles.pieceName}>{item.name}</span>
                      <span className={styles.soonLabel}>New job coming soon</span>
                    </div>
                  </div>
                </li>
              );
            }
            return (
              <li key={key}>
                <Link href={`/d/${item.slug}`} className={styles.card}>
                  <Thumb shape={item.shape} />
                  <div className={styles.cardBody}>
                    <span className={styles.pieceName}>{item.name}</span>
                    <span className={styles.builder}>{item.builder}</span>
                    <span className={styles.view}>View in 3D &rarr;</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <section className={`card-dark ${styles.cta}`}>
          <h2 className={styles.ctaTitle}>Want one like these?</h2>
          <p className={styles.ctaText}>
            Have us hand-build yours to the millimetre.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/#pricing" className="btn btn-ghost-dark btn-block">
              See hand-built pricing
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
