#!/bin/sh
set -e
cd "$(dirname "$0")/server"
/tmp/go/bin/go mod init picturebed-proxy 2>/dev/null || true
CGO_ENABLED=0 /tmp/go/bin/go build -o proxy main.go
echo "Built server/proxy ($(du -h proxy | cut -f1))"
