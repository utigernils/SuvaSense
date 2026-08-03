// Referenz-Implementierung Tag 2 – Statuslogik + Daten laden
// Diese Datei zeigt EINE mögliche Lösung. Deine kann anders aussehen.
// Wichtig: die Funktions-Signaturen müssen mit der Aufgabe übereinstimmen.

// ---------- Statuslogik ----------

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

// ---------- Dashboard laden ----------

async function loadDashboard() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Daten nicht verfügbar');

    const bundles = await response.json();
    const latest = bundles[0];                       // neuester Push-Bundle
    const bme = latest.readings.bme680;               // BME680-Block

    document.getElementById('serial-number').textContent = 'SN12345';
    document.getElementById('temp-c').textContent        = bme.temp_c + ' °C';
    document.getElementById('hum-pct').textContent       = bme.hum_pct + ' %';

    const status = getStatus(bme.temp_c, bme.hum_pct);
    const statusEl = document.getElementById('status');
    statusEl.textContent = getStatusText(status);
    statusEl.className   = 'status ' + status;

    renderHistory(bundles);
  } catch (error) {
    showError();
    console.error(error);
  }
}

// Beim Laden der Seite starten
loadDashboard();