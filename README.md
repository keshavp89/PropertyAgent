# PropertyAgent

A brokerage desk for sale and rent listings, customer briefs, enquiries, follow-ups, and ranked property matches.

The browser never receives a database connection. Pages and API routes run on the server, talk to Lakebase Postgres through Prisma over a pooled SSL connection, and scope every row to the signed-in brokerage.

## What agents can do

- Keep apartments, houses, villas, plots, land, offices, commercial space, and warehouses, for sale or rent.
- Open a customer file with a brief, then record later changes. Older briefs stay on the timeline.
- Log enquiries and follow-ups, and move an enquiry through the pipeline.
- See stock ranked against the active brief, with the reasons for each score.

Owners and admins see the whole brokerage. Members see every listing, edit the listings they added, and see only the customers assigned to them.

## Stack

- Next.js on Vercel
- Neon Auth (managed Better Auth) for sign-in, sessions, and brokerage membership
- Prisma and `pg` against the Neon pooled host (`sslmode=require`)
- Direct Neon host for migrations only
- Zod validation on every write
- Parameterized Prisma queries, including the raw membership and rate-limit statements
- Per-user API rate limits stored in Postgres

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables. Do not prefix them with `NEXT_PUBLIC_`.

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled connection string. The host must contain `-pooler`. Include `sslmode=verify-full`. |
| `DIRECT_URL` | Direct connection string, without `-pooler`. Used by `prisma migrate deploy`. |
| `NEON_AUTH_BASE_URL` | Branch Auth URL, including the `/auth` path. |
| `NEON_AUTH_COOKIE_SECRET` | At least 32 characters. `openssl rand -base64 32`. |

Copy `.env.example` to `.env.local` for local work. `.env.local` is gitignored.

This repo is wired for the existing Neon project `winter-brook-80677016` (database `PropertyDB`, region `aws-ap-southeast-1`). Auth and the organization plugin are already enabled on the `production` branch. Localhost is allowed for sign-in. Add the Vercel production origin to Neon Auth trusted domains before inviting real users.

## Scripts

```bash
npm install
npm run db:migrate
npm run dev
```

```bash
npm test
npm run guard
npm run lint
npm run typecheck
```

The Vercel build command can stay `npm run build`. Run `npm run db:migrate` once per environment before the first deploy, with `DIRECT_URL` set.

## Security notes

- `/desk` requires a session. API routes return 401 JSON when the session is missing.
- The active brokerage is an httpOnly cookie. Every request checks that the user is a member of that organization in `neon_auth`.
- A missing record in another brokerage is a 404, so callers cannot tell whether an id exists elsewhere.
- Auth cookies and the database password stay on the server. `scripts/guard-client-secrets.mjs` fails the check if a client component references them.
