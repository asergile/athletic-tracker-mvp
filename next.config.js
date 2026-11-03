/** @type {import('next').NextConfig} */
const nextConfig = {
  // No experimental features needed for MVP
  async redirects() {
    return [
      // /weekly-view was retired in favor of Trends (Phase 3b); keep old links working.
      { source: '/weekly-view', destination: '/trends', permanent: false }
    ]
  }
}

module.exports = nextConfig
