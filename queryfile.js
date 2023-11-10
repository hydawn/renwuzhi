function get_file_url() {
  input_element = document.getElementById('url_input')
  const file_url = input_element.value;
  console.log('file url:', file_url);
  // document.getElementById('url_input_div').style.display = "none";
  process_file_url(file_url);
}
