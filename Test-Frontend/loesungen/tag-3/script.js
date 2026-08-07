// Referenz-Implementierung Tag 3 – Snapshot-Fallback-Strategie
//
// Diese Datei zeigt EINE mögliche Lösung. Deine kann anders aussehen.
// Wichtig: die Reihenfolge der Fallbacks (API → localStorage → Seed)
// und die Trennung pro Sensor (snapshotKey(serial)) müssen stimmen.
// Diese Datei ist eigenständig – sie enthält ALLE Funktionen,
// die Tag-2 script.js hatte, plus die Snapshot-Strategie.

// ---------- Konfiguration ----------

// Im Bootcamp zeigt der Trainer die echte API-URL.
// Für lokales Testen ohne Backend bleibt API_BASE = ''
// (dann wird der Snapshot-Fallback genutzt).
const API_BASE = '';

// Aktueller Sensor (vom Dropdown)
let currentSerial = 'SN12345';

// ---------- Hilfsfunktionen ----------

function snapshotKey(serial) {
  return `snapshot:${serial}`;
}

function getStatus(tempC, humPct) {
  const tempOk = tempC >= 20 && tempC <= 24;
  const humOk  = humPct >= 40 && humPct <= 60;
  const tempWarn = tempC >= 18 && tempC <= 26;
  const humWarn  = humPct >= 30 && humPct <= 70;

  if (tempOk && humOk) return 'gut';
  if (tempWarn || humWarn) return 'kritisch';
  return 'schlecht';
}

function getStatusText(status) {
  switch (status) {
    case 'gut': return 'Gut';
    case 'kritisch': return 'Kritisch';
    case 'schlecht': return 'Schlecht';
    default: return 'Unbekannt';
  }
}

// ---------- Verlauf rendern ----------

function renderHistory(bundles) {
  const list = document.getElementById('history-list');
  list.innerHTML = '';

  bundles.forEach(bundle => {
    const bme = bundle.readings && bundle.readings.bme680;
    if (!bme) return;

    const item = document.createElement('div');
    item.className = 'history-item';

    const status = getStatus(bme.temp_c, bme.hum_pct);
    const time = new Date(bundle.recorded_at).toLocaleTimeString('de-CH', {
      hour: '2-digit', minute: '2-digit'
    });

    item.innerHTML = `
      <span class="history-time">${time}</span>
      <span class="history-temp">${bme.temp_c}°C</span>
      <span class="history-hum">${bme.hum_pct}%</span>
      <span class="history-status ${status}">${getStatusText(status)}</span>
    `;

    list.appendChild(item);
  });
}

// ---------- Fehlerbehandlung ----------

function showError() {
  document.getElementById('serial-number').textContent = 'Keine Daten';
  document.getElementById('temp-c').textContent        = '-- °C';
  document.getElementById('hum-pct').textContent       = '-- %';

  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Keine Daten verfügbar';
  statusEl.className   = 'status schlecht';

  document.getElementById('history-list').innerHTML =
    '<p class="placeholder">Daten konnten nicht geladen werden.</p>';
}

// ---------- Snapshot-Fallback-Strategie ----------

async function getBundles(serial, limit = 10) {
  // 1. Versuch: Live-API (nur wenn API_BASE gesetzt)
  if (API_BASE) {
    try {
      const response = await fetch(
        `${API_BASE}/sensors/${serial}/readings?page=1&page_size=${limit}`
      );
      if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);
      const data = await response.json();
      const items = data.items || [];

      // Erfolg: Snapshot in localStorage aktualisieren
      try {
        localStorage.setItem(snapshotKey(serial), JSON.stringify(items));
      } catch (e) {
        console.warn('Snapshot konnte nicht gespeichert werden:', e);
      }
      return items;
    } catch (error) {
      console.warn('API nicht erreichbar, nutze Snapshot:', error);
    }
  }

  // 2. Versuch: Snapshot aus localStorage
  const cached = localStorage.getItem(snapshotKey(serial));
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.warn('Snapshot kaputt:', e);
    }
  }

  // 3. Versuch: Initial-Seed (data.json)
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Seed nicht ladbar');
    return await response.json();
  } catch (error) {
    console.error('Auch Seed nicht ladbar:', error);
    return [];
  }
}

async function getLatestBundle(serial) {
  const bundles = await getBundles(serial, 10);
  if (bundles.length === 0) throw new Error('Keine Daten verfügbar');
  return bundles[0];
}

// ---------- Sensor-Auswahl ----------

function onSensorChange() {
  currentSerial = document.getElementById('sensor-select').value;
  loadDashboard();
}

// ---------- Dashboard-Loader ----------

async function loadDashboard() {
  try {
    const latest = await getLatestBundle(currentSerial);
    const bme = latest.readings.bme680;

    document.getElementById('serial-number').textContent = currentSerial;
    document.getElementById('temp-c').textContent        = bme.temp_c + ' °C';
    document.getElementById('hum-pct').textContent       = bme.hum_pct + ' %';

    const status = getStatus(bme.temp_c, bme.hum_pct);
    const statusEl = document.getElementById('status');
    statusEl.textContent = getStatusText(status);
    statusEl.className   = 'status ' + status;

    const bundles = await getBundles(currentSerial, 10);
    renderHistory(bundles);
  } catch (error) {
    showError();
    console.error(error);
  }
}

// Beim Laden der Seite starten
loadDashboard();
