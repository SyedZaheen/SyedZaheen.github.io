
// Import required modules
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configurationnpm install xlsxnpm install xlsx
const FILE_PATH = path.join(__dirname, 'mosque-data', 'mosque-data.xlsx');

// Read file directly using Node.js file system
const buffer = fs.readFileSync(FILE_PATH);

// Parse workbook
const workbook = XLSX.read(buffer, { type: 'buffer' });

// Get first sheet
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert sheet to JSON
const rawData = XLSX.utils.sheet_to_json(sheet);

/* 
Total processing steps:
1. Take the data from the Mosque column, row by row.
2. For each row in the Mosque column, take all the string after the first comma. This is the address.
3. For each row in the Mosque column, take all the string before the first comma. This is the name.
4. For the address, remove all the spaces before and after the string.
5. For this address, create a new column called Address.
6. For the name, remove all the spaces before and after the string.
7. For this name, keep it in the Mosque column.
8. We are now ready to output the data in a clean format.
*/

const cleanedData = rawData.map(row => {
  const mosqueParts = row.Mosque.split(',');
  const name = mosqueParts[0].trim();
  const address = mosqueParts.slice(1).join(',').trim();

  return {
    ...row,
    Mosque: name,
    Address: address
  };
});

// Edit the current excel file with the cleaned data
const newSheet = XLSX.utils.json_to_sheet(cleanedData);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Cleaned Data');
const newFilePath = path.join(__dirname, 'mosque-data', 'cleaned-mosque-data.xlsx');
XLSX.writeFile(newWorkbook, newFilePath);
console.log('Cleaned data written to:', newFilePath);