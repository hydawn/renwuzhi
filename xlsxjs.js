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

function parseXml(sheetString, sharedStringsString) {
  const parser = new DOMParser();
  const sheet = parser.parseFromString(sheetString, "application/xml");
  const sharedStrings = parser.parseFromString(sharedStringsString, "application/xml").getElementsByTagName('si');
  const rows = sheet.getElementsByTagName('row');
  let sheetTable = [];

  //let lastR = 0;
  for (const row of rows) {
    let rowList = [];
    //const line_num = parseInt(row.attributes['r'].value);
    //if (line_num != lastR + 1) {
      // break on a break of line number?
      //break;
    //}
    const cells = row.getElementsByTagName('c');
    for (const cell of cells) {
      const type = cell.getAttribute('t');
      const rawValue = cell.getElementsByTagName('v')[0].textContent;
      const value = (type == "s") ? sharedStrings[parseInt(rawValue)].textContent : rawValue;
      // console.log(`Cell ${cell.getAttribute('r')} has value ${value}`);
      rowList = rowList.concat([value]);
    }
    sheetTable = sheetTable.concat([rowList]);
  }
  return sheetTable;
}
