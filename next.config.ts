import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["fluent-ffmpeg", "better-sqlite3", "@libsql/client"],
};

export default nextConfig;
