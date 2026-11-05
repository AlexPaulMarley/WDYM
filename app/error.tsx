"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import styles from "./app-states.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the console for diagnostics.
    console.error(error);
  }, [error]);

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.errorIcon} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8v5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </div>
          <h1 className={styles.title}>Something went wrong</h1>
          <p className={styles.message}>
            We hit a snag loading this. It&rsquo;s usually temporary — give it
            another go.
          </p>
          {error?.message ? (
            <div className={styles.errorDetail} role="alert">
              Error: {error.message}
            </div>
          ) : null}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => reset()}
              className="btn btn-primary btn-block"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Try again
            </button>
            <Link href="/" className="btn btn-secondary btn-block">
              Go back home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
