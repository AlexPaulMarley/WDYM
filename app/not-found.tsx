import Link from "next/link";
import Header from "@/components/Header";
import styles from "./app-states.module.css";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.bigCode} aria-hidden="true">
            4<span className={styles.mid}>0</span>4
          </div>
          <h1 className={styles.title}>We can&rsquo;t find that one</h1>
          <p className={styles.message}>
            That design or link may have moved, or the address has a typo.
            Let&rsquo;s get you back.
          </p>
          <div className={styles.actions}>
            <Link href="/" className="btn btn-primary btn-block">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
