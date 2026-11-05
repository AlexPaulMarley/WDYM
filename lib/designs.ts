import fs from "fs";
import path from "path";

export interface Design {
  slug: string;
  title: string;
  description: string;
  builder: {
    name: string;
    logoUrl?: string;
    instagram?: string;
  };
  dimensionsMm: {
    width: number;
    height: number;
    depth: number;
  };
  model: {
    glb: string;
    usdz?: string;
    poster?: string;
  };
  /** AR anchor: "floor" for floor-standing pieces (default), "wall" for wall-mounted. */
  placement?: "floor" | "wall";
  /** Hidden from the home page and noindexed; reachable by direct link/QR only. */
  unlisted?: boolean;
  qr?: string;
  createdAt: string;
}

const designsDir = path.join(process.cwd(), "content", "designs");

export function getAllDesigns(): Design[] {
  if (!fs.existsSync(designsDir)) return [];
  return fs
    .readdirSync(designsDir)
    .filter((f) => f.endsWith(".json"))
    .map(
      (f) =>
        JSON.parse(
          fs.readFileSync(path.join(designsDir, f), "utf8"),
        ) as Design,
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Designs that may appear on public listing surfaces (home page, any future sitemap). */
export function getListedDesigns(): Design[] {
  return getAllDesigns().filter((d) => !d.unlisted);
}

export function getDesignBySlug(slug: string): Design | undefined {
  return getAllDesigns().find((d) => d.slug === slug);
}
