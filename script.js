// script.js
(function() {
  const FILE_PATH = 'mosque-data/mosque-data.xlsx';
  let rawData = [];

  function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    return new Date(utc_value * 1000);
  }

  function excelTimeToString(decimal) {
    const totalMinutes = Math.round(decimal * 24 * 60);
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  async function loadData() {
    const res = await fetch(FILE_PATH);
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rawData = XLSX.utils.sheet_to_json(sheet);
    showTab('prayers');
  }

  function renderTable(columns, rows) {
    const container = document.getElementById('table-container');
    container.innerHTML = '';
    const table = document.createElement('table');
    const thead = table.createTHead();
    const hr = thead.insertRow();
    columns.forEach(col => {
      const th = document.createElement('th'); th.textContent = col; hr.appendChild(th);
    });
    const tbody = table.createTBody();
    rows.forEach(row => {
      const tr = tbody.insertRow();
      columns.forEach(col => {
        const td = tr.insertCell();
        td.textContent = row[col] || '-';
      });
    });
    container.appendChild(table);
  }

  function showTab(tab) {
    document.querySelectorAll('.tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    if (tab === 'prayers') {
      const cols = ['Mosque', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      const rows = rawData.map(r => ({
        Mosque: r.Mosque,
        Fajr: excelTimeToString(r.Fajr),
        Dhuhr: excelTimeToString(r.Dhuhr),
        Asr: excelTimeToString(r.Asr),
        Maghrib: excelTimeToString(r.Maghrib),
        Isha: excelTimeToString(r.Isha)
      }));
      renderTable(cols, rows);
    } else {
      const cols = ['Mosque', 'Khutbah', "Juma"];
      const rows = rawData.map(r => ({
        Mosque: r.Mosque,
        Khutbah: excelTimeToString(r.Khutbah),
        Juma: excelTimeToString(r.Juma)
      }));
      renderTable(cols, rows);
    }
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
  });

  loadData();
})();