import Link from "next/link";
import { COMPANY } from "@/lib/company";
import styles from "./Footer.module.css";

/** Shared site footer, carrying the company details a UK company's website must show. Not used on white-label /d/[slug]. */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.wordmark}>We Design You Make</div>
      <div className={styles.tagline}>
        3D design for builders and carpenters · Laindon, Essex
        <br />
        {COMPANY.name}, registered in England and Wales, company number {COMPANY.number}.
        <br />
        Registered office: {COMPANY.registeredOffice}.
      </div>
      <nav className={styles.links}>
        <Link href="/privacy" className={styles.link}>
          Privacy
        </Link>
        <a href="/how-it-works" className={styles.link}>
          How it works
        </a>
        <a href={`mailto:${COMPANY.email}`} className={styles.link}>
          {COMPANY.email}
        </a>
      </nav>
      <div className={styles.copyright}>
        © {year} {COMPANY.name}
      </div>
    </footer>
  );
}
