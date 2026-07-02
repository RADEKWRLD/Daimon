# Daimon

Daimon is a sandboxed personal agent prompt system for a mental-support
conversation MVP. Profile and persona data are not stored as local JSON files.
They are persisted in Neon Postgres through Drizzle tables and accessed through
scoped repositories.

## Sandbox model

- Every business table carries `user_id`.
- tRPC context injects the current user.
- Routers validate input and call services only.
- Services use repositories; repositories require `viewerUserId`.
- AI prompt generation can only use the local tool whitelist in
  `services/prompt/local-tools.ts`.
- Safety Gate runs before the active persona prompt is read.
- `.data/` is reserved for development-only debug exports and is ignored by Git.

## Storage

- `profiles`: questionnaire summary, emotion state, communication preferences,
  risk flags, latest compressed memory.
- `agent_prompts`: one personal agent prompt record per user.
- `prompt_versions`: versioned persona spec and system prompt.
- `messages`: scoped by both `user_id` and `session_id`.

Drizzle migrations are generated from `db/schema.ts` into `db/migrations/`.
Set `DATABASE_URL` and optionally `DEEPSEEK_API_KEY`.

```bash
npm run db:generate -- --name your_change_name
npm run db:migrate
npm run db:studio
```

The initial migration is `db/migrations/0000_sandbox_storage.sql`.

## API surface

- `app/api/trpc/[trpc]/route.ts`: tRPC endpoint.
- `app/api/chat/route.ts`: streaming chat endpoint.
- Development auth fallback uses `demo-user`; production requires
  `x-daimon-user-id` or a `daimon_user_id` cookie until a real Auth.js session
  adapter is wired in.

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
