import type { Metadata } from "next";
import Header from "@/components/Header";
import DashboardClient from "./DashboardClient";

// The dashboard shows only the models created in THIS browser (ids kept in
// localStorage by /create) — the server no longer lists every visitor's
// generation to everyone. Accounts replace this with a real per-user store.
export const metadata: Metadata = {
  title: "Your models",
  robots: { index: false, follow: false },
};

export default function Dashboard() {
  return (
    <>
      <Header />
      <DashboardClient />
    </>
  );
}
