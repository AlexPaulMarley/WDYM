import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ModelViewer from "@/components/ModelViewer";
import ShareLink from "@/components/ShareLink";
import { getAllDesigns, getDesignBySlug } from "@/lib/designs";
import styles from "./page.module.css";

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  // Deliberately includes unlisted designs — their pages must still exist for
  // direct links and QR codes; they are only hidden from listings and search.
  return getAllDesigns().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const design = getDesignBySlug(slug);
  if (!design) return {};
  return {
    title: `${design.title} — view it in your room`,
    description: design.description,
    // noindex keeps private demos out of search; OG stays so WhatsApp/iMessage
    // link previews keep working (scrapers read og: tags regardless of robots).
    ...(design.unlisted ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: `${design.title} — view it in your room`,
      description: design.description,
      ...(design.model.poster ? { images: [design.model.poster] } : {}),
    },
  };
}

export default async function DesignPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const design = getDesignBySlug(slug);
  if (!design) notFound();

  const { width, height, depth } = design.dimensionsMm;

  return (
    <main className={styles.main}>
      {/* WHITE-LABEL builder header — carries the builder's brand, not WDYM's. */}
      <header className={styles.builderBar}>
        <div className={styles.brand}>
          <span className={styles.logoBox}>
            {design.builder.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={design.builder.logoUrl} alt={design.builder.name} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 11L12 5l8 6v8H4z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 19v-5h6v5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className={styles.brandName}>{design.builder.name}</span>
        </div>
        {design.builder.instagram ? (
          <a
            className={styles.contact}
            href={design.builder.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact
          </a>
        ) : null}
      </header>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{design.title}</h1>
        {design.description ? (
          <p className={styles.description}>{design.description}</p>
        ) : null}
      </div>

      <section className={styles.viewerWrap}>
        <ModelViewer
          glb={design.model.glb}
          usdz={design.model.usdz}
          poster={design.model.poster}
          alt={`3D model of ${design.title}`}
          placement={design.placement}
          stage="neutral"
          arTone="ink"
        />
        <p className={styles.reassure}>
          <span className={styles.reassureDot} aria-hidden="true" />
          Opens straight from your phone — no app to install
        </p>
        <p className={styles.hint}>
          Drag to look around — then tap <strong>View in your room</strong> on
          your phone to stand it in your space. On Android it appears locked at the
          real size; on iPhone it opens at roughly the right size and you can pinch
          to adjust.
        </p>
        {design.placement === "wall" ? (
          <p className={styles.hint}>
            On iPhone this wall-mounted piece may appear at floor level in AR —
            the renders show its exact wall position.
          </p>
        ) : null}
        <ShareLink title={`${design.title} — view it in your room`} />
      </section>

      <section className={styles.details}>
        <p className="kicker">Specification</p>
        <dl className={`card ${styles.specCard}`}>
          <div className={styles.specRow}>
            <dt className={styles.specLabel}>Width</dt>
            <dd className={styles.specValue}>{width} mm</dd>
          </div>
          <div className={styles.specRow}>
            <dt className={styles.specLabel}>Height</dt>
            <dd className={styles.specValue}>{height} mm</dd>
          </div>
          <div className={styles.specRow}>
            <dt className={styles.specLabel}>Depth</dt>
            <dd className={styles.specValue}>{depth} mm</dd>
          </div>
        </dl>
      </section>

      {design.qr ? (
        <section className={styles.qr}>
          <div className={`card-tinted ${styles.qrCard}`}>
            <div className={styles.qrImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={design.qr} alt={`QR code for ${design.title}`} />
            </div>
            <div>
              <p className={styles.qrTitle}>Scan to view at home</p>
              <p className={styles.qrText}>
                On a computer? Scan this with your phone to place it in your
                room.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <footer className={styles.footer}>
        <p className={styles.disclaimer}>
          This 3D visual is an indication of the proposed design only — final
          dimensions, materials and finishes are confirmed on your written
          quote.
        </p>
        <div className={styles.credit}>
          <span className={styles.creditLabel}>3D &amp; AR by</span>
          <Link href="/" className={styles.creditBrand}>
            We Design You Make
          </Link>
          <span className={styles.creditSep}>·</span>
          <Link href="/privacy" className={styles.creditPrivacy}>
            Privacy
          </Link>
        </div>
      </footer>
    </main>
  );
}
