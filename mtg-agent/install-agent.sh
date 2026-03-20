#!/bin/bash
# MTG Agent v2.0 installer / updater
# Usage: bash install-agent.sh [AGENT_TOKEN]
set -e

TOKEN="${1:-mtg-agent-secret}"
INSTALL_DIR="/opt/mtg-agent"
RAW="https://raw.githubusercontent.com/Reibik/mtg-adminpanel/main/mtg-agent"

echo "==> MTG Agent v2.0 install/update..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "==> Downloading agent files..."
curl -fsSL "$RAW/main.py"            -o main.py
curl -fsSL "$RAW/docker-compose.yml" -o docker-compose.yml

echo "AGENT_TOKEN=${TOKEN}" > .env

echo "==> Stopping old agent..."
docker compose down 2>/dev/null || true

echo "==> Starting agent..."
docker compose up -d

echo ""
echo "==> ✅ MTG Agent v2.0 installed!"
echo "==> Agent will be ready in ~30s (installing dependencies)"
echo ""
echo "==> Endpoints:"
echo "    Health:  curl -s http://localhost:8081/health"
echo "    Metrics: curl -s -H 'x-agent-token: ${TOKEN}' http://localhost:8081/metrics"
echo "    System:  curl -s -H 'x-agent-token: ${TOKEN}' http://localhost:8081/system"
echo ""
echo "==> Check status: docker logs -f mtg-agent"
