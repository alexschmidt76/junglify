# Junglify API

Serverless API for Junglify, deployed on Vercel at `https://api.junglify.org`.

Routes follow Vercel filesystem routing from the `api/` directory, so every endpoint lives under `/api/...`. Rewrites in `vercel.json` add shorter aliases without the `/api` prefix (e.g. `/jungles/:id` -> `/api/jungles/:id`); both forms work.

## Root

| Method | Endpoint      | Alias     | Description                    |
|--------|---------------|-----------|--------------------------------|
| GET    | `/api`        | `/`       | Welcome message + monkey facts |
| GET    | `/api/health` | `/health` | Health check                   |

## Auth (`/api/auth/*`)

Handled by the Better Auth catch-all (`api/auth/[...all].ts`). Main routes with the current plugins (email/password, username, bearer):

| Method | Endpoint                     | Alias                         | Description                          |
|--------|------------------------------|-------------------------------|--------------------------------------|
| POST   | `/api/auth/sign-up/email`    | `/auth/sign-up/email`         | Create account with email + password |
| POST   | `/api/auth/sign-in/email`    | `/auth/sign-in/email`         | Sign in with email                   |
| POST   | `/api/auth/sign-in/username` | `/auth/sign-in/username`      | Sign in with username                |
| POST   | `/api/auth/sign-out`         | `/auth/sign-out`              | End the current session              |
| GET    | `/api/auth/get-session`      | `/auth/get-session`           | Get the current session              |

Clients shouldn't call these directly, use the shared `@repo/auth` client.

## Jungles (`/api/jungles/*`)

| Method | Endpoint                  | Alias                 | Description                                      |
|--------|---------------------------|-----------------------|--------------------------------------------------|
| GET    | `/api/jungles`            | `/jungles`            | Info message, or jungle lookup via `?url=<url>`  |
| GET    | `/api/jungles/:id`        | `/jungles/:id`        | Get jungle by id                                 |
| POST   | `/api/jungles/create`     | `/jungles/create`     | Create a jungle (`{ url, planted_by_user_id? }`) |
| PUT    | `/api/jungles/update/:id` | `/jungles/update/:id` | Update a jungle                                  |
| DELETE | `/api/jungles/delete/:id` | `/jungles/delete/:id` | Delete a jungle                                  |
