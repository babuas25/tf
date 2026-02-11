# Reliability Hardening

- **[Input validation]** Added Zod schemas in `src/app/api/travellers/route.ts` (POST) and `src/app/api/travellers/[id]/route.ts` (PUT) to validate and normalize payloads.
- **[Rate limiting]** Wrapped `superadmin/slides` POST with `rateLimiters.admin`. Existing travellers routes already use `rateLimiters.api`.
- **[Fail-fast envs]** `src/lib/firebase/admin.ts` now throws in production if `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, or `FIREBASE_PRIVATE_KEY` are missing.
- **[Consistent responses]** All modified handlers return `NextResponse` on every path with structured error bodies.

## Guidance

- **[Schema updates]** Extend Zod schemas as fields evolve. Keep client form validation in sync with server schemas.
- **[Error monitoring]** Integrate an external provider (e.g., Sentry) in `src/lib/error-monitoring.ts` TODO hooks for production visibility.
- **[Timeouts/retries]** Consider wrapping DB/Firebase calls with explicit timeouts and retry policies (e.g., `p-timeout`, `p-retry`).
