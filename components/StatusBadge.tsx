import styles from "./StatusBadge.module.css";

export type ModelStatus = "ready" | "generating" | "failed";

interface StatusBadgeProps {
  status: ModelStatus;
  /** Override the default label text. */
  label?: string;
}

const DEFAULT_LABELS: Record<ModelStatus, string> = {
  ready: "Ready",
  generating: "Generating",
  failed: "Failed",
};

/** Pill badge reflecting model state: Ready / Generating (w/ spinner) / Failed. */
export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const text = label ?? DEFAULT_LABELS[status];

  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {status === "generating" ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        <span className={styles.dot} aria-hidden="true" />
      )}
      {text}
    </span>
  );
}
