import styles from "./CubeSpinner.module.css";

interface CubeSpinnerProps {
  /** Diameter of the spinner ring in px. Default 64. */
  size?: number;
  /** Render on a dark stage (lighter track). Default false. */
  onDark?: boolean;
  /** Optional title shown under the spinner. */
  label?: string;
  /** Optional sub-line under the label. */
  sublabel?: string;
}

/** Branded cube/spinner for loading states (ring + cube glyph). */
export default function CubeSpinner({
  size = 64,
  onDark = false,
  label,
  sublabel,
}: CubeSpinnerProps) {
  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.ring} ${onDark ? styles.onDark : ""}`}
        style={{ width: size, height: size }}
        role="status"
        aria-label={label ?? "Loading"}
      >
        <span className={styles.track} />
        <span className={styles.arc} />
        <span className={styles.cube}>
          <svg width="38%" height="38%" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2l9 5v10l-9 5-9-5V7l9-5z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M12 12l9-5M12 12v10M12 12L3 7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {label ? (
        <div className={`${styles.label} ${onDark ? styles.labelDark : ""}`}>{label}</div>
      ) : null}
      {sublabel ? <div className={styles.sublabel}>{sublabel}</div> : null}
    </div>
  );
}
