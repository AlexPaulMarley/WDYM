"use client";

import { useState } from "react";
import styles from "./ShareLink.module.css";

/**
 * "Send it to your customer" actions for a model page. Native share sheet on
 * phones (WhatsApp/iMessage — where builders actually send things), clipboard
 * fallback on desktop. Sending the link IS the product; the QR alone only
 * covers the same-room case.
 */
export default function ShareLink({ title }: { title?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? document.title, url });
        return;
      } catch {
        /* user dismissed the sheet — nothing to do */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable — the URL is still in the address bar */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={styles.row}>
      <button type="button" className={`btn btn-secondary ${styles.btn}`} onClick={share}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v12M12 3l-4 4M12 3l4 4M5 13v6h14v-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Send to your customer
      </button>
      <button type="button" className={`btn btn-secondary ${styles.btn}`} onClick={copy}>
        {copied ? "Link copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
