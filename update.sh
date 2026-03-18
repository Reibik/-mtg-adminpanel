#!/bin/bash
cd /tmp

# ============================================================
#  ST VILLAGE PROXY — Quick Update Script
#  Обновление кода и пересборка контейнера (без потери данных)
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

INSTALL_DIR="/opt/mtg-adminpanel"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}  ✗ Запусти от root: sudo bash update.sh${NC}"
    exit 1
fi

if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${RED}  ✗ Не найдена установка в $INSTALL_DIR${NC}"
    echo -e "${DIM}  Используйте deploy.sh для первичной установки${NC}"
    exit 1
fi

echo ""
echo -e "  ${BOLD}⚡ ST VILLAGE PROXY — Обновление${NC}"
echo -e "  ${DIM}──────────────────────────────────────────────────${NC}"
echo ""

# Pull code
if [ -d "$INSTALL_DIR/.git" ]; then
    echo -ne "  ${CYAN}▶${NC} Получение обновлений из git..."
    cd "$INSTALL_DIR"
    git pull --ff-only 2>&1 | tail -3
    echo -e "  ${GREEN}✓${NC} Код обновлён"
else
    echo -e "  ${YELLOW}!${NC} Не git-репозиторий — пропуск git pull"
fi

# Rebuild
echo -e "  ${CYAN}▶${NC} Пересборка контейнера..."
cd "$INSTALL_DIR"
docker compose down 2>/dev/null
docker compose up -d --build 2>&1 | tail -5

sleep 5

if docker ps --format '{{.Names}}' | grep -q mtg-panel; then
    VERSION=$(docker exec mtg-panel node -e "console.log(require('./package.json').version)" 2>/dev/null || echo "?")
    echo ""
    echo -e "  ${GREEN}✓ Обновлено до v${VERSION}${NC}"
    echo -e "  ${DIM}$(docker ps --filter name=mtg-panel --format 'Status: {{.Status}}')${NC}"
else
    echo ""
    echo -e "  ${RED}✗ Контейнер не запустился!${NC}"
    echo -e "  ${DIM}docker logs mtg-panel --tail 20${NC}"
    exit 1
fi
echo ""
