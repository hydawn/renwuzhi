// TODO: 全选、反选、全不选 -- 没用的玩意儿

// on xlsx file load
function on_file_load(event) {
  console.log('file loaded')
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

function start_transposition(raw_data, user_name_list, question_index_checked, name_format_string) {
  let after_traspo = [] // array of array
  let empty_result = ['', '(空)', null]
  for (let question_index of question_index_checked) {
    // now, gather answers from users
    let answer_list = []
    for (let user_index = 0; user_index < user_name_list.length; user_index++) {
      let user_answer = raw_data[1 + user_index][question_index]
      if (empty_result.includes(user_answer)) {
        continue
      }
      let user_name = user_name_list[user_index]
      let name_prompt = name_format_string.replace(/名字/, user_name)
      answer_list.push(`${name_prompt}${user_answer}`)
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

function provide_copy_and_download(transpo_result_list) {
  // text result
  transpo_result_rich_text = transposition_result.map(i => i.join('<br>')).join('<br><br><br>')
  rich_text = [
    '<details id="rich_text_result">',
    '<summary><b>转换结果 -- 富文本（点击展开）</b></summary>',
    `${transpo_result_rich_text}`,
    '</details>',
  ]
  transpo_result_html = transposition_result.map(i => i.join('\n')).join('\n\n\n')
  transpo_result_pure_text = (new DOMParser()).parseFromString(transpo_result_html, 'text/html').body.textContent
  pure_text = [
    '<details>',
    '<summary><b>转换结果 -- 纯文本（点击展开）</b></summary>',
    "<button onclick=\"copy_input_text('transposition_result_textarea')\">点击复制</button>",
    '<br>',
    '<textarea readonly id="transposition_result_textarea" rows="16" cols="48">',
    `${transpo_result_pure_text}`,
    '</textarea>',
    '</details>',
  ]
  inner_html_list = rich_text.concat(pure_text)
  // dangerous injection I know, but it wouldn't affect me
  document.getElementById('transposition_result_text_div').innerHTML = inner_html_list.join('');

  // Create a Blob from the text string
  const blob = new Blob([transpo_result_pure_text], { type: 'text/plain' });
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  // Create a link element for the download
  const atag = document.createElement('a');
  atag.href = url;
  atag.download = 'result_file.txt'; // Specify the desired file name
  atag.appendChild(document.createTextNode('或者点击下载转换后的纯文本文件'))
  document.getElementById('transposition_result_file_div').appendChild(atag)
  // Simulate a click on the link to trigger the download
  //atag.click();

  // Release the URL when no longer needed
  // URL.revokeObjectURL(url);
}

// onclick handler to make checkboxes behave like single choice
function html_selector_single_select_onclick(clicked_checkbox) {
  const checkboxes = document.querySelectorAll('input[type="checkbox"][name="html_selector_options"]');
  checkboxes.forEach(function(checkbox) {
    if (checkbox !== clicked_checkbox) {
      checkbox.checked = false; // Uncheck other checkboxes
      // checkbox.style.display = 'block';
    }
  });
  // document.querySelectorAll('div[type="magic_type_seEx"]').forEach(function(div) { div.style.display = 'block'})
}

// var select_format_full_choice = false;
var select_format_full_choice = true;
function after_select_question_column_select_format_prompt(raw_data, user_name_list, question_index_checked) {
  let html_prompt_list = [
    // '这些选项是用来自定义输出的，请静下心来感受这些选项的意义',
    // '如果你没感受到也没关系，我经常看点子谜语人作者不讲人话最后什么也没看懂，很难说这人是不是故作高深',
    '选一个你想要的格式，或者在下面的输入框中自定义格式（预览功能还没做出来呢，“上一步”按钮也是）',
    '下面的格式中，所有的“名字”这两个字都会被替换成大家问卷中填写的名字',
    '转换后的<b>转换结果 -- 富文本</b>中你可以复制带格式的文字粘贴到秀米或者word中',
    '<details><summary>自定义格式 -- html富文本编辑小教程（点击展开）</summary>',
    '自定义格式也就是手打html，在文字左右添加tag就可以呈现出各种效果',
    '比如输入 <pre>&lt;b>名字&lt;/b>说：</pre> 就会最后呈现出把大家的名字加粗的效果：<b>名字</b>说：，b是bold的意思',
    '这里可以见到，“说”并没有被加粗，只有被<code>&lt;b></code>和<code>&lt;/b></code>包围住文字被加粗了',
    '“名字”这两个字在最终的输出中会被替换成大家提交的名字',
    '如果你用<code>&lt;i></code>和<code>&lt;/i></code>就会有斜体的效果：<i>名字</i>说： i是斜体italic，同理，u是下划线underline',
    '<code>b i u</code>之间也可以互相组合一层套一层，比如<pre>&lt;i>&lt;b>一些文字&lt;/b>&lt;/i></pre>效果就是：',
    '<i><b>一些文字</b></i>',
    '或者使用<code>&lt;span style="颜色设置写在双引号里面">需要上色的文字&lt;/span></code>可以活得更多自由度，你就不要管span是什么意思了span没有特别的意思',
    '比如使用<pre>&lt;span style="color:green;">名字&lt;/span>&lt;span style="color:rgb(214, 122, 127);background-color:#00a400;">说&lt;/span>：</pre> 就可以达到添加文字和背景颜色的效果：',
    ' <span style="color:green;">名字</span><span style="color:red;background-color:black;">说</span>：',
    '你可以把文中的green换成任何颜色，颜色(color)和背景颜色(background-color)可以是英文单词，也可以是各种格式的rgb',
    '关于颜色的更加详细的文档可以看<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color">这里</a>或者<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/background-color">背景色</a>',
    '注意这里面的冒号，尖括号，分号，双引号，斜线等字符全部都要是英文标点',
    '有兴趣的同学可以实验一下，没有兴趣的同学随便选一个格式直接点击下一步吧',
    '<small>别忘了（如果你想）输入冒号</small>',
    '</details>',
    '<small>无敌小天使什么是逗你玩的不要真的选了效果很不理想</small>',
  ]
  let choices = [ 'From 名字：' ]
  let default_choice = [0]
  if (select_format_full_choice) {
    choices = choices.concat([
      // 'From 名字：',
      '<b>名字</b>：',
      '来自你的<b>名字</b>无敌小天使📣', //  which is &#128227;
      '你的自定义格式：<input type="text" id="customInput" size="48" value="<span style=&quot;color:rebeccapurple;&quot;><b>名字</b></span>：">',
    ])
    default_choice = [1]
  }
  // hidden = choices.slice(1).map(i => `<div type="magic_type_seEx" style="hidden">${i}</div>`)
  html_selector(
    '<h3>选择输出姓名格式</h3>' + html_prompt_list.join('<br>'),
    choices.map(i => i + '<br>'),
    default_choice,
    'html_selector_single_select_onclick',
    function(index_checked) {
    // the last one, choices.length is special
    let name_format_string = '名字：'
    if (index_checked.length > 1) {
      alert(`这里只能选择一个选项，你选择了多个哟：${index_checked}，拥有自定义分布的自定义格式化输出暂时还不支持，重选吧`)
      return
    } else if (index_checked.length == 0) {
      alert('你不选我帮你选？')
      select_format_full_choice = true;
      after_select_question_column_select_format_prompt(raw_data, user_name_list, question_index_checked)
      return
    }
    if (choices.length == 1 || index_checked[0] != choices.length - 1) {
      name_format_string = choices[index_checked[0]]
    } else {
      var customInput = document.getElementById('customInput');
      console.log(`customInput is ${customInput.value}`)
      name_format_string = customInput.value
    }
    after_select_question_column_start_transposition(raw_data, user_name_list, question_index_checked, name_format_string)
  })
}

function after_select_question_column_start_transposition(raw_data, user_name_list, question_index_checked, name_format_string) {
  console.log(`question selected:${question_index_checked.map(i => raw_data[0][i]).join('\n')}`)
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
  transposition_result = start_transposition(raw_data, user_name_list, question_index_checked, name_format_string)
  // present that to html and generate a file to download
  // generate a text area
  // transpo_result_text = transposition_result.map(i => i.join('\n')).join('\n\n\n')
  provide_copy_and_download(transposition_result)

  // then, download pictures in batch if you want to
  // possible_picture_index = []
  epilog_list = [
    '好了，这就是全部的内容了，有什么建议或者需求都可以提给我（微信在最网页下面），心情好就给你实现!',
    '警告，不要在手机上尝试把复制的人物志转换内容粘贴到微信里面（我的手机，系统桌面直接卡死了，你也可以逝世）,',
    '如果你想保存富文本，可以直接按Ctrl-S用你的浏览器吧整个网页保存下来，以后该html文件在任何地方打开你都可以看见下面的富文本',
    '推荐大家检查一下转换后的文字，防bug',
  ]
  document.getElementById('html_selector_field').innerHTML = '<h3>转换结果</h3>' + epilog_list.join('<br>')
  document.getElementById('rich_text_tutorial').style.display = 'block'
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
    '<small>（或许意义不大吧，我没有排版人物志的经历，知道的朋友可以告诉我有没有这方面的需求，如果你不知道我是谁，我的联系方式在网页最下面）</small>'
  ]

  html_selector(
    html_prompt_list.join('<br>'),
    raw_data[0],
    Array.from({ length: raw_data[0].length }, (_, index) => index),
    '',
    function(index_checked) {
      // TODO: no index checked is not allowed!
      // after_select_question_column_start_transposition(raw_data, name_list, index_checked)
      after_select_question_column_select_format_prompt(raw_data, name_list, index_checked)
    }
  )
}

function process_xlsx_workbook(workbook) {
  let raw_data = workbook_to_raw_data(workbook);
  console.log('xlsx load completed, will not display import div again')

  let useless_header = ["序号", "提交答卷时间", "所用时间", "来源", "来源详情", "来自IP"]
  remove_useless_columns(raw_data, useless_header); // oh, pass by reference
  // remove the prefixing number and '、'
  raw_data[0] = raw_data[0].map(i => i.replace(/^\d+、/, ""))

  let html_prompt_list = [
    `我已经把 ${JSON.stringify(useless_header)} 的列都删掉了`,
    '接下来我们需要人工一下智能，因为我需要知道哪一列（虽然一般是第一列）',
    '请在如下选项中勾选询问填问卷者名字的那个问题，因为程序不识字，所以要你告诉我',
  ]
  html_selector(
    '<h3>选择姓名列</h3>' + html_prompt_list.join('<br>'),
    raw_data[0], [0], '', function(index_checked) {
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

// might be a stupid choice to insert function names
function present_choices(html_prompt, array_option, default_checked_index, on_click_func_name) {
  // var prompt_list = [html_prompt, '<form>', '<button id="checkButton">确定</button>']
  var prompt_list = [html_prompt, '<br>', '<button id="checkButton">确定/下一步</button><br>']
  for (let i = 0; i < array_option.length; i++) {
    let checked = ''
    if (default_checked_index.includes(i)) {
      checked = 'checked'
    }
    let breakline = ''
    if (i % 5 == 4) {
      breakline = '<br>'
    }
    let on_click = `onclick="${on_click_func_name}(this)"`
    if (on_click_func_name.length == 0) {
      on_click = ''
    }
    prompt_list.push(`<label><input type="checkbox" name="html_selector_options" value="${i}" ${on_click} ${checked}>${array_option[i]}</label>${breakline}`)
  }
  prompt_list.push('<br>')
  // prompt_list.push('</form>')
  document.getElementById('html_selector_field').innerHTML = prompt_list.join('\n')
}

// return a array if index telling me which element is selected,
// don't return element themselves, return index
function html_selector(html_prompt, array_option, default_checked_index, on_click_func_name, on_submit) {
  present_choices(html_prompt, array_option, default_checked_index, on_click_func_name)

  const checkboxes = document.querySelectorAll('input[type="checkbox"][name="html_selector_options"]');
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
