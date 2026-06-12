// Mirrors data/*.json into public/data/*.json so the runtime can fetch the
// dataset as a static asset (matches the M3.2 PWA caching plan).
//
// Called automatically by build-dataset.ts after rewriting characters.json.
// Run manually via `npm run data:sync` after editing traits.json or
// questions.json by hand (or any other data/*.json file).

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "data");
const DEST = path.join(ROOT, "public", "data");

const FILES = ["characters.json", "traits.json", "questions.json"] as const;

export function syncPublicData(verbose = true): void {
  if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

  for (const file of FILES) {
    const src = path.join(SRC, file);
    const dest = path.join(DEST, file);
    if (!fs.existsSync(src)) {
      console.error(`\nMissing source file:  ${src}`);
      console.error(
        `  Run \`npm run dataset:build\` first if this is characters.json.\n`,
      );
      process.exit(1);
    }
    fs.copyFileSync(src, dest);
    if (verbose) {
      const bytes = fs.statSync(dest).size;
      const kb = (bytes / 1024).toFixed(1);
      console.log(`  synced public/data/${file} (${kb} KB)`);
    }
  }
}

// CLI entry — only run when invoked directly, not when imported.
const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.url.replace(/^file:\/\//, ""));
if (invokedDirectly || process.argv[1]?.endsWith("sync-public-data.ts")) {
  console.log("Mirroring data/ → public/data/…");
  syncPublicData(true);
  console.log("Done.");
}
