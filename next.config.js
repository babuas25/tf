/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'tripfeels-theta.vercel.app', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'tripfeels.com', port: '', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '', pathname: '/**' },
    ],
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Fix for webpack module loading issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
  // SEO optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'
    // Build CSP differently for dev and prod
    const devCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.gstatic.com https://www.google.com https://apis.google.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://localhost:8443 https://127.0.0.1:8443 https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://va.vercel-scripts.com https://vitals.vercel-insights.com ws: wss:",
      "frame-src 'self' https://www.google.com https://*.firebaseapp.com https://*.googleapis.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src 'self' blob:",
    ].join('; ')

    const prodCsp = [
      "default-src 'self'",
      // Allow inline and blob: scripts needed by Next.js bootstrap/hydration and analytics
      "script-src 'self' 'unsafe-inline' blob: https://www.gstatic.com https://www.google.com https://apis.google.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "frame-src 'self' https://www.google.com https://*.firebaseapp.com https://*.googleapis.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Allow web workers from blob: for Next.js runtime
      "worker-src 'self' blob:",
    ].join('; ')

    const csp = isProd ? prodCsp : devCsp
    return [
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/fonts/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/favicon.ico',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          // Send CSP header
          { key: 'Content-Security-Policy', value: csp },
          // HSTS only in production and only when served over HTTPS by the platform
          ...(isProd
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=15552000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ]
  },
}

module.exports = nextConfig
