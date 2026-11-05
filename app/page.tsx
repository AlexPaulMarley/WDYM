import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ModelViewer from "@/components/ModelViewer";
import { getListedDesigns } from "@/lib/designs";
import { COMPANY } from "@/lib/company";
import styles from "./page.module.css";

const INSTAGRAM_URL = "https://www.instagram.com/wedesignyoumake/";

const SAMPLE = {
  glb: "/models/sample-wardrobe/model.glb",
  page: "/d/sample-wardrobe",
};

/** The page's one action: a prefilled email for the free concept pictures, so the first message already says what the job is. */
const PHOTO_MAILTO = `mailto:${COMPANY.email}?subject=${encodeURIComponent("Three free concept pictures")}&body=${encodeURIComponent(
  [
    "Hi Alex,",
    "",
    "Here's a photo of a room I'm quoting for.",
    "",
    "The job: (e.g. fitted wardrobes, a media wall, a new kitchen)",
    "What the client wants:",
    "",
    "The photo is attached.",
  ].join("\n"),
)}`;

function Hero() {
  return (
    <section className={styles.hero}>
      <p className="kicker">3D design for builders and carpenters</p>
      <h1 className={styles.heroTitle}>Your next job. In their room. Before you build it.</h1>
      <p className={styles.heroLede}>
        Show your client the finished job before you cut a thing: a quick concept
        picture, or a measured 3D build they can walk round.
      </p>
      <a href={PHOTO_MAILTO} className={`btn btn-accent btn-block ${styles.heroBtn}`}>
        Send a room photo for three free concept pictures
      </a>

      <div className={styles.heroViewer}>
        <ModelViewer
          glb={SAMPLE.glb}
          alt="3D model of a fitted three-door wardrobe"
          placement="floor"
          stage="neutral"
          arTone="ink"
        />
      </div>
      <p className={styles.heroHint}>
        A sample wardrobe at true size. On your phone, tap <strong>View in your room</strong>,
        or <Link href={SAMPLE.page}>open the sample page</Link>.
      </p>
    </section>
  );
}

// shortcut: no timings on Options 1 and 2 while the concept pictures are made by hand; add them back when the app makes them.
const options: { title: string; when?: string; body: string }[] = [
  {
    title: "AI pictures",
    body: "Three ideas on your client's own room photo. An AI concept, not to scale.",
  },
  {
    title: "Room composer",
    body: "The pieces your client has picked, placed into their room photo.",
  },
  {
    title: "Measured 3D build",
    when: "About 3 working days",
    body: "Sized from a room scan and modelled in Rhino, for phone AR, a Quest 3 walk-through and drawings.",
  },
];

function Options() {
  return (
    <section className={styles.section}>
      <p className="kicker">Three ways to show your client</p>
      <h2 className={styles.sectionTitle}>One job in. Take it as far as it needs.</h2>
      <ol className={styles.steps}>
        {options.map((o, i) => (
          <li key={o.title} className={`card ${styles.stepCard}`}>
            <span className={styles.stepNum} aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <h3 className={styles.cardTitle}>
                Option {i + 1}: {o.title}
              </h3>
              {o.when ? <p className={styles.cardWhen}>{o.when}</p> : null}
              <p className={styles.cardBody}>{o.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {/* A plain link: /how-it-works is a static page, not a Next route. */}
      <a href="/how-it-works" className={styles.sectionLink}>
        Watch how it works →
      </a>
    </section>
  );
}

// Showcase pieces appear here once they're added with `npm run add-design`.
function Showcase() {
  const designs = getListedDesigns().filter((d) => d.slug !== "sample-wardrobe");
  if (designs.length === 0) return null;
  return (
    <section className={styles.section}>
      <p className="kicker">Showcase</p>
      <h2 className={styles.sectionTitle}>Stand them in your room</h2>
      <ul className={styles.workGrid}>
        {designs.map((d) => (
          <li key={d.slug}>
            <Link href={`/d/${d.slug}`} className={`card ${styles.workCard}`}>
              {d.model.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.model.poster} alt={d.title} />
              ) : (
                <div className={styles.workPlaceholder}>3D / AR</div>
              )}
              <div className={styles.workBody}>
                <strong>{d.title}</strong>
                <span>
                  {d.dimensionsMm.width} × {d.dimensionsMm.height} ×{" "}
                  {d.dimensionsMm.depth} mm
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contact() {
  return (
    <section className={styles.section} id="contact">
      <div className={`card-dark ${styles.contactCard}`}>
        <p className="kicker kickerAccent">Quoting a job?</p>
        <h2 className={styles.contactTitle}>Send a room photo. Get three concept pictures back, free.</h2>
        <p className={styles.contactLede}>
          You deal with Alex directly. Based in Laindon, working across Basildon and Essex.
        </p>
        <div className={styles.contactRows}>
          <a href={PHOTO_MAILTO} className={styles.contactRow}>
            <span className={styles.contactGlyph} aria-hidden="true">
              ✉
            </span>
            <span className={styles.contactHandle}>{COMPANY.email}</span>
          </a>
          <a href={INSTAGRAM_URL} className={styles.contactRow} target="_blank" rel="noreferrer">
            <span className={styles.contactGlyph} aria-hidden="true">
              ◎
            </span>
            <span className={styles.contactHandle}>@wedesignyoumake</span>
            <span className={styles.contactTag}>Instagram</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <Hero />
        <Options />
        <Showcase />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
