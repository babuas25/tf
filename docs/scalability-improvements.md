# Scalability Improvements

- **[DB-side pagination]** Updated `src/lib/db/travellers.ts` with `getTravellersPaged()` to perform LIMIT/OFFSET in the database and return `total` alongside `rows`.
- **[API usage]** `src/app/api/travellers/route.ts` now calls `getTravellersPaged()` and computes pagination metadata without loading full datasets into memory.
- **[Admin rate limiting]** Applied `rateLimiters.admin` to `src/app/api/superadmin/slides/route.ts` to protect privileged routes.
- **[TypeScript target]** Bumped `tsconfig.json` target to `es2021` to reduce transpilation overhead.

## Next steps (optional)

- **[Aggregate counts]** Replace the current `totalRes.length` approach with a database aggregate count for better performance at scale.
- **[Search indexing]** Add DB indexes for `travellers` on `createdByUserId`, `createdAt`, and frequently searched text fields. Consider trigram/full-text indexing for LIKE queries.
- **[Distributed cache/limits]** Migrate in-memory cache and rate limiter to Redis (e.g., Upstash) to support horizontal scaling.
