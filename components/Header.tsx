import Link from "next/link";
import styles from "./Header.module.css";

interface HeaderProps {
  /** Render nothing — used on white-label /d/[slug] and /login. */
  hidden?: boolean;
  /** Stick to the top of the viewport. Default true. */
  sticky?: boolean;
}

/**
 * Shared WDYM header — wordmark + nav + avatar.
 * HIDDEN on the white-label /d/[slug] page and on /login (pass hidden).
 */
export default function Header({ hidden = false, sticky = true }: HeaderProps) {
  if (hidden) return null;

  return (
    <header className={`${styles.header} ${sticky ? styles.sticky : ""}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark} aria-label="We Design You Make — home">
          We Design
          <br />
          <span className={styles.wordmarkAccent}>You Make</span>
        </Link>

        <nav className={styles.nav}>
          <a href="/how-it-works" className={styles.link}>
            How it works
          </a>
        </nav>
      </div>
    </header>
  );
}
