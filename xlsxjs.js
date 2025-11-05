// import { JSZip } from './jszip.min';

//document.getElementById('file_input').addEventListener('change', () => {
//  // Get the selected file from the input element
//  const selectedFile = event.target.files[0];
//
//  // Initialize a FileReader object
//  const reader = new FileReader();
//
//  // Define what happens when the file has been read
//  reader.onload = onFileLoad;
//
//  // Handle errors
//  reader.onerror = function(error) {
//    alert('错误，请联系这个软件的开发者，或者谁给你的这个软件你就找谁售后' + error);
//    console.log('Error reading file:', error);
//  };
//
//  reader.readAsArrayBuffer(selectedFile);
//});

//function onFileLoad(event) {
//  console.log('file loaded');
//  parseXlsx(event.target.result, 'sheet1');
//}

async function parseXlsx(fcontent, sheetName) {
  const zip = await (new JSZip()).loadAsync(fcontent);
  const sheet = await zip.file(`xl/worksheets/${sheetName}.xml`).async('string')
  const sharedStrings = await zip.file('xl/sharedStrings.xml').async('string');
  return parseXml(sheet, sharedStrings);
}

// Helper function to convert column letters to index (A=0, B=1, ..., Z=25, AA=26, etc.)
function columnLetterToIndex(letters) {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 65 + 1);
  }
  return index - 1; // Convert to zero-based index
}

function parseXml(sheetString, sharedStringsString) {
  const parser = new DOMParser();
  const sheet = parser.parseFromString(sheetString, "application/xml");
  const sharedStrings = parser.parseFromString(sharedStringsString, "application/xml").getElementsByTagName('si');
  const rows = sheet.getElementsByTagName('row');
  let sheetTable = [];

  //let lastR = 0;
  for (const row of rows) {
    let maxColIndex = 0;
    // 为了解决部分空cell不出现在row中的问题
    const cellMap = new Map();
    //const line_num = parseInt(row.attributes['r'].value);
    //if (line_num != lastR + 1) {
      // break on a break of line number?
      //break;
    //}
    const rowNum = row.getAttribute('r'); // Get row number for debugging
    const cells = row.getElementsByTagName('c');
    console.log(`Row ${rowNum} - processing ${cells.length} cells`);
    for (const cell of cells) {
      const cellRef = cell.getAttribute('r'); // Get cell reference (e.g., A1, B1)
      const colLetter = cellRef.replace(rowNum, ''); // Extract column letters (A, B, C, etc.)
      const colIndex = columnLetterToIndex(colLetter);
      const cellType = cell.getAttribute('t');
      const rawValue = cell.getElementsByTagName('v')[0].textContent;
      const value = (cellType == "s") ? sharedStrings[parseInt(rawValue)].textContent : rawValue;

      // record value in cellMap instead of pushing to rowList at once
      cellMap.set(colIndex, value);
      maxColIndex = Math.max(maxColIndex, colIndex);

      console.log(`Cell ${cellRef}: type=${cellType}, rawValue=${rawValue}, parsedValue=${value}`);
      // console.log(`Cell ${cell.getAttribute('r')} has value ${value}`);
      // rowList = rowList.concat([value]);
    }

    // Second pass: build the row array with empty strings for missing columns
    let rowList = [];
    for (let colIndex = 0; colIndex <= maxColIndex; colIndex++) {
      rowList[colIndex] = cellMap.get(colIndex) || ''; // Fill empty cells with empty string
    }

    console.log(`Row ${rowNum} completed - ${rowList.length} columns:`, rowList);
    sheetTable.push(rowList);

    // sheetTable = sheetTable.concat([rowList]);
  }
  return sheetTable;
}
