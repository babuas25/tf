# Next.js Security — Resolved (16.1.5)

## Status

- **Next.js**: `16.1.5` (all known advisories patched).
- **`npm audit`**: **0 vulnerabilities** (high and moderate resolved).

## What was fixed

1. **High severity** (GHSA-h25m-26qc-wcjf): RSC deserialization DoS → fixed in 15.5.10+.
2. **Moderate** (GHSA-9g9p-9gw9-jx7f): Image Optimizer `remotePatterns` DoS → fixed in 15.5.10 / 16.1.5+.
3. **Moderate** (GHSA-5f7q-jpqc-wp7h): PPR Resume Endpoint memory consumption → fixed in 15.6.0-canary.61+ / 16.1.5+.

## Changes made

- Upgraded `next` and `eslint-config-next` to **16.1.5**.
- Migrated `images.domains` to `images.remotePatterns` in `next.config.js`.
- Added `turbopack: {}` and use `next build --webpack` for builds (custom webpack config).
- Removed deprecated `eslint` key from `next.config.js`.
- Cleaned up unused `React` imports for Next 16 / automatic JSX runtime.

## References

- [Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478) (RSC)
- [GHSA-5f7q-jpqc-wp7h](https://github.com/advisories/GHSA-5f7q-jpqc-wp7h) (PPR)
- [GHSA-9g9p-9gw9-jx7f](https://github.com/advisories/GHSA-9g9p-9gw9-jx7f) (Image Optimizer)
