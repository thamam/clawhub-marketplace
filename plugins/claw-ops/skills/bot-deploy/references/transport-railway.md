# Transport: railway

For bots hosted on Railway PaaS (Lettabot).

## Prerequisites

- Railway CLI installed and authenticated (`railway login`)
- Project linked (`railway link`)
- `railway.toml` present in repo root with service config

## Deploy Steps

### 1. Build locally
```bash
npm run build
```

Fix any build errors before proceeding. Do not push broken builds to Railway.

### 2. Run tests
```bash
npx vitest run
```

All tests must pass. Railway deploys are harder to roll back than local restarts.

### 3. Deploy to Railway
```bash
railway up
```

This pushes the current directory to Railway and triggers a build + deploy on their infrastructure.

### 4. Monitor deployment
```bash
railway logs --tail
```

Watch for:
- Build completion
- Service startup
- Health check passing

Railway auto-rolls back if the health check fails, but monitor to catch issues early.

### 5. Verify health check

Railway runs the health check defined in `railway.toml` automatically. Confirm the service is healthy:
```bash
railway status
```

Or check the Railway dashboard for the service's health indicator.

## Configuration

All Railway config lives in `railway.toml` at the repo root. This includes:
- Build command
- Start command
- Health check path and interval
- Environment variable references

Do not configure these in the Railway dashboard -- keep `railway.toml` as the source of truth.

## Rollback

If the deploy is broken:
```bash
railway rollback
```

Or redeploy the previous known-good commit.
