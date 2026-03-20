"""
MTG Agent v2.0 — HTTP агент для нод MTG Proxy.
Собирает метрики контейнеров, системы, управляет контейнерами.

Endpoints:
  GET  /version              — версия агента
  GET  /health               — health check + docker status
  GET  /metrics              — метрики всех MTG контейнеров + система
  GET  /system               — только системные метрики (CPU, RAM, disk)
  POST /containers/{name}/restart  — перезапуск контейнера
  POST /containers/{name}/stop     — остановка
  POST /containers/{name}/start    — запуск
  GET  /containers/{name}/logs     — последние логи контейнера
"""
import os
import time
import asyncio
import platform
from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.responses import JSONResponse
import docker

app = FastAPI(title="MTG Agent", version="2.0.0")

AGENT_TOKEN = os.environ.get("AGENT_TOKEN", "mtg-agent-secret")
CACHE_TTL = int(os.environ.get("CACHE_TTL", "15"))  # seconds

client = docker.from_env()

# ── Metric cache ───────────────────────────────────────────
_cache = {"metrics": None, "system": None, "ts": 0}
_boot_time = time.time()


def auth(token: str):
    if token != AGENT_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── System metrics ─────────────────────────────────────────
def get_system_metrics() -> dict:
    return {
        "hostname": platform.node(),
        "uptime_seconds": int(time.time() - _get_boot_time()),
        "agent_uptime_seconds": int(time.time() - _boot_time),
        "cpu": _get_cpu(),
        "memory": _get_memory(),
        "disk": _get_disk(),
        "load_avg": _get_load_avg(),
    }


def _get_boot_time() -> float:
    try:
        with open("/proc/uptime") as f:
            return time.time() - float(f.read().split()[0])
    except Exception:
        return _boot_time


def _get_cpu() -> dict:
    try:
        with open("/proc/stat") as f:
            parts = f.readline().split()[1:]
        vals = list(map(int, parts))
        total = sum(vals)
        idle = vals[3] + (vals[4] if len(vals) > 4 else 0)
        return {"total": total, "idle": idle, "cores": os.cpu_count() or 1}
    except Exception:
        return {"total": 0, "idle": 0, "cores": os.cpu_count() or 1}


def _get_memory() -> dict:
    try:
        info = {}
        with open("/proc/meminfo") as f:
            for line in f:
                parts = line.split()
                key = parts[0].rstrip(":")
                if key in ("MemTotal", "MemAvailable", "MemFree", "Buffers", "Cached", "SwapTotal", "SwapFree"):
                    info[key] = int(parts[1]) * 1024  # kB → bytes
        total = info.get("MemTotal", 0)
        available = info.get("MemAvailable", info.get("MemFree", 0))
        used = total - available
        return {
            "total": total,
            "used": used,
            "available": available,
            "percent": round(used / total * 100, 1) if total else 0,
            "swap_total": info.get("SwapTotal", 0),
            "swap_used": info.get("SwapTotal", 0) - info.get("SwapFree", 0),
        }
    except Exception:
        return {"total": 0, "used": 0, "available": 0, "percent": 0}


def _get_disk() -> dict:
    try:
        st = os.statvfs("/")
        total = st.f_blocks * st.f_frsize
        free = st.f_bavail * st.f_frsize
        used = total - free
        return {
            "total": total,
            "used": used,
            "free": free,
            "percent": round(used / total * 100, 1) if total else 0,
        }
    except Exception:
        return {"total": 0, "used": 0, "free": 0, "percent": 0}


def _get_load_avg() -> list:
    try:
        with open("/proc/loadavg") as f:
            parts = f.read().split()
        return [float(parts[0]), float(parts[1]), float(parts[2])]
    except Exception:
        return [0, 0, 0]


# ── Container metrics ─────────────────────────────────────
def get_mtg_containers():
    try:
        return [c for c in client.containers.list(all=True)
                if c.name.startswith("mtg-") and c.name != "mtg-agent"]
    except Exception:
        return []


def get_connections(container) -> dict:
    """Returns connection count and unique IPs."""
    try:
        container.reload()
        pid = container.attrs.get("State", {}).get("Pid", 0)
        if not pid:
            return {"count": 0, "unique_ips": 0}

        MTG_PORT_HEX = "0C38"  # 3128

        lines = []
        for tcp_path in [f"/proc/{pid}/net/tcp6", f"/proc/{pid}/net/tcp"]:
            try:
                with open(tcp_path) as f:
                    lines.extend(f.readlines()[1:])
            except Exception:
                pass

        remote_ips = set()
        total_conns = 0
        for line in lines:
            parts = line.split()
            if len(parts) < 4:
                continue
            state = parts[3]
            local_port = parts[1].split(":")[1] if ":" in parts[1] else ""
            if state == "01" and local_port == MTG_PORT_HEX:
                total_conns += 1
                remote_ip = parts[2].rsplit(":", 1)[0] if ":" in parts[2] else parts[2]
                remote_ips.add(remote_ip)

        return {"count": total_conns, "unique_ips": len(remote_ips)}
    except Exception:
        return {"count": 0, "unique_ips": 0}


def get_traffic(container) -> dict:
    try:
        stats = container.stats(stream=False)
        nets = stats.get("networks", {})
        total_rx = sum(v.get("rx_bytes", 0) for v in nets.values())
        total_tx = sum(v.get("tx_bytes", 0) for v in nets.values())
        return {"rx_bytes": total_rx, "tx_bytes": total_tx, "rx": _fmt_bytes(total_rx), "tx": _fmt_bytes(total_tx)}
    except Exception:
        return {"rx": "0B", "tx": "0B", "rx_bytes": 0, "tx_bytes": 0}


def get_container_resources(container) -> dict:
    """Get CPU and memory usage of a container."""
    try:
        stats = container.stats(stream=False)
        # CPU
        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
        system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
        n_cpus = stats["cpu_stats"].get("online_cpus", len(stats["cpu_stats"]["cpu_usage"].get("percpu_usage", [1])))
        cpu_percent = round((cpu_delta / system_delta) * n_cpus * 100, 2) if system_delta > 0 else 0

        # Memory
        mem_usage = stats["memory_stats"].get("usage", 0)
        mem_limit = stats["memory_stats"].get("limit", 0)
        mem_percent = round(mem_usage / mem_limit * 100, 2) if mem_limit else 0

        return {"cpu_percent": cpu_percent, "mem_usage": mem_usage, "mem_limit": mem_limit, "mem_percent": mem_percent}
    except Exception:
        return {"cpu_percent": 0, "mem_usage": 0, "mem_limit": 0, "mem_percent": 0}


def get_container_uptime(container) -> int:
    """Get container uptime in seconds."""
    try:
        container.reload()
        started = container.attrs.get("State", {}).get("StartedAt", "")
        if not started or started.startswith("0001"):
            return 0
        from datetime import datetime, timezone
        started = started.split(".")[0] + "+00:00"
        start_dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
        return max(0, int((datetime.now(timezone.utc) - start_dt).total_seconds()))
    except Exception:
        return 0


def _fmt_bytes(b: int) -> str:
    if b >= 1_073_741_824:
        return f"{b / 1_073_741_824:.2f}GB"
    if b >= 1_048_576:
        return f"{b / 1_048_576:.2f}MB"
    if b >= 1024:
        return f"{b / 1024:.2f}KB"
    return f"{b}B"


def collect_all_metrics() -> dict:
    """Collect full metrics — cached for CACHE_TTL seconds."""
    now = time.time()
    if _cache["metrics"] and (now - _cache["ts"]) < CACHE_TTL:
        return _cache["metrics"]

    containers = get_mtg_containers()
    result = []

    for c in containers:
        running = c.status == "running"
        conn = get_connections(c) if running else {"count": 0, "unique_ips": 0}

        if running:
            traffic = get_traffic(c)
            resources = get_container_resources(c)
        else:
            traffic = {"rx": "0B", "tx": "0B", "rx_bytes": 0, "tx_bytes": 0}
            resources = {"cpu_percent": 0, "mem_usage": 0, "mem_limit": 0, "mem_percent": 0}

        result.append({
            "name": c.name,
            "running": running,
            "status": c.status,
            "connections": conn["unique_ips"],
            "total_connections": conn["count"],
            "devices": conn["unique_ips"],
            "is_online": conn["unique_ips"] > 0,
            "traffic": traffic,
            "resources": resources,
            "uptime": get_container_uptime(c) if running else 0,
        })

    system = get_system_metrics()
    data = {
        "containers": result,
        "total": len(result),
        "running": sum(1 for c in result if c["running"]),
        "system": system,
        "collected_at": now,
    }

    _cache["metrics"] = data
    _cache["ts"] = now
    return data


# ── Routes ─────────────────────────────────────────────────
@app.get("/version")
def version():
    return {"version": app.version}


@app.get("/health")
def health():
    try:
        client.ping()
        docker_ok = True
    except Exception:
        docker_ok = False
    return {
        "status": "ok" if docker_ok else "degraded",
        "version": app.version,
        "docker": docker_ok,
        "uptime": int(time.time() - _boot_time),
    }


@app.get("/metrics")
def metrics(x_agent_token: str = Header(default="")):
    auth(x_agent_token)
    return JSONResponse(collect_all_metrics())


@app.get("/system")
def system_metrics(x_agent_token: str = Header(default="")):
    auth(x_agent_token)
    return JSONResponse(get_system_metrics())


# ── Container management ───────────────────────────────────
def _find_container(name: str):
    """Find MTG container by name (with or without 'mtg-' prefix)."""
    full_name = name if name.startswith("mtg-") else f"mtg-{name}"
    try:
        c = client.containers.get(full_name)
        if c.name == "mtg-agent":
            raise HTTPException(status_code=403, detail="Cannot manage agent container")
        return c
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"Container {full_name} not found")


@app.post("/containers/{name}/restart")
def restart_container(name: str, x_agent_token: str = Header(default="")):
    auth(x_agent_token)
    c = _find_container(name)
    c.restart(timeout=10)
    _cache["ts"] = 0  # Invalidate cache
    return {"ok": True, "status": "restarted", "container": c.name}


@app.post("/containers/{name}/stop")
def stop_container(name: str, x_agent_token: str = Header(default="")):
    auth(x_agent_token)
    c = _find_container(name)
    c.stop(timeout=10)
    _cache["ts"] = 0
    return {"ok": True, "status": "stopped", "container": c.name}


@app.post("/containers/{name}/start")
def start_container(name: str, x_agent_token: str = Header(default="")):
    auth(x_agent_token)
    c = _find_container(name)
    c.start()
    _cache["ts"] = 0
    return {"ok": True, "status": "started", "container": c.name}


@app.get("/containers/{name}/logs")
def container_logs(name: str, tail: int = Query(default=100, ge=1, le=1000), x_agent_token: str = Header(default="")):
    auth(x_agent_token)
    c = _find_container(name)
    logs = c.logs(tail=tail, timestamps=True).decode("utf-8", errors="replace")
    return {"container": c.name, "logs": logs, "lines": tail}


# ── Background cache warmer ───────────────────────────────
@app.on_event("startup")
async def start_cache_warmer():
    asyncio.create_task(_warm_cache())


async def _warm_cache():
    """Pre-warm metrics cache in background."""
    await asyncio.sleep(5)
    while True:
        try:
            collect_all_metrics()
        except Exception:
            pass
        await asyncio.sleep(CACHE_TTL)
