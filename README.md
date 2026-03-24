# axonhub-quota

`axonhub-quota` is a standalone quota and usage dashboard for AxonHub.

Users only paste an AxonHub API key in the frontend. The backend proxy stores AxonHub admin credentials in environment variables, signs in to AxonHub admin APIs, resolves the API key to its internal ID, and returns usage metrics for that key.

## Features

- default Chinese UI with Chinese / English switching
- auto-refreshing quota dashboard
- token usage, total cost, quota usage, and cache rate (`cached / input`)
- frontend + backend served from one production image
- GitHub Actions publishes Docker images to GHCR

## Stack

- frontend: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- backend: Express + TypeScript
- package manager: pnpm
- deployment: GHCR image + Docker Compose

## Project structure

```text
.
├─ src/                      # React frontend
├─ server/                   # Express proxy backend
├─ .github/workflows/        # GHCR publish workflow
├─ Dockerfile                # production multi-stage image
├─ pnpm-workspace.yaml
└─ .env.example              # backend runtime env example
```

## Environment variables

Create a local `.env` file in the project root for the backend server.

```env
AXONHUB_URL=https://your-axonhub-instance.example.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password
PORT=3001
```

### Notes

- `AXONHUB_URL` must point to the AxonHub server reachable by the proxy backend.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` are used only by the backend proxy.
- The frontend never stores or submits admin credentials.

## Local development

Install dependencies:

```bash
pnpm install
```

Run the frontend dev server:

```bash
pnpm dev
```

Run the backend dev server:

```bash
pnpm dev:server
```

By default:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

Vite proxies `/api/*` to the backend in development.

## Build commands

Build frontend:

```bash
pnpm build
```

Build backend:

```bash
pnpm build:server
```

Build both:

```bash
pnpm build:all
```

Start the production backend locally after build:

```bash
pnpm start
```

Or build + start in one command:

```bash
pnpm start:prod
```

## Docker image

The production image is built from the root `Dockerfile`.

Build locally:

```bash
docker build -t axonhub-quota:local .
```

Run locally:

```bash
docker run --rm -p 3001:3001 \
  -e AXONHUB_URL=https://your-axonhub-instance.example.com \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=your-admin-password \
  axonhub-quota:local
```

The container serves both:

- API: `/api/health`, `/api/metrics`
- frontend app: `/`

## GitHub Actions / GHCR

Workflow file:

- `.github/workflows/publish-image.yml`

On push to `master`, GitHub Actions publishes:

- `ghcr.io/ai-trash/axonhub-quota:latest`
- `ghcr.io/ai-trash/axonhub-quota:sha-<commit>`

## VPS deployment

The current production deployment uses Docker Compose with the GHCR image directly.

Example service shape:

```yaml
quota:
  image: ghcr.io/ai-trash/axonhub-quota:latest
  restart: unless-stopped
  init: true
  depends_on:
    - axonhub
  environment:
    TZ: Asia/Shanghai
    NODE_ENV: production
    AXONHUB_URL: http://axonhub:8090
    ADMIN_EMAIL: ${AXONHUB_ADMIN_EMAIL}
    ADMIN_PASSWORD: ${AXONHUB_ADMIN_PASSWORD}
    PORT: 3001
  expose:
    - "3001"
```

Update production after a new image is published:

```bash
docker compose pull quota
docker compose up -d quota
```

## Health checks

Backend health endpoint:

```text
GET /api/health
```

Expected response:

```json
{"status":"ok"}
```

## License

This project is licensed under the GNU Affero General Public License v3.0. See `LICENSE`.
