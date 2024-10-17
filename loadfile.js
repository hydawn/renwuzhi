document.getElementById("url_input").addEventListener("keydown", function(event) {
  // Check if the Enter key was pressed
  if (event.key === "Enter") {
    // Trigger the button click
    document.getElementById("urlOKButton").click();
  }
});

async function showElement(id) {
  const loading = document.getElementById(id);
  if (loading && loading.classList.contains('hide'))
    loading.classList.remove('hide');
}

async function hideElement(id) {
  const loading = document.getElementById(id);
  if (loading && !loading.classList.contains('hide'))
    loading.classList.add('hide');
}

function getFileUrl() {
  function checkUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      console.error(error);
      hideElement('downloading-from-url');
      alert("不你没贴好:" + error);
      return false;
    }
  }
  const input = document.getElementById('url_input')
  if (!input) {
    alert("bug出现: input element not rendered");
    return;
  }
  const file_url = input.value;
  if (!checkUrl(file_url))
    return;
  showElement('downloading-from-url');
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
    aerror(`错误：${error}`)
    console.log('Error reading file:', error);
  };

  reader.readAsArrayBuffer(selectedFile);
});
