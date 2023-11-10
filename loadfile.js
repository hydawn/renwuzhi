document.getElementById('file_input').addEventListener('change', on_file_input_change);

function on_file_input_change(event) {
  // Get the selected file from the input element
  const selectedFile = event.target.files[0];

  // Initialize a FileReader object
  const reader = new FileReader();

  // Define what happens when the file has been read
  reader.onload = on_file_load

  // Handle errors
  reader.onerror = function(error) {
    alert('错误，请联系这个软件的开发者，反正谁给你的这个软件你就找谁售后')
    console.log('Error reading file:', error);
  };

  reader.readAsBinaryString(selectedFile);
}
