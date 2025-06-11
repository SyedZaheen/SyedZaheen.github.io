// test.js - Testing SheetJS data loading in Node.js environment

// Import required modules
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configurationnpm install xlsxnpm install xlsx
const FILE_PATH = path.join(__dirname, 'mosque-data', 'mosque-data.xlsx');
let rawData = [];

// Convert Excel time values (decimal) to time string format
function excelTimeToString(decimal) {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    return '-';
  }
  const totalMinutes = Math.round(decimal * 24 * 60);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Load and process data
function loadData() {
  try {
    // Read file directly using Node.js file system
    const buffer = fs.readFileSync(FILE_PATH);
    
    // Parse workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    rawData = XLSX.utils.sheet_to_json(sheet);
    
    // Process prayer times
    const prayerData = rawData.map(r => ({
      Mosque: r.Mosque,
      Fajr: excelTimeToString(r.Fajr),
      Dhuhr: excelTimeToString(r.Dhuhr),
      Asr: excelTimeToString(r.Asr),
      Maghrib: excelTimeToString(r.Maghrib),
      Isha: excelTimeToString(r.Isha)
    }));
    
    // Process Juma times
    const jumaData = rawData.map(r => ({
      Mosque: r.Mosque,
      Khutbah: excelTimeToString(r.Khutbah),
      Juma: excelTimeToString(r.Juma)
    }));
    
    // Output results
    console.log('Prayer Times:');
    console.table(prayerData);
    
    console.log('\nJuma Times:');
    console.table(jumaData);
    
  } catch (error) {
    console.error('Error loading or processing data:', error);
  }
}

// Execute the data loading function
loadData();