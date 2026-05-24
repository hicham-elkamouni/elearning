# Docker Setup (Development)

## File placement

```
backend_lus/
├── backend/
│   ├── src/
│   ├── .env                        # dev env vars (you create this)
│   └── .dockerignore
├── frontend/
│   ├── app/
│   ├── .env.local                  # dev env vars (you create this)
│   └── .dockerignore
├── docker/
│   ├── backend.Dockerfile          # node:20-alpine, target: development
│   ├── frontend.Dockerfile         # node:20-alpine, target: development
│   └── mysql/
│       └── init.sql                # creates DB with utf8mb4_unicode_ci charset
├── docker-compose.dev.yml
├── .env.example
└── DOCKER.md
```

---

## Architecture

```
Browser
  │
  ├── localhost:3000  →  frontend (Next.js)
  └── localhost:3001  →  backend (NestJS)
                              │
                          localhost:3306
                              │
                           db (MySQL 8.0)

All 3 containers talk to each other via: elearning_network
DB is reachable from your machine on port 3306 (TablePlus, DBeaver, etc.)
```

- Containers communicate by **service name** (`db`, `backend`, `frontend`)
- The **browser** always calls `localhost` — never internal container names
- MySQL data persists in a named Docker volume (`mysql_data`) — survives restarts
- Uploaded files persist in `backend_uploads` volume
- The frontend `.next` build cache is kept in an anonymous volume so local builds don't conflict with the container

---

## Env files to create manually

### `backend/.env`

```env
DB_HOST=db
DB_PORT=3306
DB_ROOT_PASSWORD=rootpassword
DB_NAME=elearning
DB_USERNAME=elearning_user
DB_PASSWORD=elearning_pass
JWT_SECRET=your_dev_secret_change_this
JWT_EXPIRES_IN=7d
PORT=3001
UPLOAD_DEST=./uploads
```

> `DB_HOST` is force-overridden to `db` by the compose file regardless of what you put here — but keeping `db` is clearest.

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Commands

### Start everything

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Start in background

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### Stop everything

```bash
docker compose -f docker-compose.dev.yml down
```

### Stop and wipe the database

```bash
docker compose -f docker-compose.dev.yml down -v
```

### View all logs

```bash
docker compose -f docker-compose.dev.yml logs -f
```

### View logs for one service

```bash
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f db
```

### Rebuild one service after adding a dependency

```bash
docker compose -f docker-compose.dev.yml up --build backend
```

---

## Useful debugging commands

```bash
# Open a shell inside the backend container
docker exec -it elearning_backend sh

# Open a shell inside the frontend container
docker exec -it elearning_frontend sh

# Open MySQL CLI inside the db container
docker exec -it elearning_db mysql -u elearning_user -pelearning_pass elearning

# Check all running containers and their status
docker ps

# Check container health
docker inspect --format='{{json .State.Health}}' elearning_db
```

---

## Hot reload

| Service  | How it works |
|----------|-------------|
| Backend  | `npm run start:dev` — NestJS watches for file changes |
| Frontend | `npm run dev` — Next.js fast refresh — `WATCHPACK_POLLING=true` fixes watch issues on Windows/WSL2 |

Save any file → the relevant container reloads automatically. No need to restart Docker.

---

## Common issues

| Issue | Fix |
|-------|-----|
| Backend can't connect to DB | `DB_HOST` is auto-set to `db` by compose — check `DB_USERNAME`/`DB_PASSWORD` match the compose values |
| Hot reload not triggering on Windows | `WATCHPACK_POLLING=true` is set in both the Dockerfile and compose file |
| Port 3306/3000/3001 already in use | Stop local MySQL/Node processes then retry |
| MySQL volume has stale data after schema change | Run `docker compose -f docker-compose.dev.yml down -v` then `up --build` |
| `node_modules` errors inside container | Delete local `node_modules` folder, rebuild with `--build` |
| DB healthy but backend still fails to connect | Wait 5–10s — the healthcheck passes before MySQL is fully ready sometimes |
| Frontend `.next` cache conflicts with local build | The compose mounts `.next` as an anonymous volume — run `docker compose down` then `up --build` |
