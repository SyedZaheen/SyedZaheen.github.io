const NUM_DAYS = 7;
const dateFormat = { year: 'numeric', month: '2-digit', day: '2-digit' };

let allDataByDate = {}; // Will look like { "2024-05-17": { "East London": { Fajr: "04:01", ... } } }
let allMosques = [];    // From mosques.json

function formatDateJS(date) {
  return date.toISOString().split('T')[0];
}

function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

function excelTimeToString(decimal) {
  const totalMinutes = Math.round(decimal * 24 * 60);
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

async function loadAllMosques() {
  try {
    const res = await fetch('mosque-data/mosques.json');
    if (!res.ok) {
      console.error(`Failed to load mosques.json: ${res.status} ${res.statusText}`);
      return [];
    }
    const json = await res.json();
    
    // Validate mosque entries
    const validMosques = json.filter(mosque => {
      if (!mosque.filename || typeof mosque.filename !== 'string') {
        console.warn(`Invalid mosque entry: Missing or invalid filename`, mosque);
        return false;
      }
      if (!mosque.displayName || typeof mosque.displayName !== 'string') {
        console.warn(`Invalid mosque entry: Missing or invalid displayName`, mosque);
        return false;
      }
      return true;
    });
    
    console.log(`Loaded ${validMosques.length} valid mosques out of ${json.length}`);
    allMosques = validMosques;
    return validMosques;
  } catch (error) {
    console.error('Error loading mosques data:', error);
    return [];
  }
}


async function parseMosqueFile(filename, displayName) {
  try {
    const res = await fetch(`mosque-data/${filename}`);
    if (!res.ok) {
      console.error(`Failed to load mosque file ${filename}: ${res.status} ${res.statusText}`);
      return false;
    }
    
    const buf = await res.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array' });
    
    if (!workbook.SheetNames.length) {
      console.error(`No sheets found in ${filename}`);
      return false;
    }
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet);
    
    if (!raw.length) {
      console.warn(`No data found in ${filename}`);
      return false;
    }

    raw.forEach(row => {
      // Validate row data
      if (!row.Date || isNaN(row.Date)) return;
      
      try {
        const jsDate = excelDateToJSDate(row.Date);
        const dateKey = formatDateJS(jsDate);
        
        if (!allDataByDate[dateKey]) allDataByDate[dateKey] = {};

        allDataByDate[dateKey][displayName] = {
          Fajr: row.Fajr ? excelTimeToString(row.Fajr) : '-',
          Dhuhr: row.Dhuhr ? excelTimeToString(row.Dhuhr) : '-',
          Asr: row.Asr ? excelTimeToString(row.Asr) : '-',
          Maghrib: row.Maghrib ? excelTimeToString(row.Maghrib) : '-',
          Isha: row.Isha ? excelTimeToString(row.Isha) : '-'
        };
      } catch (rowError) {
        console.warn(`Error processing row in ${filename}:`, rowError);
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error parsing mosque file ${filename}:`, error);
    return false;
  }
}


function populateDateDropdown() {
  const select = document.getElementById('mosque-select');
  const today = new Date();

  select.innerHTML = '<option value="">-- Select a date --</option>';

  for (let i = 0; i < NUM_DAYS; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = formatDateJS(date);

    const option = document.createElement('option');
    option.value = dateStr;
    option.textContent = date.toLocaleDateString(undefined, dateFormat);
    select.appendChild(option);
  }
}

function renderTableForDate(dateKey) {
  const container = document.getElementById('table-container');
  const rows = [];

  if (!allDataByDate[dateKey]) {
    container.innerHTML = `<p>No data available for ${dateKey}.</p>`;
    return;
  }

  allMosques.forEach(({ displayName }) => {
    const times = allDataByDate[dateKey][displayName];
    if (times) {
      rows.push({
        Mosque: displayName,
        ...times
      });
    }
  });

  if (rows.length === 0) {
    container.innerHTML = `<p>No prayer times found for ${dateKey}.</p>`;
    return;
  }

  const table = document.createElement('table');
  table.border = '1';

  const headerRow = table.insertRow();
  ['Mosque', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  });

  rows.forEach(row => {
    const tr = table.insertRow();
    ['Mosque', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(key => {
      const td = tr.insertCell();
      td.textContent = row[key] || '-';
    });
  });

  container.innerHTML = '';
  container.appendChild(table);
}

document.getElementById('mosque-select').addEventListener('change', function () {
  const date = this.value;
  if (date) {
    renderTableForDate(date);
  } else {
    document.getElementById('table-container').innerHTML = "Select a date to view prayer times.";
  }
});

(async function init() {
  await loadAllMosques();
  
  // Track loading success
  const loadingResults = await Promise.allSettled(
    allMosques.map(({ filename, displayName }) => 
      parseMosqueFile(filename, displayName)
    )
  );
  
  const successCount = loadingResults.filter(result => result.status === 'fulfilled' && result.value).length;
  console.log(`Successfully loaded ${successCount} out of ${allMosques.length} mosque files`);
  
  populateDateDropdown();
})();