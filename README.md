# Picturebed

A self-hosted image hosting tool — upload images to your own backends, get links, manage everything in one place.

![screenshot](https://img.shields.io/badge/stack-Vue%203%20%2B%20Vite%20%2B%20Tailwind-blue)

## Features

- **14 backends** — GitHub, Gitee, AliOSS, Tencent COS, Qiniu, MinIO, S3, Cloudflare R2, Upyun, Telegram, WeChat MP, Cloudinary, custom scripts, and more
- **Upload** — Drag & drop, paste from clipboard, or click to browse
- **Format links** — One-click copy URL / Markdown / HTML / BBCode
- **History** — Thumbnail grid with search, batch select, detail drawer
- **Backend delete** — Delete from storage when removing records
- **Stats** — Upload counts, storage usage, per-backend breakdown, daily trends
- **Dark theme** — Designed for comfortable use at any hour

## Quick Start

```bash
# Install dependencies
npm install

# Start Go proxy (required for Gitee)
cd server && go run main.go &

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

## Backend Configuration

Navigate to **Settings** and configure your image hosting backends:

| Backend | What you need |
|---------|--------------|
| GitHub | Personal access token + repo address |
| Gitee | Access token + repo address (+ Go proxy) |
| AliOSS | AccessKey + Secret + Bucket + Region |
| Tencent COS | SecretId + SecretKey + Bucket + Region |
| Qiniu | AccessKey + SecretKey + Bucket + Domain |
| MinIO | Endpoint + AccessKey + SecretKey + Bucket |
| S3 | Endpoint + AccessKey + SecretKey + Bucket + Region |
| Cloudflare R2 | Account ID + AccessKey + SecretKey + Bucket + Domain |
| Upyun | Bucket + Operator + Password + Domain |
| Telegram | Bot Token + Chat ID |
| WeChat MP | AppID + AppSecret |
| Cloudinary | Cloud Name + API Key + Secret |
| Custom | Your own JavaScript upload script |

## Go Proxy

The Go proxy (`server/main.go`) handles:

- `POST /api/upload/gitee` — Gitee upload proxy (bypasses CORS)
- `POST /api/delete/gitee` — Gitee delete proxy
- `GET /api/image/?url=` — Image hotlink proxy
- `GET /api/proxy/?url=` — Generic HTTP proxy

The dev server proxies `/api/*` to `localhost:8080`. In production, configure your reverse proxy accordingly.

## Build

```bash
npm run build
```

Output in `dist/` — deploy as static files.

## Tech Stack

- Vue 3 (Composition API + `<script setup>`)
- Vite 6
- Tailwind CSS 4
- Pinia (state management)
- Vue Router
- IndexedDB (via idb)
- Chart.js (statistics)
- AWS S3 SDK (S3-compatible backends)
- Go (Gitee proxy)

## License

MIT
