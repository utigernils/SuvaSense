// ============================================================
// AE Raumklima Bootcamp – App Logik
//
// Tag 2: Statuslogik, Mock-Daten laden, Verlauf rendern
// Tag 3: Snapshot-Fallback (API → localStorage → Seed),
//        Sensor-Auswahl über Admin-Panel
//
// Datenvertrag: SuvaSense-Push-Bundle-Schema
// (siehe docs/projekt/api-vertrag.md)
// ============================================================

// Konfiguration – zeigt auf das ECHTE SuvaSense-Backend
// im Docker-Container (hört auf 8080). Wenn der Live-Server
// auf einer anderen Maschine läuft (z.B. 192.168.1.186),
// muss die IP angepasst werden, NICHT 'localhost'.
// Für Test-Server (Port 8090) die URL austauschen.
const API_BASE = 'http://192.168.1.186:8080/api/v1';
let currentSerial = '7208r_0001';

function snapshotKey(serial) {
  return `snapshot:${serial}`;
}

// ---------- Tag 2: Statuslogik ----------

function getStatus(tempC, humPct) {
const tempOk = tempC >= 20 && tempC <= 22;
const humOk  = humPct >= 40 && humPct <= 60;

const tempWarn =
  (tempC >= 18 && tempC < 20) ||
  (tempC > 22 && tempC <= 26);

const humWarn =
  (humPct >= 30 && humPct < 40) ||
  (humPct > 60 && humPct <= 65);

const tempBad = tempC < 18 || tempC >= 27;
const humBad  = humPct < 30 || humPct > 65;

if (tempBad || humBad) return 'schlecht';
if (tempOk && humOk) return 'gut';
return 'kritisch';
}

function getStatusText(status) {
  switch (status) {
    case 'gut': return 'Gut';
    case 'kritisch': return 'Kritisch';
    case 'schlecht': return 'Schlecht';
    default: return 'Unbekannt';
  }
}

// ---------- Tag 3: Snapshot-Fallback ----------

async function getBundles(serial, limit = 10) {
  // 1. Versuch: Live-API
  try {
    const response = await fetch(`${API_BASE}/sensors/${serial}/readings?page=1&page_size=${limit}`);
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
    // Toast SOFORT anzeigen (auch wenn Fallback funktioniert)
    showApiErrorToast();
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

  // 3. Versuch: Initial-Seed
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
  return bundles[0];   // neuester zuerst
}

// ---------- Tag 2: Verlaufsliste rendern ----------

function renderHistory(bundles) {
  const list = document.getElementById('history-list');
  list.innerHTML = '';

  bundles.forEach(bundle => {
    const bme = bundle.readings && bundle.readings.bme680;
    if (!bme) return;                                  // BME680 nicht in diesem Bundle

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

// ---------- Tag 2: Fehlerbehandlung ----------

// Schlanker Toast (kein CSS, keine Dependencies):
// - Wird beim ersten API-Fehler eingeblendet
// - Verschwindet nach 8s automatisch ODER via Close-Button
// - Inline-Styles, damit es ohne style.css funktioniert
function showApiErrorToast() {
  // Doppelte Toasts vermeiden
  if (document.getElementById('api-error-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'api-error-toast';
  toast.setAttribute('role', 'alert');
  toast.style.cssText = [
    'position:fixed',
    'bottom:24px',
    'right:24px',
    'max-width:360px',
    'padding:14px 18px',
    'background:#c62828',
    'color:#fff',
    'border-radius:8px',
    'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
    'font-family:inherit',
    'font-size:14px',
    'line-height:1.4',
    'z-index:9999',
    'display:flex',
    'align-items:flex-start',
    'gap:10px',
  ].join(';');

  toast.innerHTML = `
    <div style="flex:1">
      <strong style="display:block;margin-bottom:2px">API nicht connected</strong>
      <span style="opacity:0.95">Verwende Fallback-Daten</span>
    </div>
    <button type="button" aria-label="Schliessen"
      style="background:transparent;border:0;color:#fff;font-size:18px;line-height:1;cursor:pointer;padding:0 4px;margin-left:4px">&times;</button>
  `;

  // Close-Button
  toast.querySelector('button').addEventListener('click', () => toast.remove());
  // Auto-Dismiss nach 8s
  setTimeout(() => toast.remove(), 8000);

  document.body.appendChild(toast);
}

function showError() {
  document.getElementById('serial-number').textContent = 'Keine Daten';
  document.getElementById('temp-c').textContent        = '-- °C';
  document.getElementById('hum-pct').textContent       = '-- %';

  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Keine Daten verfügbar';
  statusEl.className   = 'status schlecht';

  document.getElementById('history-list').innerHTML =
    '<p class="placeholder">Daten konnten nicht geladen werden.</p>';

  // Toast: API nicht erreichbar, Fallback aktiv
  showApiErrorToast();
}

// ---------- Tag 3: Sensor-Auswahl ----------

function onSensorChange() {
  currentSerial = document.getElementById('sensor-select').value;
  loadDashboard();
}

// ---------- Tag 3: Dashboard-Loader ----------

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