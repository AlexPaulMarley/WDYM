"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import styles from "./login.module.css";

type View = "form" | "sent";

// Low-friction magic-link sign-in. AUTH IS UNDECIDED: this is UI only — no
// provider/backend is wired. Submitting a valid email just shows the "sent"
// confirmation view.
const EMAIL_RE = /\S+@\S+\.\S+/;

export default function LoginPage() {
  const [view, setView] = useState<View>("form");
  const [email, setEmail] = useState("");

  const isValid = EMAIL_RE.test(email);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    // TODO: wire magic-link provider (send sign-in link to `email`).
    setView("sent");
  }

  return (
    <>
      <Header hidden />
      <main className={styles.page}>
        <div className={styles.brand}>
          We Design <span className={styles.brandAccent}>You Make</span>
        </div>

        {view === "form" ? (
          <form className={styles.panel} onSubmit={submit} noValidate>
            <h1 className={styles.title}>Sign in</h1>
            <p className={styles.sub}>
              Enter your email and we&rsquo;ll send a one-tap link. No password to
              remember.
            </p>

            <label className={styles.label} htmlFor="login-email">
              Email
            </label>
            <div className={styles.field}>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              className="btn btn-accent btn-block"
              disabled={!isValid}
              style={{ marginTop: "var(--space-3)" }}
            >
              <MailIcon />
              Email me a link
            </button>

            {/* No Terms page exists yet — don't link the word "Terms" to the
                privacy policy; add it back when real terms are written. */}
            <p className={styles.fine}>
              By continuing you agree to our{" "}
              <Link href="/privacy" className={styles.fineLink}>
                Privacy policy
              </Link>
              .
            </p>
          </form>
        ) : (
          <div className={`${styles.panel} ${styles.panelCenter}`}>
            <div className={styles.successRing}>
              <MailIcon size={34} />
            </div>
            <h1 className={styles.title}>Check your inbox</h1>
            <p className={styles.sub}>
              We&rsquo;ve sent a one-tap sign-in link to{" "}
              <span className={styles.emailShown}>{email || "your email"}</span>.
              It expires in 15 minutes.
            </p>

            <div className={styles.resend}>
              Didn&rsquo;t get it?{" "}
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => {
                  // TODO: wire magic-link provider (resend link to `email`).
                }}
              >
                Resend
              </button>
            </div>

            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setView("form")}
            >
              &larr; Use a different email
            </button>
          </div>
        )}
      </main>
    </>
  );
}

function MailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 7l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
