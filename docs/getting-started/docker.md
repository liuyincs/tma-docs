---
title: "Docker deployment"
sidebar_position: 2
---

Tag My Audio is published as a single public image on Docker Hub: [`gitbobobo/tma`](https://hub.docker.com/r/gitbobobo/tma). The image contains the Rust server, the built web client and `ffmpeg`, and is published for both `linux/amd64` and `linux/arm64`.

One container serves everything: the web UI, the API and media streaming. The server keeps its SQLite database, caches, plugins and generated keys under `/data`, and accesses your audio files through a separate mount.

## Requirements

- Docker Engine or Docker Desktop. Docker Compose v2 is recommended but optional.
- A host directory for `/data`, for example `/srv/tma/data`.
- The directory that holds your music. Mount it read-write: tag editing, renaming and moving write to the files.
- Port `38080` reachable, either directly or through a reverse proxy.
- A beta invitation credential to activate the instance. See [Beta access](beta.md).

## Quick start

```bash
docker run -d \
  --name tma \
  --restart unless-stopped \
  -p 38080:38080 \
  -v /srv/tma/data:/data \
  -v /srv/music:/music \
  gitbobobo/tma:latest
```

Then open `http://<host>:38080` and check health:

```bash
curl http://<host>:38080/health
# {"status":"ok"}
```

Available tags:

- `latest`: the newest release.
- `vX.Y.Z`, for example `v0.1.45`: a pinned release. Use a pinned tag in production so a `docker pull` does not change versions unexpectedly.
- Both tags point to a multi-arch manifest; Docker pulls the matching architecture automatically.

## Docker Compose

```yaml
services:
  tma:
    image: gitbobobo/tma:v0.1.45
    container_name: tma
    restart: unless-stopped
    # Must be greater than TMA_SHUTDOWN_TIMEOUT_SECS (default 60s).
    stop_grace_period: 65s
    ports:
      - "38080:38080"
    volumes:
      - ./data:/data
      - /srv/music:/music
    # environment:
    #   TMA_TRUSTED_PROXIES: 172.18.0.2
```

```bash
docker compose up -d
```

### Shutdown and `stop_grace_period`

On `SIGTERM` the server drains: it stops accepting new work, cancels tracked tasks, flushes finalizers and closes the database pool before exiting. The default budget is 60 seconds (`TMA_SHUTDOWN_TIMEOUT_SECS`).

The container stop grace period must be at least that budget plus a margin, which is why the example uses `65s`. If you raise `TMA_SHUTDOWN_TIMEOUT_SECS`, raise `stop_grace_period` too. Without enough grace, Docker sends `SIGKILL`; interrupted tasks are recovered on the next start, but that path should stay exceptional.

## First run

1. Open `http://<host>:38080`. An unactivated instance still serves pages, but registration and sign-in are refused. Go to `/activate` and enter your invitation credential.
2. Register the first account. The first account receives the admin role.
3. Registration of further accounts is closed by default. After signing in as the admin, either create users in the admin area or enable registration in the general settings.
4. Create a library under the admin area and point it at the container path of your music mount, for example `/music`. Run a scan to index files.

Use the container path (`/music`), not the host path. Host paths are not visible inside the container.

## Data and persistence

Everything the server needs to keep is under `/data`:

| Path | Content |
| --- | --- |
| `/data/tma.db` | SQLite database: users, library index, catalog projections, tasks |
| `/data/plugins/` | Installed plugins |
| `/data/cache/` | Transcode and image caches; safe to delete while stopped |
| `/data/assets/images/original` | Persistent original cover and artist images |
| `/data/.creation_master_key` | Generated master key for encrypted stored credentials |

Back up `/data` with the container stopped, or snapshot the volume. Losing `.creation_master_key` makes stored scraping and AI credentials unreadable; they must be entered again. Deleting the caches is harmless.

## Configuration

The image already sets `DATABASE_URL=sqlite:/data/tma.db?mode=rwc` and `TMA_WEB_DIST_DIR=/app/web`. The commonly changed variables:

| Variable | Default | Notes |
| --- | --- | --- |
| `TMA_PORT` | `38080` | HTTP port inside the container. Adjust the port mapping to match. |
| `TMA_BIND_ADDR` | `0.0.0.0` | Listen address inside the container. |
| `DATABASE_URL` | `sqlite:/data/tma.db?mode=rwc` | Keep the database under `/data`. |
| `TMA_SHUTDOWN_TIMEOUT_SECS` | `60` | Hard shutdown budget. Keep `stop_grace_period` above it. |
| `TMA_TRUSTED_PROXIES` | empty | Reverse proxy addresses whose `X-Forwarded-For` / `X-Forwarded-Proto` are trusted. See below. |
| `TMA_USAGE_STATS` | enabled | Set to `false` to disable anonymous usage statistics. |
| `TMA_CACHE_DIR` | `/data/cache` | Transcode cache. |
| `TMA_LOG_LEVEL` | `info` | First-start default; afterwards the level is stored in the database. |

The full list, including transcode, image cache and scraping variables, is in the [project README](https://github.com/liuyincs/tma/blob/main/README.md#环境变量).

## Upgrades

1. Back up `/data`.
2. Change the image tag, then pull and recreate:

```bash
docker compose pull
docker compose up -d
```

For plain `docker run`, stop and remove the container, then run it again with the new tag. The `/data` volume keeps your state.

Database migrations run automatically at startup. Never run two containers against the same `/data` directory at the same time.

## Reverse proxy and HTTPS

The container speaks plain HTTP. Terminate TLS at a reverse proxy and keep `38080` private; for a same-host proxy you can publish the port only on loopback with `-p 127.0.0.1:38080:38080`.

When a reverse proxy is in front of TMA:

- Forward the WebSocket upgrade (`Upgrade` and `Connection` headers). The realtime channel is a long-lived WebSocket.
- Do not rewrite `Host`, or make sure the rewritten authority matches the browser `Origin`. Origin validation compares the two.
- Set `X-Forwarded-For` by appending the real client address, and set `X-Forwarded-Proto` from the scheme the proxy received. Pass-through of client-supplied values lets clients forge their own rate-limit bucket.
- Set `TMA_TRUSTED_PROXIES` to the exact address of the proxy itself (`/32` or `/128`). Without it every anonymous visitor shares the proxy's rate-limit and password-lockout bucket; with an over-broad range such as `10.0.0.0/8` any host in that network can forge forwarding headers.

Example nginx server block:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 443 ssl;
    server_name tma.example.com;

    location / {
        proxy_pass http://127.0.0.1:38080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

With nginx on the same host, `TMA_TRUSTED_PROXIES=127.0.0.1` matches. If the proxy runs in another container, use that container's address on the Docker network instead.

## Health and operations

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Liveness: `200` while the process runs. |
| `GET /ready` | Readiness: `503` while draining, use it to remove the instance from a load balancer. |

`GET /api/v1/admin/realtime/metrics` (admin) exposes realtime connection counters. What the server logs on shutdown and on critical failures is described in the project's [deployment manual](https://github.com/liuyincs/tma/blob/main/docs/deployment.md).

## Notes

- The container runs as root by default, so files under the music mount are writable unless the mount itself is read-only. On SMB or NFS mounts with root squash, tag writes can still fail; make sure the mounted files are writable from inside the container.
- Some hosts and network mounts do not deliver filesystem events into the container. TMA debounces events when available and also re-scans on a 30-minute interval, so changes eventually appear even without notifications.
- Files and their embedded tags remain the source of truth. The database can be rebuilt; the music library cannot.
