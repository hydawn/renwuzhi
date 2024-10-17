document.getElementById("url_input").addEventListener("keydown", function(event) {
  // Check if the Enter key was pressed
  if (event.key === "Enter") {
    // Trigger the button click
    document.getElementById("urlOKButton").click();
  }
});

function getFileUrl() {
  function checkUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      console.error(error);
      alert("不你没贴好:" + error);
      return false;
    }
  }
  const input = document.getElementById('url_input')
  if (!input)
    return;
  const file_url = input.value;
  if (!checkUrl(file_url)) {
    return
  }
  console.log('file url:', file_url);
  process_file_url(file_url);
}

document.getElementById('file_input').addEventListener('change', function(event) {
  // Get the selected file from the input element
  const selectedFile = event.target.files[0];

  // Initialize a FileReader object
  const reader = new FileReader();

  // Define what happens when the file has been read
  reader.onload = onFileLoad

  // Handle errors
  reader.onerror = function(error) {
    alert('错误，请联系这个软件的开发者，反正谁给你的这个软件你就找谁售后')
    console.log('Error reading file:', error);
  };

  reader.readAsArrayBuffer(selectedFile);
});
