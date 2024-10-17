function download_pictures(raw_data, user_name_list) {
  // raw_data is a list of list
  for (i = 0; i < raw_data.length; i++) {
    // BUG: this is wrong, name is not necessary row[0]
    var name = user_name_list[i];
    var row = raw_data[i];

    // find content that starts with http
    urls = row.filter(i => i.match(/^https?:/));

    // fetch and zip -- how do I do that?
  }
}
