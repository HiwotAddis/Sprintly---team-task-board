# TorqueWorks

## Stack

- **Backend:** Node.js, TypeScript, Express, Prisma, PostgreSQL, Redis, JWT, Socket.io
- **Frontend:** Next.js, Tailwind CSS
- **Tooling:** pnpm workspaces, Docker Compose

## Getting Started

```bash
pnpm install
docker compose up -d
cp server/.env.example server/.env
cp client/.env.example client/.env.local
pnpm --filter server exec prisma migrate deploy
pnpm dev
```
