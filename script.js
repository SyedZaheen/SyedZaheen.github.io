// script.js
(function() {
  const FILE_PATH = 'mosque-data/mosque-data.xlsx';
  let mainTableData = [];
  let mosqueSheets = {};
  let currentView = 'main'; // 'main' or 'mosque'
  let currentMosque = null;
  let filteredRows = []; // Store filtered rows for search

  function excelTimeToString(decimal) {
    if (typeof decimal !== 'number' || isNaN(decimal)) {
      return '-';
    }
    const totalMinutes = Math.round(decimal * 24 * 60);
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function excelDateToJSDate(serial) {
    // Excel's epoch starts on Jan 1, 1900
    // But Excel has a leap year bug thinking 1900 was a leap year
    // So we add 1 to the day count for dates after Feb 28, 1900
    const daysSince1900 = serial - 1;
    const date = new Date(1900, 0, 1);
    date.setDate(date.getDate() + daysSince1900);
    return date;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  async function loadData() {
    try {
      const res = await fetch(FILE_PATH);
      const buf = await res.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      
      // First sheet is the main table
      const mainSheet = wb.Sheets[wb.SheetNames[0]];
      mainTableData = XLSX.utils.sheet_to_json(mainSheet);
      
      // Load all other mosque-specific sheets
      wb.SheetNames.slice(1).forEach(sheetName => {
        const sheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        if (data.length > 0) {
          // Process mosque-specific data
          const processedData = data.map(row => {
            // Convert Excel date to JS date
            const jsDate = row.Date ? excelDateToJSDate(row.Date) : null;
            
            return {
              Date: jsDate ? formatDate(jsDate) : '-',
              Fajr: excelTimeToString(row.Fajr),
              Dhuhr: excelTimeToString(row.Dhuhr),
              Asr: excelTimeToString(row.Asr),
              Maghrib: excelTimeToString(row.Maghrib),
              Isha: excelTimeToString(row.Isha),
              Khutbah: excelTimeToString(row.Khutbah),
              Juma: excelTimeToString(row.Juma)
            };
          });
          
          mosqueSheets[sheetName] = processedData;
        }
      });
      
      // Show main table initially
      showMainTable();
      
    } catch (error) {
      console.error('Error loading data:', error);
      document.getElementById('table-container').innerHTML = '<p>Error loading data. Please try again later.</p>';
    }
  }

  function renderTable(columns, rows, clickable = false) {
    const container = document.getElementById('table-container');
    container.innerHTML = '';
    
    if (rows.length === 0) {
      container.innerHTML = '<p>No mosques found matching your search.</p>';
      return;
    }
    
    const table = document.createElement('table');
    const thead = table.createTHead();
    const hr = thead.insertRow();
    columns.forEach(col => {
      const th = document.createElement('th'); 
      th.textContent = col; 
      hr.appendChild(th);
    });
    
    const tbody = table.createTBody();
    rows.forEach(row => {
      const tr = tbody.insertRow();
      
      if (clickable) {
        tr.classList.add('mosque-row');
        tr.addEventListener('click', () => {
          showMosqueData(row.Mosque);
        });
      }
      
      columns.forEach(col => {
        const td = tr.insertCell();
        td.textContent = row[col] || '-';
      });
    });
    
    container.appendChild(table);
  }

  function showMainTable() {
    currentView = 'main';
    currentMosque = null;
    
    // Hide back button, mosque title, and search results elements
    document.getElementById('back-button').style.display = 'none';
    document.getElementById('mosque-title').textContent = '';
    document.getElementById('search-container').style.display = 'block';
    document.getElementById('search-results-heading').style.display = 'none';
    document.getElementById('clear-search').style.display = 'none';
    
    // Clear search input if it exists
    const searchInput = document.getElementById('mosque-search');
    if (searchInput) searchInput.value = '';
    
    // Define columns for main table (including all prayer times)
    const cols = ['Mosque', 'Address', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Khutbah', 'Juma'];
    
    // Map the data and sort by mosque name
    filteredRows = mainTableData.map(r => ({
      Mosque: r.Mosque,
      Address: r.Address || '-',
      Fajr: excelTimeToString(r.Fajr),
      Dhuhr: excelTimeToString(r.Dhuhr),
      Asr: excelTimeToString(r.Asr),
      Maghrib: excelTimeToString(r.Maghrib),
      Isha: excelTimeToString(r.Isha),
      Khutbah: excelTimeToString(r.Khutbah),
      Juma: excelTimeToString(r.Juma)
    })).sort((a, b) => a.Mosque.localeCompare(b.Mosque));
    
    // Render the main table with clickable rows
    renderTable(cols, filteredRows, true);
  }

  function showMosqueData(mosqueName) {
    // Find the mosque data sheet
    if (!mosqueSheets[mosqueName]) {
      alert(`No data found for that mosque!`);
      return;
    }
    
    currentView = 'mosque';
    currentMosque = mosqueName;
    
    // Show back button and mosque title, hide search bar
    document.getElementById('back-button').style.display = 'inline-block';
    document.getElementById('mosque-title').textContent = "Masjid " + mosqueName;
    document.getElementById('search-container').style.display = 'none';
    
    // Define columns for mosque-specific table
    const cols = ['Date', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Khutbah', 'Juma'];
    
    // Render the mosque-specific table
    renderTable(cols, mosqueSheets[mosqueName], false);
  }

  function filterMosques(searchTerm) {
    const searchHeading = document.getElementById('search-results-heading');
    const clearButton = document.getElementById('clear-search');

    if (!searchTerm.trim()) {
      // If search is empty, show all mosques and hide search results elements
      showMainTable();
      searchHeading.style.display = 'none';
      clearButton.style.display = 'none';
      return;
    }

    // Show the search results heading and clear button
    searchHeading.style.display = 'block';
    clearButton.style.display = 'block';

    const cols = ['Mosque', 'Address', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Khutbah', 'Juma'];
    
    // Convert search term to lowercase and split into tokens (words)
    const searchTokens = searchTerm.toLowerCase().split(/\s+/).filter(token => token.length > 0);
    
    // Filter mosques that match any of the search tokens
    const filteredResults = filteredRows.filter(row => {
      const mosqueName = row.Mosque.toLowerCase();
      
      // Check if any search token is contained in the mosque name
      return searchTokens.some(token => mosqueName.includes(token));
    });
    
    // Score results by relevance (how many tokens match)
    const scoredResults = filteredResults.map(row => {
      const mosqueName = row.Mosque.toLowerCase();
      let score = 0;
      
      // Increase score for each matching token
      searchTokens.forEach(token => {
        if (mosqueName.includes(token)) score++;
        // Bonus points for exact word matches
        if (mosqueName.split(/\s+/).some(word => word === token)) score += 0.5;
        // Additional bonus for prefix matches (starts with)
        if (mosqueName.startsWith(token)) score += 1;
      });
      
      return { row, score };
    });
    
    // Sort by score (highest first)
    scoredResults.sort((a, b) => b.score - a.score);
    
    // Extract just the row data for rendering
    const sortedResults = scoredResults.map(item => item.row);
    
    // Update search results heading with count
    searchHeading.textContent = `Search Results (${sortedResults.length} mosque${sortedResults.length !== 1 ? 's' : ''} found)`;
    
    // Render sorted results
    renderTable(cols, sortedResults, true);
  }

  // Initialize back button
  document.getElementById('back-button').addEventListener('click', showMainTable);

  // Setup search functionality
  function setupSearch() {
    const searchInput = document.getElementById('mosque-search');
    const clearButton = document.getElementById('clear-search');
    
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value;
      filterMosques(searchTerm);
    });
    
    // Add functionality to clear button
    clearButton.addEventListener('click', () => {
      searchInput.value = '';
      filterMosques('');
      searchInput.focus(); // Return focus to the search input
    });
  }

  // Load data on startup
  loadData().then(() => {
    setupSearch();
  });
})();