# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages and API routes. Public routes in `src/app/(public)`, protected in `src/app/(protected)`, APIs under `src/app/api/*`.
- `src/components`: Reusable UI and feature components (e.g., `src/components/ui/button.tsx`).
- `src/lib`: Utilities, auth, DB helpers, and domain modules (e.g., `src/lib/db.ts`, `src/lib/credits/*`).
- `src/hooks`: Custom React hooks.
- `prisma`: Prisma schema and migrations; requires `DATABASE_URL`.
- `public`: Static assets. See `docs/architecture.md` for a high-level view.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server at `http://localhost:3000`.
- `npm run build`: Generate Prisma client and build the Next.js app.
- `npm start`: Run the production build.
- `npm run lint`: Lint with Next.js/TypeScript rules.
- `npm run typecheck`: TypeScript type checking only.
- `npm run db:push` | `db:migrate` | `db:studio`: Prisma schema push, interactive migration, and DB UI.

## Coding Style & Naming Conventions
- TypeScript throughout; prefer 2-space indentation and no trailing semicolons (match existing files).
- File names: kebab-case (e.g., `credit-status.tsx`). Exported React components use PascalCase.
- Path alias `@/*` maps to `src/*` (e.g., `import { cn } from '@/lib/utils'`).
- ESLint config extends `next/core-web-vitals` and `next/typescript`. Fix issues before PRs.

## Data Access Rules
- Never import or use the Prisma client (`@/lib/db`) in Client Components or client-side code. Perform all database access on the server via:
  - Server Components (App Router),
  - API routes under `src/app/api/*`, or
  - Server Actions.
- For client UIs that need data, either:
  - Fetch in a Server Component and pass as props, or
  - Use a custom hook built on TanStack Query that calls an API route through `@/lib/api-client`.

## Testing Guidelines
- No test runner is preconfigured. If adding tests, prefer Vitest/Jest + React Testing Library.
- Co-locate tests as `*.test.ts(x)` near source or under `__tests__/` (excluded from build). Keep tests deterministic and fast.
- Aim for meaningful coverage on business logic and API handlers; snapshot sparingly.

## Commit & Pull Request Guidelines
- Use Conventional Commits when possible (e.g., `feat:`, `fix:`, `docs:`). Keep messages imperative and scoped.
- PRs must include: concise description, linked issues, screenshots for UI, and steps to validate locally.
- Ensure `npm run lint`, `npm run typecheck`, and `npm run build` pass before requesting review.

## Security & Configuration Tips
- Do not commit secrets. Copy `.env.example` to `.env.local` and fill required keys (Clerk, `DATABASE_URL`, optional Stripe).
- After schema changes, run `npm run db:migrate` and document notable model updates in the PR.

## Credits Integration
- Backend config `src/lib/credits/feature-config.ts` is the single source of truth.
- Keys type derives from the config: `export type FeatureKey = keyof typeof FEATURE_CREDIT_COSTS`.
- Examples: `ai_text_chat` (1) and `ai_image_generation` (5), mapped to Prisma `OperationType`.
- Use `validateCreditsForFeature`/`deductCreditsForFeature` from `src/lib/credits/deduct.ts` in API routes.
  - Prefer typing a variable as `FeatureKey` rather than hardcoding strings to get compile-time checks.
 - One-time credit packs: map Stripe Price IDs in `src/lib/clerk/credit-packs.ts`. The Clerk webhook (`/api/webhooks/clerk`) adds credits on `invoice.payment_succeeded` via `addUserCredits`.

## Agent Guides
- `agents/security-check.md`: Pre-merge security review checklist.
- `agents/frontend-development.md`: UI implementation with App Router, Tailwind, and forms.
- `agents/backend-development.md`: API routes with Zod validation, auth, and Prisma.
- `agents/database-development.md`: Prisma schema changes, migrations, and indexing.
- `agents/architecture-planning.md`: Lightweight planning template before coding.
