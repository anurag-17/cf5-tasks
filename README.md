This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Project architecture

This is an Office Task Management System. The stack: Next.js 16 (App Router), TypeScript,
Tailwind CSS v4, shadcn/ui, MongoDB + Mongoose, React Hook Form + Zod, TanStack Query, and
NextAuth v5 (Credentials).

> **Next.js 16 note**: `middleware.ts` was renamed to [`proxy.ts`](proxy.ts) — see
> `node_modules/next/dist/docs` before relying on older conventions.

```
app/                      App Router routes only
  api/auth/[...nextauth]/  NextAuth route handler
components/
  ui/                      shadcn/ui primitives (generated — prefer `npx shadcn add` over hand edits)
  providers/               App-wide client providers (Query, Session, Theme, Tooltip, Toaster)
lib/
  db/mongoose.ts           Cached Mongoose connection singleton
  constants/                Roles, office hours + time slots, task description word limits
  validations/              Zod schemas, shared by forms (client) and API routes (server)
  word-count.ts              Shared word-count helper (Mongoose validator + Zod schema)
  permissions.ts            Role → permission checks
  utils.ts                  shadcn `cn()` helper
models/                    Mongoose schemas: User, Project, Task
types/                     Ambient/module-augmentation types (next-auth.d.ts, global.d.ts)
hooks/                     Shared React hooks (TanStack Query hooks live here once added)
auth.ts                    NextAuth v5 config (handlers, auth, signIn, signOut)
proxy.ts                   Optimistic auth redirect for /admin, /manager, /employee
```

Roles (`lib/constants/roles.ts`): `admin`, `project_manager`, `employee`.

### Environment variables

Copy `.env.example` to `.env.local` and fill in real values (`.env.local` is gitignored):

- `MONGODB_URI` — MongoDB connection string
- `AUTH_SECRET` — generate with `npx auth secret`
- `AUTH_URL` — app base URL (used for auth callbacks)

### Scripts

- `npm run dev` / `build` / `start`
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` / `format:check` — Prettier (with `prettier-plugin-tailwindcss`)

No feature pages/API routes exist yet — this setup is architecture only.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
