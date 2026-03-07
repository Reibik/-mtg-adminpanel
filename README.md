# 🔒 MTG Panel — FreeNet Proxy Manager

Веб-панель для управления MTProto прокси (mtg v2) на нескольких серверах через SSH.

![Stack](https://img.shields.io/badge/Node.js-20-green) ![Docker](https://img.shields.io/badge/Docker-Compose-blue) ![SQLite](https://img.shields.io/badge/DB-SQLite-lightgrey)

## Возможности

- 🖥️ Управление несколькими нодами из одного интерфейса
- ➕ Добавление / удаление нод через веб (SSH пароль или ключ)
- 👥 Создание юзеров — каждый получает уникальную ссылку `tg://proxy`
- ⏸️ Остановка / запуск отдельных юзеров
- 📊 Дашборд с live-статусом всех нод
- 🔗 Копирование ссылки одним кликом

## Стек

- **Backend**: Node.js + Express + SSH2 + SQLite (better-sqlite3)
- **Frontend**: React SPA (CDN, без сборки)
- **Deploy**: Docker Compose

## Быстрый старт

### 1. Клонируй репозиторий

```bash
git clone https://github.com/<ТВОЙ_ЮЗЕР>/mtg-panel.git
cd mtg-panel
```

### 2. Создай .env

```bash
cp .env.example .env
nano .env
```

Заполни:
```
AUTH_TOKEN=твой-секретный-токен
```

### 3. Создай SSH ключ для подключения к нодам

```bash
mkdir -p ssh_keys
ssh-keygen -t ed25519 -f ssh_keys/panel_key -N ""
cat ssh_keys/panel_key
```

Скопируй содержимое — вставишь в панели при добавлении ноды.

### 4. Запусти

```bash
docker compose up -d --build
docker logs mtg-panel -f
```

Панель доступна на: http://localhost:3000

---

## Настройка с Nginx Proxy Manager (SSL)

| Поле | Значение |
|------|----------|
| Domain | proxy.yourdomain.com |
| Forward Host | IP сервера |
| Forward Port | 3000 |
| SSL | Let's Encrypt |
| Force SSL | да |

---

## Структура проекта

```
mtg-panel/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── db.js
│       └── ssh.js
├── public/
│   └── index.html
├── data/          # в .gitignore
└── ssh_keys/      # в .gitignore — НИКОГДА не коммитить!
```

---

## API

Все запросы требуют заголовок: `x-auth-token: <AUTH_TOKEN>`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/nodes | Список нод |
| POST | /api/nodes | Добавить ноду |
| PUT | /api/nodes/:id | Редактировать ноду |
| DELETE | /api/nodes/:id | Удалить ноду |
| GET | /api/nodes/:id/check | Ping ноды |
| GET | /api/nodes/:id/users | Список юзеров |
| POST | /api/nodes/:id/users | Добавить юзера |
| DELETE | /api/nodes/:id/users/:name | Удалить юзера |
| POST | /api/nodes/:id/users/:name/stop | Остановить |
| POST | /api/nodes/:id/users/:name/start | Запустить |
| GET | /api/status | Статус всех нод |

---

## Лицензия

MIT
