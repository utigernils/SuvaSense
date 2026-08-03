#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Schlanker lokaler Test-Server für das AE Raumklima Bootcamp-Frontend.

Liefert exakt das Push-Bundle-Schema des echten SuvaSense-Backends, damit
das Frontend genauso getestet werden kann, wie es später gegen das
produktive Backend laufen wird. Einziger Unterschied: die Daten werden
in-memory generiert (kein MQTT-Broker, keine Postgres).

Endpoints (identisch zum echten SuvaSense):
  GET /health
  GET /api/v1/sensors
  GET /api/v1/sensors/{serial}
  GET /api/v1/sensors/{serial}/latest
  GET /api/v1/sensors/{serial}/readings?page=1&page_size=10
  GET /api/v1/sensors/{serial}/readings/{sensorType}
  GET /api/v1/sensors/{serial}/readings/{sensorType}/latest

Start:
    python3 test-server.py            # Port 8090
    python3 test-server.py 8080       # anderer Port
"""

import json
import math
import os
import random
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
try:
    # Python 3.7+
    from socketserver import ThreadingMixIn

    class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
        daemon_threads = True
except ImportError:  # pragma: no cover - Python 3.6 fallback
    ThreadingHTTPServer = HTTPServer


# ---------------------------------------------------------------------------
# Konfiguration
# ---------------------------------------------------------------------------

DEFAULT_PORT = 8090
SENSORS = [
    {
        "serial_number": "SN12345",
        "base_temp_c": 22.0,
        "base_hum_pct": 50,
        "base_lux": 240,
    },
    {
        "serial_number": "SN67890",
        "base_temp_c": 17.5,
        "base_hum_pct": 68,
        "base_lux": 180,
    },
    {
        "serial_number": "DEMO-001",
        "base_temp_c": 25.0,
        "base_hum_pct": 42,
        "base_lux": 320,
    },
]
HISTORY_COUNT = 60            # Anzahl vorgenerierter Push-Bundles pro Sensor
INTERVAL_SECONDS = 15 * 60    # 15-Minuten-Abstand zwischen Push-Bundles
HISTORY_MAX = 200             # Maximale Anzahl im RAM
ONLINE_THRESHOLD_SEC = 30
PUBLISH_INTERVAL_MS = 10_000

VALID_SENSOR_TYPES = {"bme680", "veml7700", "mpu6050", "system"}


# ---------------------------------------------------------------------------
# Datenmodell (im RAM)
# ---------------------------------------------------------------------------

def now_utc():
    return datetime.now(timezone.utc)


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def seed_history(sensor):
    """Erzeuge HISTORY_COUNT zurückliegende Push-Bundles."""
    rand = random.Random(sensor["serial_number"])
    now = now_utc().replace(second=0, microsecond=0)
    out = []
    for i in range(HISTORY_COUNT):
        ts = now - timedelta(seconds=i * INTERVAL_SECONDS)
        bundle = build_bundle(sensor, ts, rand)
        out.append(bundle)
    return out


def build_bundle(sensor, recorded_at, rand):
    """Baut einen Push-Bundle."""
    # Langsame Sinus-Schwankung + leichtes Rauschen
    minutes = recorded_at.timestamp() / 60.0
    temp = sensor["base_temp_c"] + 1.5 * math.sin(minutes / 30.0) + rand.uniform(-0.4, 0.4)
    hum = sensor["base_hum_pct"] + 4.0 * math.cos(minutes / 25.0) + rand.uniform(-1.5, 1.5)
    lux = sensor["base_lux"] + 30 * math.sin(minutes / 20.0) + rand.uniform(-8, 8)

    hum = max(0.0, min(100.0, hum))
    lux = max(0.0, lux)

    # Press & Gas konstant mit kleinem Rauschen
    press = 1013.0 + rand.uniform(-1.5, 1.5)
    gas = 145.0 + rand.uniform(-10, 10)

    bundle = {
        "serial_number": sensor["serial_number"],
        "recorded_at": iso(recorded_at),
        "source_topic": "suva/{}/data".format(sensor["serial_number"]),
        "readings": {
            "bme680": {
                "sensor_type": "bme680",
                "temp_c": round(temp, 1),
                "hum_pct": round(hum),
                "press_hpa": round(press, 1),
                "gas_kohm": round(gas, 1),
            },
            "veml7700": {
                "sensor_type": "veml7700",
                "lux": round(lux, 1),
                "white_raw": round(lux * 0.85, 1),
            },
            "system": {
                "sensor_type": "system",
                "device_uptime_s": int(recorded_at.timestamp()) % 1000000,
                "cpu_temp_c": round(35 + rand.uniform(0, 10), 1),
                "free_heap_bytes": 200000 + int(rand.uniform(-20000, 20000)),
                "rssi_dbm": -45 - int(rand.uniform(0, 30)),
            },
        },
    }
    return bundle


def make_history():
    return {s["serial_number"]: seed_history(s) for s in SENSORS}


def last_seen(serial, history):
    """Berechne last_seen_at aus dem letzten Push-Bundle."""
    if not history:
        return iso(now_utc())
    return history[0]["recorded_at"]


def sensor_metadata(serial, history):
    """Baut das /sensors-Listenelement."""
    sensor = next((s for s in SENSORS if s["serial_number"] == serial), None)
    if sensor is None:
        return None
    last = last_seen(serial, history)
    try:
        last_dt = datetime.strptime(last, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        status = "online" if (now_utc() - last_dt).total_seconds() <= ONLINE_THRESHOLD_SEC else "offline"
    except ValueError:
        status = "offline"
    first_seen = history[-1]["recorded_at"] if history else last
    counts = {}
    for bundle in history:
        for st in bundle["readings"]:
            counts[st] = counts.get(st, 0) + 1
    return {
        "id": "test-" + serial,
        "serial_number": serial,
        "first_seen_at": first_seen,
        "last_seen_at": last,
        "last_topic": "suva/{}/data".format(serial),
        "publish_interval_ms": PUBLISH_INTERVAL_MS,
        "metadata": {},
        "created_at": first_seen,
        "updated_at": last,
        "status": status,
        "readings_by_type": counts,
    }


# ---------------------------------------------------------------------------
# HTTP-Handler
# ---------------------------------------------------------------------------

class TestHandler(BaseHTTPRequestHandler):
    history = None  # wird vom Server gesetzt

    def log_message(self, fmt, *args):
        # kompakteres Log
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _set_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._set_cors()
        self.end_headers()
        self.wfile.write(body)

    def _send_404(self, message):
        self._send_json(404, {"error": message})

    def _send_400(self, message):
        self._send_json(400, {"error": message})

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        path = self.path
        # strip query for routing
        path_only = path.split("?", 1)[0].rstrip("/")
        qs = {}
        if "?" in path:
            for part in path.split("?", 1)[1].split("&"):
                if "=" in part:
                    k, v = part.split("=", 1)
                    qs[k] = v

        if path_only == "/health":
            return self._send_json(200, {"status": "ok"})

        # /api/v1/sensors
        m = re.fullmatch(r"/api/v1/sensors", path_only)
        if m:
            page = self._parse_int(qs.get("page"), 1)
            page_size = self._parse_int(qs.get("page_size"), 50)
            if page < 1: page = 1
            if page_size < 1: page_size = 50
            if page_size > 500: page_size = 500
            status_filter = (qs.get("status") or "").lower().strip()
            items = []
            for s in SENSORS:
                meta = sensor_metadata(s["serial_number"], self.history.get(s["serial_number"], []))
                if status_filter and meta["status"] != status_filter:
                    continue
                items.append(meta)
            offset = (page - 1) * page_size
            items = items[offset:offset + page_size]
            return self._send_json(200, {"page": page, "page_size": page_size, "items": items})

        # /api/v1/sensors/{serial}
        m = re.fullmatch(r"/api/v1/sensors/([A-Za-z0-9_-]+)", path_only)
        if m:
            serial = m.group(1)
            if serial not in self.history:
                return self._send_404("sensor not found")
            meta = sensor_metadata(serial, self.history[serial])
            return self._send_json(200, meta)

        # /api/v1/sensors/{serial}/latest
        m = re.fullmatch(r"/api/v1/sensors/([A-Za-z0-9_-]+)/latest", path_only)
        if m:
            serial = m.group(1)
            if serial not in self.history:
                return self._send_404("sensor not found")
            latest_map = {}
            bundles = self.history[serial]
            if bundles:
                latest = bundles[0]
                for st in VALID_SENSOR_TYPES:
                    if st in latest["readings"]:
                        latest_map[st] = _reading_object(latest, st)
            return self._send_json(200, {"serial_number": serial, "latest": latest_map})

        # /api/v1/sensors/{serial}/readings/{sensorType}/latest
        m = re.fullmatch(r"/api/v1/sensors/([A-Za-z0-9_-]+)/readings/([a-z0-9]+)/latest", path_only)
        if m:
            serial = m.group(1)
            st = m.group(2)
            if serial not in self.history:
                return self._send_404("sensor not found")
            if st not in VALID_SENSOR_TYPES:
                return self._send_400("invalid sensor type")
            for bundle in self.history[serial]:
                if st in bundle["readings"]:
                    return self._send_json(200, _reading_object(bundle, st))
            return self._send_404("no readings found")

        # /api/v1/sensors/{serial}/readings/{sensorType}
        m = re.fullmatch(r"/api/v1/sensors/([A-Za-z0-9_-]+)/readings/([a-z0-9]+)", path_only)
        if m:
            serial = m.group(1)
            st = m.group(2)
            if serial not in self.history:
                return self._send_404("sensor not found")
            if st not in VALID_SENSOR_TYPES:
                return self._send_400("invalid sensor type")
            page = self._parse_int(qs.get("page"), 1)
            page_size = self._parse_int(qs.get("page_size"), 100)
            if page < 1: page = 1
            if page_size < 1: page_size = 100
            if page_size > 1000: page_size = 1000
            items = []
            for bundle in self.history[serial]:
                if st in bundle["readings"]:
                    items.append(_reading_object(bundle, st))
                    if len(items) >= page_size:
                        break
            return self._send_json(200, {
                "serial_number": serial,
                "sensor_type": st,
                "page": page,
                "page_size": page_size,
                "items": items,
            })

        # /api/v1/sensors/{serial}/readings  (Push-Bundle Modus)
        m = re.fullmatch(r"/api/v1/sensors/([A-Za-z0-9_-]+)/readings", path_only)
        if m:
            serial = m.group(1)
            if serial not in self.history:
                return self._send_404("sensor not found")
            page = self._parse_int(qs.get("page"), 1)
            page_size = self._parse_int(qs.get("page_size"), 10)
            if page < 1: page = 1
            if page_size < 1: page_size = 10
            if page_size > 200: page_size = 200
            sensor_type = (qs.get("sensor_type") or "").lower().strip()
            items = []
            for bundle in self.history[serial]:
                if sensor_type:
                    if sensor_type in bundle["readings"]:
                        filtered = {
                            "serial_number": bundle["serial_number"],
                            "recorded_at": bundle["recorded_at"],
                            "source_topic": bundle["source_topic"],
                            "readings": {sensor_type: bundle["readings"][sensor_type]},
                        }
                        items.append(filtered)
                else:
                    items.append(bundle)
                if len(items) >= page_size:
                    break
            resp = {
                "serial_number": serial,
                "page": page,
                "page_size": page_size,
                "mode": "push-bundles",
                "items": items,
            }
            if sensor_type:
                resp["sensor_type"] = sensor_type
            return self._send_json(200, resp)

        return self._send_404("not found")

    @staticmethod
    def _parse_int(value, default):
        if value is None or value == "":
            return default
        try:
            return int(value)
        except ValueError:
            return default


def _reading_object(bundle, sensor_type):
    """Baut ein Reading-Objekt im SuvaSense-Schema (mit *_c/_pct/_hpa/_kohm-Feldern)."""
    raw = bundle["readings"].get(sensor_type)
    if raw is None:
        return None
    base = {
        "id": 0,
        "sensor_id": "test-" + bundle["serial_number"],
        "serial_number": bundle["serial_number"],
        "sensor_type": sensor_type,
        "recorded_at": bundle["recorded_at"],
        "device_uptime_s": bundle["readings"].get("system", {}).get("device_uptime_s"),
        "source_topic": bundle["source_topic"],
        "raw": raw,
    }
    if sensor_type == "bme680":
        base["temp_c"] = raw.get("temp_c")
        base["hum_pct"] = raw.get("hum_pct")
        base["press_hpa"] = raw.get("press_hpa")
        base["gas_kohm"] = raw.get("gas_kohm")
    elif sensor_type == "veml7700":
        base["lux"] = raw.get("lux")
        base["white_raw"] = raw.get("white_raw")
    elif sensor_type == "system":
        base["cpu_temp_c"] = raw.get("cpu_temp_c")
        base["free_heap_bytes"] = raw.get("free_heap_bytes")
        base["rssi_dbm"] = raw.get("rssi_dbm")
    return base


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Ungültiger Port:", sys.argv[1])
            sys.exit(1)

    history = make_history()
    TestHandler.history = history

    server = ThreadingHTTPServer(("0.0.0.0", port), TestHandler)
    print("SuvaSense-kompatibler Test-Server auf Port {}".format(port))
    print("Endpoints:")
    print("  GET http://localhost:{}/health".format(port))
    print("  GET http://localhost:{}/api/v1/sensors".format(port))
    print("  GET http://localhost:{}/api/v1/sensors/SN12345/readings?page=1&page_size=10".format(port))
    print("Frontend API_BASE = 'http://localhost:{}/api/v1'".format(port))
    print("Drücke Ctrl+C zum Beenden.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nBye.")
        server.shutdown()


if __name__ == "__main__":
    main()