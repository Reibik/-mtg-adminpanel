#!/bin/bash
# ============================================================
#  ST VILLAGE PROXY — Restore from Backup
#  Восстановление панели из бекапа на новом/текущем VPS
#
#  Использование:
#    bash restore.sh /path/to/backup_2024-01-15T12-00-00.tar.gz
# ============================================================

set -e

INSTALL_DIR="/opt/mtg-adminpanel"
BACKUP_FILE="$1"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}  ✗ Запусти от root: sudo bash restore.sh <backup.tar.gz>${NC}"
    exit 1
fi

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}  ✗ Укажи путь к бекапу:${NC}"
    echo "    sudo bash restore.sh /path/to/backup.tar.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}  ✗ Файл не найден: $BACKUP_FILE${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}  ║    ST VILLAGE — Restore from Backup  ║${NC}"
echo -e "${CYAN}  ╚══════════════════════════════════════╝${NC}"
echo ""

# Create temp dir for extraction
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

echo -e "${CYAN}  ▶${NC} Распаковка бекапа..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Validate backup
if [ ! -f "$TEMP_DIR/backup-meta.json" ]; then
    echo -e "${RED}  ✗ Невалидный бекап: отсутствует backup-meta.json${NC}"
    exit 1
fi

if [ ! -f "$TEMP_DIR/data/mtg-panel.db" ]; then
    echo -e "${RED}  ✗ Невалидный бекап: отсутствует data/mtg-panel.db${NC}"
    exit 1
fi

# Show backup info
echo -e "${GREEN}  ✓ Бекап валиден${NC}"
if command -v python3 &>/dev/null; then
    echo -e "${CYAN}  ℹ${NC} Информация о бекапе:"
    python3 -c "
import json
with open('$TEMP_DIR/backup-meta.json') as f:
    m = json.load(f)
print(f\"    Версия:  {m.get('version','?')}\")
print(f\"    Коммит:  {m.get('commit','?')}\")
print(f\"    Создан:  {m.get('created','?')}\")
print(f\"    Хост:    {m.get('hostname','?')}\")
" 2>/dev/null || true
fi

echo ""

# Check if panel is installed
if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}  ⚠ Панель не установлена. Сначала установим...${NC}"
    echo ""

    # Install panel first
    apt-get update -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" > /dev/null 2>&1
    apt-get install -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" git curl docker.io docker-compose-plugin > /dev/null 2>&1

    git clone -q https://github.com/Reibik/mtg-adminpanel.git "$INSTALL_DIR" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Репозиторий клонирован${NC}"
fi

cd "$INSTALL_DIR"

# Stop panel if running
echo -e "${CYAN}  ▶${NC} Остановка панели..."
docker compose down 2>/dev/null || true

# Restore .env
if [ -f "$TEMP_DIR/.env" ]; then
    echo -e "${CYAN}  ▶${NC} Восстановление .env..."
    cp "$TEMP_DIR/.env" "$INSTALL_DIR/.env"
    echo -e "${GREEN}  ✓ .env восстановлен${NC}"
else
    echo -e "${YELLOW}  ⚠ .env не найден в бекапе${NC}"
fi

# Restore database
echo -e "${CYAN}  ▶${NC} Восстановление базы данных..."
mkdir -p "$INSTALL_DIR/data"
cp "$TEMP_DIR/data/mtg-panel.db" "$INSTALL_DIR/data/mtg-panel.db"
echo -e "${GREEN}  ✓ База данных восстановлена${NC}"

# Restore SSH keys
if [ -d "$TEMP_DIR/ssh_keys" ] && [ "$(ls -A "$TEMP_DIR/ssh_keys" 2>/dev/null)" ]; then
    echo -e "${CYAN}  ▶${NC} Восстановление SSH ключей..."
    mkdir -p "$INSTALL_DIR/ssh_keys"
    cp "$TEMP_DIR/ssh_keys/"* "$INSTALL_DIR/ssh_keys/" 2>/dev/null || true
    chmod 600 "$INSTALL_DIR/ssh_keys/"* 2>/dev/null || true
    echo -e "${GREEN}  ✓ SSH ключи восстановлены${NC}"
else
    echo -e "${CYAN}  ℹ${NC} SSH ключи отсутствуют в бекапе"
fi

# Start panel
echo -e "${CYAN}  ▶${NC} Запуск панели..."
docker compose up -d --build

echo ""
echo -e "${GREEN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║     ✓ Восстановление завершено!      ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════╝${NC}"
echo ""

# Get port from .env
PORT=$(grep -E "^PORT=" "$INSTALL_DIR/.env" 2>/dev/null | cut -d= -f2 || echo "3000")
DOMAIN=$(grep -E "^DOMAIN=" "$INSTALL_DIR/.env" 2>/dev/null | cut -d= -f2 || echo "")

echo -e "${CYAN}  ℹ${NC} Панель запущена на порту ${PORT:-3000}"
if [ -n "$DOMAIN" ]; then
    echo -e "${CYAN}  ℹ${NC} Домен: $DOMAIN"
    echo -e "${YELLOW}  ⚠ Не забудьте обновить DNS записи для $DOMAIN на IP нового сервера${NC}"
fi
echo ""
echo -e "${YELLOW}  ⚠ Важно после миграции:${NC}"
echo "    1. Обновите DNS записи домена на новый IP"
echo "    2. Проверьте подключение к нодам (SSH ключи)"
echo "    3. Проверьте настройки SMTP"
echo ""
