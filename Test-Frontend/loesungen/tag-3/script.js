// Referenz-Implementierung Tag 3 – Snapshot-Fallback-Strategie
//
// Diese Datei zeigt EINE mögliche Lösung. Deine kann anders aussehen.
// Wichtig: die Reihenfolge der Fallbacks (API → localStorage → Seed)
// und die Trennung pro Sensor (`snapshotKey(serial)`) müssen stimmen.

// ---------- Snapshot-Fallback ----------

async function getBundles(serial, limit = 10) {
  // 1. Versuch: Live-API
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