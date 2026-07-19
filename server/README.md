# Goal Tracker AI — Backend (Express + TypeScript)

REST API backend for the Goal Tracker AI app.

## Stack

- **Node.js** + **Express.js** + **TypeScript**
- **MongoDB Atlas** via the `mongodb` driver (collections: `goals`, `notifications`)
- **Better Auth** for user sign-up / sign-in / sessions (MongoDB adapter, bearer plugin)
- **JWT** (HS256) issued by this server for REST API auth (`Authorization: Bearer <token>`)
- **Zod** for request validation
- **helmet**, **cors**, **morgan**, **express-rate-limit** for security & observability

## Getting started

```bash
cd server
cp .env.example .env   # then fill in MONGODB_URI, secrets
npm install
npm run dev            # http://localhost:5000
```

## Environment

See `.env.example`. Required: `MONGODB_URI`, `BETTER_AUTH_SECRET`, `JWT_SECRET`.

## Auth flow

1. `POST /api/auth/sign-up` → creates a Better Auth user and returns `{ user, token }`.
2. `POST /api/auth/sign-in` → authenticates and returns `{ user, token }`.
3. Use the returned `token` in `Authorization: Bearer <token>` for all `/api/*` routes.
4. `POST /api/auth/sign-out`, `GET /api/auth/me`.

Better Auth's own handler is also mounted at `/api/auth/*` (session/cookie based) — the
custom endpoints above additionally issue a JWT for stateless REST clients (e.g. the
Next.js frontend).

## REST API

All `/api/*` routes (except `/api/auth/*`) require a Bearer JWT.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/goals` | List goals (filters: `status`, `category`, `priority`, `q`) |
| POST | `/api/goals` | Create a goal |
| GET | `/api/goals/:id` | Get a goal |
| PATCH | `/api/goals/:id` | Update a goal |
| DELETE | `/api/goals/:id` | Delete a goal |
| GET | `/api/goals/:goalId/tasks` | List tasks for a goal |
| POST | `/api/goals/:goalId/tasks` | Add a task |
| PATCH | `/api/goals/:goalId/tasks/:taskId` | Update a task |
| DELETE | `/api/goals/:goalId/tasks/:taskId` | Delete a task |
| GET | `/api/notifications` | List notifications (`?unread=true`) |
| POST | `/api/notifications` | Create a notification |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| POST | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete a notification |
| GET | `/api/analytics/overview` | Aggregate stats |
| GET | `/api/analytics/weekly` | Last 7 days |
| GET | `/api/analytics/monthly` | Last 30 days |
| GET | `/api/analytics/categories` | Counts by category |
| POST | `/api/assistant/respond` | AI assistant action (`motivate\|tasks\|breakdown\|advice`) |
| GET | `/health` | Health check |

## Project structure

```
server/
├── src/
│   ├── config/        # env, db, auth
│   ├── controllers/   # auth, goal, task, notification, analytics, assistant
│   ├── middleware/    # auth, error, rateLimit
│   ├── models/        # goal, notification (Zod schemas + types)
│   ├── routes/        # express routers
│   ├── utils/         # ApiError, asyncHandler, jwt
│   └── index.ts       # entrypoint
├── package.json
├── tsconfig.json
└── .env.example
```
