import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure firebase-admin and its deps are never bundled for the browser.
  // They are loaded by Node.js server components and Cloud Functions only.
  serverExternalPackages: ["firebase-admin", "google-auth-library", "gcp-metadata"],
};

export default nextConfig;
