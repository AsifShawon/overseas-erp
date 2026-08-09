import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@react-pdf/renderer"],

  turbopack: {
    /*
     * Pin the workspace root to this project.
     *
     * Without this, Next.js infers the root by walking up for a lockfile and
     * finds a stray package-lock.json in the user's home directory — so
     * Turbopack scans and file-watches the ENTIRE user profile (Documents,
     * Downloads, AppData, every node_modules on the machine). That saturates
     * both RAM and disk within seconds of starting `next dev`.
     *
     * Pinning the root keeps module resolution and filesystem watching inside
     * this repository.
     */
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
