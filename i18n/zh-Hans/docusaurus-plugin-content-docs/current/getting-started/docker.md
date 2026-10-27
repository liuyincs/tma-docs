---
title: "Docker 部署"
sidebar_position: 2
---

Tag My Audio 以单镜像公开在 Docker Hub 发布：[`gitbobobo/tma`](https://hub.docker.com/r/gitbobobo/tma)。镜像内包含 Rust 服务端、构建好的 Web 客户端和 `ffmpeg`，同时提供 `linux/amd64` 与 `linux/arm64` 两种架构。

一个容器即可提供全部能力：Web UI、API 与媒体取流。服务端把 SQLite 数据库、缓存、插件和自动生成的密钥存放在 `/data`，音频文件通过另一个挂载目录访问。

## 前置条件

- Docker Engine 或 Docker Desktop。推荐 Docker Compose v2，但不是必需。
- 宿主机上一个用于 `/data` 的目录，例如 `/srv/tma/data`。
- 存放音乐的目录，以读写方式挂载：改标签、重命名和移动都会直接写入文件。
- `38080` 端口可达，直连或经反向代理均可。
- 一张邀请凭证用于激活实例，见[测试资格](beta.md)。

## 快速开始

```bash
docker run -d \
  --name tma \
  --restart unless-stopped \
  -p 38080:38080 \
  -v /srv/tma/data:/data \
  -v /srv/music:/music \
  gitbobobo/tma:latest
```

然后打开 `http://<主机>:38080` 并检查健康状态：

```bash
curl http://<主机>:38080/health
# {"status":"ok"}
```

可用的镜像标签：

- `latest`：最新发布版本。
- `vX.Y.Z`，例如 `v0.1.45`：固定版本。生产环境建议固定标签，避免一次 `docker pull` 意外升级。
- 两种标签都指向多架构 manifest，Docker 会自动拉取匹配的架构。

## Docker Compose

```yaml
services:
  tma:
    image: gitbobobo/tma:v0.1.45
    container_name: tma
    restart: unless-stopped
    # 必须大于 TMA_SHUTDOWN_TIMEOUT_SECS（默认 60 秒）。
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

### 关机时序与 `stop_grace_period`

收到 `SIGTERM` 后服务端进入 draining：停止接受新任务、取消受跟踪任务、排空 finalizer 并关闭数据库连接池，然后退出。默认预算为 60 秒（`TMA_SHUTDOWN_TIMEOUT_SECS`）。

容器停止宽限必须不小于该预算并留出余量，所以示例里写 `65s`。如果调大了 `TMA_SHUTDOWN_TIMEOUT_SECS`，`stop_grace_period` 也要同步调大。宽限不足时 Docker 会发 `SIGKILL`；留下的 interrupted 任务会在下次启动时恢复，但这条路径应保持为例外。

## 首次使用

1. 打开 `http://<主机>:38080`。未激活的实例仍会正常提供页面，但注册和登录会被拒绝。进入 `/activate` 填入邀请凭证。
2. 注册第一个账号。首个账号会获得管理员角色。
3. 之后默认关闭注册。以管理员登录后，可在管理后台创建用户，或在通用设置里开启注册。
4. 在管理后台新建资料库，根路径填音乐挂载在容器内的路径，例如 `/music`，然后执行扫描建立索引。

这里要填容器内路径（`/music`），不是宿主机路径。宿主机路径在容器内不可见。

## 数据与持久化

服务端需要保留的内容都在 `/data` 下：

| 路径 | 内容 |
| --- | --- |
| `/data/tma.db` | SQLite 数据库：用户、资料库索引、曲库投影、任务 |
| `/data/plugins/` | 已安装插件 |
| `/data/cache/` | 转码与图片缓存；停机后可安全删除 |
| `/data/assets/images/original` | 原图持久目录（封面、艺术家图片） |
| `/data/.creation_master_key` | 自动生成的主密钥，用于加密已保存的凭据 |

备份时先停止容器，或对卷做快照。`.creation_master_key` 丢失后，已保存的刮削与 AI 凭据将无法解密，需要重新填写；删除缓存则没有影响。

## 配置

镜像已内置 `DATABASE_URL=sqlite:/data/tma.db?mode=rwc` 和 `TMA_WEB_DIST_DIR=/app/web`。常改的变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `TMA_PORT` | `38080` | 容器内 HTTP 端口；改了要同步调整端口映射。 |
| `TMA_BIND_ADDR` | `0.0.0.0` | 容器内监听地址。 |
| `DATABASE_URL` | `sqlite:/data/tma.db?mode=rwc` | 数据库请保持在 `/data` 下。 |
| `TMA_SHUTDOWN_TIMEOUT_SECS` | `60` | 硬关机时限；`stop_grace_period` 必须高于它。 |
| `TMA_TRUSTED_PROXIES` | 空 | 可信反向代理地址，仅对这些来源采信 `X-Forwarded-For` / `X-Forwarded-Proto`。见下文。 |
| `TMA_USAGE_STATS` | 开启 | 设为 `false` 关闭匿名使用统计。 |
| `TMA_CACHE_DIR` | `/data/cache` | 转码缓存目录。 |
| `TMA_LOG_LEVEL` | `info` | 首次启动的默认级别，之后以数据库中的设置为准。 |

完整列表（含转码、图片缓存、刮削相关变量）见[项目 README](https://github.com/liuyincs/tma/blob/main/README.md#环境变量)。

## 升级

1. 备份 `/data`。
2. 修改镜像标签，然后拉取并重建：

```bash
docker compose pull
docker compose up -d
```

使用 `docker run` 时，先停止并删除容器，再用新标签重新运行。状态都保留在 `/data` 卷里。

数据库迁移在启动时自动执行。不要让两个容器同时使用同一个 `/data` 目录。

## 反向代理与 HTTPS

容器本身只提供 HTTP。请在外层反向代理终止 TLS，并让 `38080` 保持私有；同机代理可以用 `-p 127.0.0.1:38080:38080` 只监听回环地址。

反向代理位于 TMA 前方时：

- 必须转发 WebSocket 升级（`Upgrade` 与 `Connection` 头）。实时通道是一条长连接 WebSocket。
- 不要改写 `Host`，或确保改写后的 authority 与浏览器 `Origin` 一致。服务端的 Origin 校验会比较两者。
- `X-Forwarded-For` 由代理追加真实客户端地址，`X-Forwarded-Proto` 按代理收到的那一跳的协议设置。原样透传客户端自带的头，等于让客户端伪造自己的限流分桶。
- `TMA_TRUSTED_PROXIES` 只填反向代理自身的精确地址（`/32` 或 `/128`）。不配置时所有匿名访客共用代理出口的限流与密码锁定桶；配置成 `10.0.0.0/8` 这类宽网段，则网内任何主机都能伪造转发头。

nginx 示例：

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

nginx 与 TMA 同机时，`TMA_TRUSTED_PROXIES=127.0.0.1` 才能匹配。代理运行在另一个容器时，改填该容器在 Docker 网络中的地址。

## 健康检查与运维

| 端点 | 用途 |
| --- | --- |
| `GET /health` | 存活探针：进程在即 `200`。 |
| `GET /ready` | 就绪探针：draining 期间返回 `503`，负载均衡据此摘流。 |

`GET /api/v1/admin/realtime/metrics`（管理员）提供实时通道的连接计数。关机与 critical 故障时的日志行为见项目的[部署与运行手册](https://github.com/liuyincs/tma/blob/main/docs/deployment.md)。

## 注意事项

- 容器默认以 root 运行，因此音乐挂载里的文件可写，除非挂载本身是只读的。SMB / NFS 若启用了 root squash，改标签仍可能失败；请确认容器内对挂载文件有写权限。
- 部分宿主机和网络挂载不会把文件系统事件送进容器。TMA 在能收到事件时做防抖，同时每 30 分钟兜底重扫，因此没有通知时变更最终也会被发现。
- 文件及其内嵌标签始终是最终依据。数据库可以重建，音乐文件不行。
