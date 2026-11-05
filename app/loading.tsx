import Header from "@/components/Header";
import CubeSpinner from "@/components/CubeSpinner";
import styles from "./app-states.module.css";

export default function Loading() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.loadWrap}>
          <CubeSpinner label="Loading…" sublabel="Just a moment." />
          <div className={styles.skeletons} aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className={`card ${styles.skelRow}`}>
                <div className={`${styles.skelThumb} ${styles.shimmer}`} />
                <div className={styles.skelLines}>
                  <div
                    className={`${styles.skelLine} ${styles.shimmer}`}
                    style={{ width: i === 0 ? "60%" : "55%" }}
                  />
                  <div
                    className={`${styles.skelLineSm} ${styles.shimmer}`}
                    style={{ width: i === 0 ? "40%" : "35%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
