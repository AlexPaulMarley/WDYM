import type { Metadata } from "next";
import Header from "@/components/Header";
import GenerationResult from "@/components/GenerationResult";

export const metadata: Metadata = {
  title: "Your Instant 3D model",
  robots: { index: false, follow: false }, // per-client previews aren't for search
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <GenerationResult id={id} />
    </>
  );
}
