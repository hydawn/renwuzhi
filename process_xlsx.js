// on xlsx file load
function on_file_load(event) {
  process_file_content(event.target.result);
}

function process_file_url(file_url) {
  // var url = "https://sheetjs.com/pres.xlsx"; // some url

  /* set up async GET request */
  console.log(`requesting file ${file_url}`)
  var req = new XMLHttpRequest();
  req.open("GET", file_url, true);
  req.responseType = "arraybuffer";

  req.onload = function(e) {
    process_xlsx_workbook(XLSX.read(req.response));
  };

  req.send();
}

function process_file_content(file_content) {
  process_xlsx_workbook(XLSX.read(file_content, {type: 'binary'}))
}

function workbook_to_raw_data(workbook) {
  // work on the first sheet
  const first_sheet = workbook.Sheets[workbook.SheetNames[0]]
  // this is funny
  // const table = XLSX.utils.sheet_to_html(worksheet);
  // setHTML(table);

  const raw_data = XLSX.utils.sheet_to_json(first_sheet, {header: 1});
  // const raw_html = XLSX.utils.sheet_to_html(first_sheet);
  // document.querySelector("p").innerHTML = JSON.stringify(raw_data, null, "\t");
  // document.querySelector("p").innerHTML = raw_html
  // console.log(raw_data);
  return raw_data
}

function start_transposition(raw_data, user_name_list, index_checked) {
  let after_traspo = [] // array of array
  let empty_result = ['', '(空)', null]
  for (let question_index of index_checked) {
    // now, gather answers from users
    let answer_list = []
    for (let user_index = 0; user_index < user_name_list.length; user_index++) {
      let user_answer = raw_data[1 + user_index][question_index]
      if (empty_result.includes(user_answer)) {
        continue
      }
      let user_name = user_name_list[user_index]
      answer_list.push(`${user_name}： ${user_answer}`)
    }
    let question = raw_data[0][question_index]
    after_traspo.push([question].concat(answer_list))
  }
  return after_traspo
}

function copy_input_text(id) {
  var input = document.getElementById(id);
  input.select();
  document.execCommand("copy");
}

function provide_copy_and_download(transpo_result_text) {
  // text result
  inner_html_list = [
    "<button onclick=\"copy_input_text('transposition_result_textarea')\">点击复制</button>",
    '<br>',
    '<textarea readonly id="transposition_result_textarea" rows="16" cols="48">',
    `${transpo_result_text}`,
    '</textarea>',
  ]
  // dangerous injection I know, but it wouldn't affect me
  document.getElementById('transposition_result_text_div').innerHTML = inner_html_list.join('');

  // Create a Blob from the text string
  const blob = new Blob([transpo_result_text], { type: 'text/plain' });
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  // Create a link element for the download
  const atag = document.createElement('a');
  atag.href = url;
  atag.download = 'result_file.txt'; // Specify the desired file name
  atag.appendChild(document.createTextNode('或者点击下载转换后的文件'))
  document.getElementById('transposition_result_file_div').appendChild(atag)
  // Simulate a click on the link to trigger the download
  //atag.click();

  // Release the URL when no longer needed
  // URL.revokeObjectURL(url);
}

function after_select_question_column_start_transposition(raw_data, user_name_list, index_checked) {
  console.log(`question selected:${index_checked.map(i => raw_data[0][i]).join('\n')}`)
  // let lookbehind = '想对'
  // let lookbahead = '说'
  // let html_prompt_list = [
  //   '接下来我要知道怎么从问题中提取人名',
  //   '比如，对于问题“你想对那谁谁说：”中，夹在“想对”和“说”之间的“那谁谁”',
  //   '就是我们想要提取的人名',
  //   '这里，我们管“那谁谁”之前的“想对”叫向后看，“说”叫向前看。',
  //   '于是，向前看和向后看都能看到的字符就是我们要提取的字符',
  //   '对于不符合以上规律的问题，比如“写一些感想吧”，将不处理，这个不用担心',
  //   '如果你的问题及其之眼花缭乱',
  //   '那算你会玩，自己转置吧',
  // ]
  // start transposition
  transposition_result = start_transposition(raw_data, user_name_list, index_checked)
  // present that to html and generate a file to download
  // generate a text area
  transpo_result_text = transposition_result.map(i => i.join('\n')).join('\n\n\n')
  provide_copy_and_download(transpo_result_text)

  // then, download pictures in batch if you want to
  // possible_picture_index = []
  epilog_list = [
    '好了，这就是全部的内容了，有什么建议或者需求都可以提给我（微信在最网页下面），心情好就给你实现!',
    '警告，不要在手机上尝试把复制的人物志转换内容粘贴到微信里面（我的手机，系统桌面直接卡死了，你也可以逝世）,',
    '请下载文件到本地',
  ]
  document.getElementById('html_selector_field').innerHTML = epilog_list.join('<br>')
}

function after_name_column_select_question_column(raw_data, index_checked) {
  console.log(`index ${index_checked} are checked`)
  if (index_checked.length != 1) {
    alert(`你选择了:\n${index_checked.map(i => raw_data[0][i]).join('\n')}\n这里有${index_checked.length}个问题都是问名字的，如果你选错了可以重选，如果你的问卷里真的问很多次名字，可能这个程序不适合你`)
    return
  }
  let ask_name_index = index_checked[0]
  let name_list = []
  for (let line of raw_data) {
    // remove the ask_name_index element
    name_list.push(line[ask_name_index])
    line.splice(ask_name_index, 1)
  }
  name_list.splice(0, 1) // remove the first element which is header
  console.log('after removing name:')
  console.log(raw_data)
  console.log('names are:')
  console.log(name_list)
  let html_prompt_list = [
    '好，在开始转换之前，还要知道哪些问题是“你想展现在人物志里的”，',
    '“你想展现在人物志里的”问题，比如，“你想对XXX说”，或者“这次旅途的感想”之类的',
    '你要把这些问题都勾选上（默认全部勾选）',
    '不过如果你问了“上传你的照片”/“旅途中的照片”这种问题，就不要勾选该问题',
    '照片的话，就算我给你下载了，你还是得一个一个粘贴到人物志里所以我觉得意义不大',
    '（或许意义不大吧，我没有排版人物志的经历，知道的朋友可以告诉我有没有这方面的需求，如果你不知道我是谁，我的联系方式在网页最下面）'
  ]

  html_selector(
    html_prompt_list.join('<br>'),
    raw_data[0],
    Array.from({ length: raw_data[0].length }, (_, index) => index),
    function(index_checked) {
      after_select_question_column_start_transposition(raw_data, name_list, index_checked)
    }
  )
}

function process_xlsx_workbook(workbook) {
  let raw_data = workbook_to_raw_data(workbook);

  let useless_header = ["序号", "提交答卷时间", "所用时间", "来源", "来源详情", "来自IP"]
  remove_useless_columns(raw_data, useless_header); // oh, pass by reference
  // remove the prefixing number and '、'
  raw_data[0] = raw_data[0].map(i => i.replace(/^\d+、/, ""))

  let html_prompt_list = [
    `我已经把 ${JSON.stringify(useless_header)} 的列都删掉了`,
    '接下来我们需要人工一下智能，因为我需要知道哪一列（虽然一般是第一列）',
    '请在如下选项中勾选询问填问卷者名字的那个问题，因为程序不识字，所以要你告诉我',
  ]
  html_selector(html_prompt_list.join('<br>'), raw_data[0], [0], function(index_checked){
    after_name_column_select_question_column(raw_data, index_checked);
  });
  // JSON.stringify(raw_data[0])
}

function remove_useless_columns(raw_data, useless_header) {
  header_list = raw_data[0]; // this is header
  // try to delete rows that is inside useless header
  var useless_column_count = 0;
  for (let header of header_list) {
    if (useless_header.includes(header)) {
      useless_column_count++;
    } else {
      break;
    }
  }

  // remove useless_columns
  for (let line of raw_data) {
    // remove the first useless_column_count of data
    line.splice(0, useless_column_count);
  }
  return raw_data
}

function present_choices(html_prompt, array_option, default_checked_index) {
  // var prompt_list = [html_prompt, '<form>', '<button id="checkButton">确定</button>']
  var prompt_list = [html_prompt, '<br>', '<button id="checkButton">确定</button><br>']
  for (let i = 0; i < array_option.length; i++) {
    let checked = ''
    if (default_checked_index.includes(i)) {
      checked = 'checked'
    }
    let breakline = ''
    if (i % 5 == 4) {
      breakline = '<br>'
    }
    prompt_list.push(`<label><input type="checkbox" value="${i}" ${checked}>${array_option[i]}</label>${breakline}`)
  }
  prompt_list.push('<br>')
  // prompt_list.push('</form>')
  document.getElementById('html_selector_field').innerHTML = prompt_list.join('\n')
}

// return a array if index telling me which element is selected,
// don't return element themselves, return index
function html_selector(html_prompt, array_option, default_checked_index, on_submit) {
  present_choices(html_prompt, array_option, default_checked_index)

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const checkButton = document.getElementById("checkButton");

  checkButton.addEventListener("click", function () {
    var index_checked = []
    checkboxes.forEach(function (checkbox) {
      if (checkbox.checked) {
        // console.log(checkbox.value + " is checked");
        index_checked.push(parseInt(checkbox.value, 10))
      }
    });
    on_submit(index_checked);
  });
}
