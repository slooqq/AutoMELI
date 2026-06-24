---
name: railway
description: Use for Railway deployment, infrastructure, environment variables, PostgreSQL database management, domain config, and troubleshooting. Use ONLY when working with Railway deployment of this NestJS app. Do NOT use for general NestJS coding.
---

# Railway Skill

This project is deployed on Railway. The config lives in `railway.toml` at the project root.

## Railway config (`railway.toml`)

- **Builder**: nixpacks
- **Build command**: `npm install && npm run build`
- **Start command**: `npm run start:prod`
- **Restart policy**: on_failure, max 3 retries
- **Production start command**: `npm run start:prod`

## Environment Variables (Railway Dashboard)

Set these in Railway dashboard -> Variables:

| Variable | Description | Source |
|---|---|---|
| `NODE_ENV` | `production` | — |
| `PORT` | Railway auto-injects this | Railway |
| `DATABASE_URL` | Railway Postgres connection string | Railway Plugin |
| `MELI_APP_ID` | MercadoLibre App ID | Meli dev portal |
| `MELI_SECRET_KEY` | MercadoLibre Secret Key | Meli dev portal |
| `MELI_REDIRECT_URI` | `https://<tu-dominio>.up.railway.app/auth/callback` | Config |
| `ALLOWED_ORIGINS` | CORS origins (comma separated) | Config |

## Database

- Production: Railway Postgres plugin (auto-provisioned)
- The app auto-detects `NODE_ENV=production` + `DATABASE_URL` and switches to PostgreSQL
- `synchronize: true` — tables auto-create on first deploy
- SSL is required: `ssl: { rejectUnauthorized: false }`

## Common Tasks

### Deploy

```bash
git push
```

Railway auto-deploys from the connected GitHub repo.

### View logs

In Railway dashboard, open the deployment and click "Logs".

### Check env vars at runtime

Visit `GET /auth/debug` to verify environment variables are loading correctly.

### Domain setup

1. In Railway dashboard -> Settings -> Domains, generate a `.up.railway.app` domain or add a custom domain.
2. Update `MELI_REDIRECT_URI` in Railway variables to match.
3. In MercadoLibre dev portal, update the redirect URL in the app settings.
