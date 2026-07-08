# Backend Development Rules

These rules govern all backend development in this folder. They apply to every feature, refactor, and fix — read this before writing any backend code.

## Stack

- **Framework:** NestJS (v11)
- **Database / ORM:** Prisma, following **Prisma v7+** conventions (see [Prisma conventions](#prisma-conventions))
- **Validation:** Zod — all input validation and DTOs are Zod schemas with inferred TypeScript types
- **Testing:** Jest (unit + integration)
- **Package manager:** npm

## Package management

- Every new dependency is installed via `npm install <pkg>` or `npm install -D <pkg>`.
- Never hand-edit `package.json` or `package-lock.json` to add, remove, or bump a dependency. Let npm own those files so resolution and the lockfile stay consistent.

## Folder structure

Feature-module based layout. Cross-cutting infrastructure lives under `src/common/`, grouped by kind — never inline in a feature folder, never mixed together in one file.

```
src/
  common/
    guards/
    interceptors/
    middleware/
    filters/
    decorators/
    pipes/
    validators/            # shared zod schemas / helpers
  modules/
    <feature-name>/
      <feature>.module.ts
      <feature>.controller.ts
      <feature>.controller.spec.ts   # unit tests
      services/
        <feature>.service.ts
        <feature>.service.spec.ts    # unit tests
      dto/                            # zod schemas + inferred types
  main.ts
  app.module.ts
test/
  integration/             # one integration spec per module/flow
prisma/
  schema/                  # multiple .prisma files, see below
  migrations/
```

Rules:

- A guard, interceptor, middleware, filter, pipe, or decorator always lives in the matching `src/common/<kind>/` folder — one concern per file.
- Every feature/domain gets its own module folder under `src/modules/`.
- A service used by only one module lives in that module's `services/` folder. A service shared across modules is promoted to `src/common/` or a dedicated shared module — it does not get duplicated.
- DTOs are Zod schemas under a module's `dto/` folder; the TypeScript type is inferred from the schema (`z.infer<typeof schema>`), never hand-duplicated as a separate interface.

## Feature planning process

Before writing implementation code for a feature, work through these steps in order and get alignment on them first:

1. **Identify components.** List the module, controller, service(s), DTOs/Zod schemas, and any guards/interceptors/middleware/pipes the feature needs.
2. **Choose design patterns.** Pick the pattern(s) that keep the feature modular, extensible, and future-proof (e.g. repository, strategy, factory, separate command/query services). Don't over-engineer for hypothetical future needs, but don't box the design into a corner either.
3. **Start at the data model.** Check whether existing Prisma models already cover the feature's data needs — reuse them if so. Only design new models when nothing existing fits, and keep new models small, independent, and composable rather than one large tightly-coupled model (see [Prisma conventions](#prisma-conventions)).
4. Only after 1–3 are settled, begin implementation.

## Type safety

- `any` and `unknown` are not allowed unless the user explicitly grants permission for that specific case.
- Prefer precise types, generics, and Zod-inferred types over loose typing.
- A DTO's Zod schema is the single source of truth for its shape; the TypeScript type is inferred from it, not written by hand alongside it.

## No hard-coded values

- No magic strings, numbers, enums, limits, keys, or other fixed values inline in business/application code (controllers, services, guards, interceptors, etc.).
- Any value that is required to be fixed (not user/environment configurable — e.g. a role name, a cache TTL, a pagination default, a header key) is declared once in a constants file and imported everywhere it's used.
  - Module-specific constants live in that module, e.g. `src/modules/<feature>/<feature>.constants.ts`.
  - Constants shared across modules live under `src/common/constants/`.
- This is separate from [environment variables](#environment-variables): env vars are for configurable/secret values loaded via `AppConfig`; constants files are for fixed values that are part of the code itself and don't vary by environment.
- Before adding a new constant, check the relevant constants file(s) for an existing one to reuse rather than redefining an equivalent value elsewhere.

## Prisma conventions

- No single monolithic `schema.prisma` holding every model.
- Use a dedicated `prisma/schema/` folder containing multiple `.prisma` files (Prisma v7 multi-file schema support).
- Each file groups models that are conceptually related but should stay decoupled from other groups.
- Avoid tightly coupling models across concerns. When a concept needs to combine multiple independent models, add a dedicated "assembler" model that references the independent ones — composition over one giant model.
- Before adding a new model, check existing schema files for one that already fits or can be reasonably extended.

## Environment variables

- All environment variables are loaded from a single file at the backend project root: `backend/.env`.
- A matching template file, `backend/.env.template`, must exist alongside it with every key documented (placeholder values, no real secrets), kept in sync with `.env`.
- Whenever a feature adds or changes configuration/secrets, update both `backend/.env` (real/local value) and `backend/.env.template` (placeholder + purpose) in the same change.
- Two separate database URLs are maintained, never one shared between them:
  - `DATABASE_URL` — the actual dev/production database the app runs against.
  - `TEST_DATABASE_URL` — a separate, isolated database used only for running tests (and their seeding). It must point at a distinct database (a different DB name/instance), never the same one as `DATABASE_URL`, even locally.
  - Both keys must exist in `backend/.env.template`.
- `process.env` is never accessed directly outside of one central config layer. All env vars are loaded, parsed, and validated (Zod schema) once by an `AppConfig` class/module under `src/common/config/` (e.g. `app-config.module.ts`, `app-config.service.ts`), exposed via a typed, injectable service.
  - Every other part of the app (services, guards, controllers, Prisma setup, etc.) reads configuration by injecting that config service — never via `process.env.SOMETHING` inline.
  - Adding a new env var means adding it to the `AppConfig` Zod schema (with a validated, typed getter) in the same change that adds it to `.env`/`.env.template` — not just reading it ad hoc where it's needed.

## Testing

- Two test categories only: **unit tests** and **integration tests**.
- Before writing tests for a feature, first enumerate the happy-path and sad-path scenarios to cover as a checklist — write the checklist before writing the test cases.
- Every test case is independent and isolated: it must not rely on state left behind by another test or on execution order.
- Every test case seeds the data it needs before running and cleans that data up after completion — on both pass and failure (e.g. `afterEach`/`finally`, not only on success).
- Any test (unit or integration) that touches the database must run against `TEST_DATABASE_URL`, never `DATABASE_URL`. Seeding, assertions, and cleanup all happen in that isolated test database — the dev/production database is never read from or written to by a test run.
- The test setup (e.g. Jest global setup, or a shared test Prisma client) must point Prisma at `TEST_DATABASE_URL` explicitly, so this can't be accidentally misconfigured to the real database.
- After implementing a feature, both the pre-existing test suite and the new feature's tests must pass.
- If a feature intentionally changes behavior in a way that breaks existing tests, stop and inform the user. Only modify or remove the affected existing tests after the user explicitly confirms.

## Definition of done

A feature is complete only when **lint passes, build passes, and all tests pass.** If any one of these fails, the feature is not complete.
