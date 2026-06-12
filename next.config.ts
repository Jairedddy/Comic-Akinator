import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin the project root explicitly. Next.js auto-detects the workspace root by
// walking up looking for a lockfile; on this machine there is a stray
// package-lock.json in the user's home directory which causes Next.js to
// mis-detect the root and double-register every module — one set rooted at
// the project (works) and another rooted at the home directory whose path
// contains a space (corrupts the manifest, breaks dev with "Unexpected
// token ':'").
//
// turbopack.root pins Turbopack's module resolution.
// outputFileTracingRoot pins Next.js's separate file-tracing system that
// otherwise still uses the bad auto-detection.
const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: PROJECT_ROOT,
  },
  outputFileTracingRoot: PROJECT_ROOT,
};

export default nextConfig;
