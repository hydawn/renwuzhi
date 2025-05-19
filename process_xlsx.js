// TODO: 全选、反选、全不选 -- 没用的玩意儿
// TODO: Q&A: 如果没填 如果填了好多次

// transpo result: list of {question, answer_list} (section)
// answer_list: list of { name_prompt, answer, name }
// var select_format_full_choice = false;
var select_format_full_choice = true;

function setHTML(id, html) {
  const element = document.getElementById(id)
  if (element !== null)
    element.innerHTML = html
  else
    alert(`${id} not found! ${typeof element} ${element}`)
}

function setText(id, text) {
  const element = document.getElementById(id)
  if (element !== null)
    element.innerText = text;
  else
    alert(`${id} not found! ${typeof element} ${element}`)
}

// on xlsx file load
function onFileLoad(event) {
  console.log('file loaded');
  process_file_content(event.target.result);
}

function process_file_url(file_url) {
  console.log(`requesting file ${file_url}`)
  // why I'm not using fetch?
  const request = new XMLHttpRequest();
  request.open("GET", file_url, true);
  request.responseType = "arraybuffer";

  request.onload = (_) => {
    parseXlsx(request.response, "sheet1").then(table => process_xlsx_workbook(table));
  };

  request.send();
}

//let filec = null;
// async function process_file_content(file_content) {
function process_file_content(file_content) {
  parseXlsx(file_content, "sheet1").then(table => process_xlsx_workbook(table));
}

//async function workbook_to_raw_data(workbook) {
//  // work on the first sheet
//  const first_sheet = workbook.Sheets[workbook.SheetNames[0]]
//
//  var sheet_range = first_sheet['!ref']
//  const sheet_row_match = sheet_range.match(/[\d]+$/)
//  if (!sheet_row_match) {
//    alert(`解析表格范围失败 [${sheet_range}]`);
//    return null;
//  }
//  const sheet_row = parseInt(sheet_row_match[0])
//  to_json_args = {header: 1}
//  const max_len = 300
//  // sometimes is very slow and takes up a ton of memory because sheet row is
//  // way too big (like 1048576)
//  // because you deleted some rows in the file
//  if (sheet_row > max_len) {
//    sheet_range = sheet_range.replace(/[\d]+$/, max_len)
//    console.log(`表格行(${sheet_row})大于${max_len}，一般是你手动删除了表格文件某几行导致的，手动缩减为${max_len}，表格范围变为${sheet_range}。如果之后一切正常，你可以忽视此次警告`)
//    to_json_args = {header: 1, range: sheet_range}
//  }
//
//  // console.log(`${Date()}: transform workbook to json`)
//  var raw_data = (await getXLSX()).utils.sheet_to_json(first_sheet, to_json_args)
//  console.log(`${Date()}: transform workbook to json, got: [${raw_data.length} lines]`)
//  raw_data = raw_data.filter(i => i.length != 0)
//  console.log(`${Date()}: remove undefined lines, got: [${raw_data.length} lines]`)
//  return raw_data
//}

function start_transposition(raw_data, user_name_list, question_index_checked, name_format_string) {
  let after_traspo = [] // array of object
  const empty_result = ['', '(空)', null]
  function escape_html_string(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
  for (const question_index of question_index_checked) {
    // now, gather answers from users
    let answer_list = []
    // "no-dup" -- good, push
    // "same" -- there is dup, but they are exactly the same, so, don't push a new one
    // "different" -- there is a dup, and they are not the same, alert the user what to do?
    function check_dup(line) {
      for (const oldline of answer_list) {
        if (line.name == oldline.name) {
          // they are of the same person's
          if (line.answer == oldline.answer) {
            return "same";
          } else {
            return "different";
          }
        }
      }
      return "no-dup";
    }
    const question = raw_data[0][question_index];
    for (let user_index = 0; user_index < user_name_list.length; user_index++) {
      let user_answer = raw_data[1 + user_index][question_index]
      if (empty_result.includes(user_answer)) {
        // if user gives empty answer
        continue
      }
      const user_name = user_name_list[user_index]
      // now, what if there are duplicates in the answer list
      // if the same, do nothing, if not, alert the user
      const answer = {
        name_prompt: name_format_string.replace(/名字/, user_name),
        answer: escape_html_string(user_answer),
        name: user_name
      };
      const dup_result = check_dup(answer);
      if (dup_result == "same")
        continue
      if (dup_result == "different" && question_isabout_picture(question) == false)
        alert(`警告："${user_name}"至少给"${question}"写了至少两个不同的回答，问问${user_name}是把所有回答全贴上去，还是选取其中某一/几个，这里默认把多个回答都贴上去了`);
      answer_list.push(answer)
    }
    after_traspo.push({ question: question, answer_list: answer_list })
  }
  return after_traspo
}

// let paragraph = null;
function copy_inner_text(id) {
  const paragraph = document.getElementById(id);
  if (!paragraph) {
    alert('failed to copy text');
    return;
  }
  // NOTE: don't use innerHTML for it can't handle <> correctly
  navigator.clipboard.writeText(paragraph.innerText)
  .then(() => {
    console.log('Text copied to clipboard');
  })
  .catch(err => {
    alert(`failed to copy text: ${err}`);
    console.error('Failed to copy text: ', err);
  });
}

function puretext_html(html_text) {
  return (new DOMParser()).parseFromString(html_text, 'text/html').body.textContent
}

function create_pure_text_html(result) {
  // result is a list of list of list
  // create pure_text with controls
  function create_html_structure(section, para_index) {
    // create copy except for the first one
    if (section.answer_list.length == 0) {
      alert(`没有一个人给${section.question}写人物志，领压别忘了处理`)
      console.log(`没有一个人给${section.question}写人物志，领压别忘了处理`)
      return ''
    }
    const paraid = `pid_${para_index}`
    const para_headid = `phid_${para_index}`
    const paragraph_header = `<div id="${para_headid}"></div><button onclick="copy_inner_text('${paraid}')">点击复制这一段</button>`
    const paragraph = `<div id="${paraid}">` + section.answer_list.map((_, index) => `<div id=${paraid}_${index}></div>`).join('') + '</div>';
    return '<div class="paragraph">' + paragraph_header + paragraph + '</div>'
  }
  function create_text(section, para_index) {
    if (section.answer_list.length == 0)
      return
    const paraid = `pid_${para_index}`
    const para_headid = `phid_${para_index}`
    setText(para_headid, section.question)
    section.answer_list.map((i, index) => {
      setText(`${paraid}_${index}`, puretext_html(i.name_prompt + i.answer))
    })
  }
  const structure = result.map((result, index) => create_html_structure(result, index))
  setHTML('pure_text_result', structure.join(''))
  result.map((result, index) => create_text(result, index))
}

function question_isabout_picture(question) {
  return question.includes('图片') || question.includes('照片') || question.includes('相片') || question.includes('个人照');
}

function question_mightabout_picture(question) {
  return question.includes('图') || question.includes('照') || question.includes('相') || question.includes('片');
}

function section_is_picture(section) {
  console.log('for section, check if this is picture')
  function str_is_picture_url(str) {
    let picture_substr = [ '.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.webp', '.WEBP' ];
    for (const substr of picture_substr)
      if (str.includes(substr))
        return true;
  }
  function count_urls() {
    let https_counter = 0;
    let picture_counter = 0;
    const answer_number = section.answer_list.length;
    if (answer_number <= 0)
      return [0, 0];

    for (const line of section.answer_list) {
      if (line.answer.includes('https:/'))
        https_counter++;
      if (str_is_picture_url(line.answer))
        picture_counter++;
    }
    console.log(`got answers ${answer_number} and count includes https ${https_counter}, include picture ${picture_counter}`)

    url_stat = 0;
    if (https_counter == answer_number) {
      console.log(`${https_counter} out of ${answer_number} have https in it`);
      url_stat = 2;
    } else if (https_counter > (answer_number / 2)) {
      console.log(`${https_counter} out of ${answer_number} have https in it`);
      url_stat = 1;
    }

    pic_stat = 0;
    if (picture_counter == answer_number) {
      console.log('all pictures');
      pic_stat = 2;
    } else if (picture_counter > (answer_number / 2)) {
      console.log('mostly pictures');
      pic_stat = 1;
    }

    return [url_stat, pic_stat];
  }
  line_stat = count_urls();
  function mostly_urls() { return line_stat[0] >= 1; }
  function all_urls() { return line_stat[0] >= 2; }
  function all_pics() { return line_stat[1] >= 2; }
  function mostly_pics() { return line_stat[1] >= 1; }
  if (question_isabout_picture(section.question) && mostly_urls())
    return true;
  if (question_mightabout_picture(section.question) && (all_urls() || mostly_pics()))
    return true;
  if (all_urls() && all_pics())
    return true;
  return false;
}

function setup_rich_reverse() {
  const rich_button = document.getElementById('reverse-color-button');
  const rich_result = document.getElementById('rich_text_result');
  if (rich_button == "null") {
    console.log('rich button component is null');
    return;
  }
  if (rich_result == "null") {
    console.log('rich result component is null');
    return;
  }
  rich_button.addEventListener('click', () => {
    console.log(`clicked with ${rich_button.checked}`);
    if (rich_button.checked) {
      rich_result.classList.contains('color-reversed') || rich_result.classList.add('color-reversed');
    } else {
      rich_result.classList.contains('color-reversed') && rich_result.classList.remove('color-reversed');
    }
  });
}

function result_to_text(result_list, line_break) {
  return result_list.map(
    section => section.question + line_break + section.answer_list.map(
      i => i.name_prompt + i.answer
    ).join(line_break)
  ).join(`${line_break}${line_break}${line_break}`)
}

function generate_html_result(result_list) {
  create_pure_text_html(result_list)
  const result_rich_text = result_to_text(result_list, '<br>')
  // this is fine because < is escaped
  setHTML('rich_text_result', result_rich_text)
  setup_rich_reverse()
  showElement('text_section')
}

// return a html
function draw_pictures(section) {
  const html_content = section.answer_list.map(i => [
    '<div class="picture">',
    `${i.name}照片&darr; &#x2193;<br/>`,
    `<img crossorigin="anonymous" src="${i.answer}" class="user-picture" name="${i.name}" alt="${i.answer}" loading="lazy" /><br/>`,
    '</div>',
  ].join('')).join('')
  console.log('draw:')
  console.log(section)
  setHTML('picture_result_question', section.question)
  setHTML('gallery', html_content)
  showElement('picture_section')
}

function present_html_result(result_list) {
  // dangerous injection I know, but it wouldn't affect me hahahahaha
  // 1. see if in result list, there is a picture section
  for (let index = 0; index < result_list.length; index++) {
    const section = result_list[index]
    if (section_is_picture(section)) {
      // deal with result picture
      const c = (i,a) => {return a.slice(0,i).concat(a.slice(i+1))}
      draw_pictures(section)
      generate_html_result(c(index, result_list))
      return
    }
  }

  // result with no picture
  generate_html_result(result_list);
}

function provide_download(result_list) {
  // Create a Blob from the text string
  const blob = new Blob([puretext_html(result_to_text(result_list, '\n'))], { type: 'text/plain' });
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  // Create a link element for the download
  const atag = document.createElement('a');
  atag.href = url;
  atag.download = 'result_file.txt'; // Specify the desired file name
  atag.appendChild(document.createTextNode('或者点击下载转换后的纯文本文件'));
  document.getElementById('file_section').appendChild(atag);
  // Simulate a click on the link to trigger the download
  //atag.click();

  // Release the URL when no longer needed
  // URL.revokeObjectURL(url);
}

function provide_copy_and_download(transposition_result_list) {
  console.log('transpo result list:');
  console.log(transposition_result_list);
  present_html_result(transposition_result_list);
  provide_download(transposition_result_list);
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

function after_select_question_column_select_format_prompt(raw_data, user_name_list, question_index_checked) {
  let html_prompt_list = [
    // '这些选项是用来自定义输出的，请静下心来感受这些选项的意义',
    // '如果你没感受到也没关系，我经常看点子谜语人作者不讲人话最后什么也没看懂，很难说这人是不是故作高深',
    '除非你真的很感兴趣，否则不要看下面的教程，直接点击下一步就行了',
    '<details><summary>自定义格式 -- html富文本编辑小教程（点击展开）</summary>',
    '选一个你想要的格式，或者在下面的输入框中自定义格式（预览功能还没做出来呢，“上一步”按钮也是）',
    '下面的格式中，所有的“名字”这两个字都会被替换成大家问卷中填写的名字',
    '转换后的<b>转换结果 -- 富文本</b>中你可以复制带格式的文字粘贴到秀米或者word中',
    '其默认格式是黑底白字因为登协现在的人物志模板是黑底白字，你可以在该页面中通过反选“反色”消除黑底白字效果',
    '实际上秀米的带格式粘贴容易出问题，所以默认的粘贴模式都是纯文本粘贴，不想折腾的就别折腾了，老实复制粘贴吧',
    '自定义格式也就是手打html，在文字左右添加tag就可以呈现出各种效果',
    '比如输入 <pre>&lt;b>名字&lt;/b>说：</pre> 就会最后呈现出把大家的名字加粗的效果：<b>名字</b>说：，b是bold的意思',
    '这里可以见到，“说”并没有被加粗，只有被<code>&lt;b></code>和<code>&lt;/b></code>包围住的文字被加粗了',
    '如果你用<code>&lt;i></code>和<code>&lt;/i></code>就会有斜体的效果：<i>名字</i>说： i是斜体italic，同理，u是下划线underline',
    '<code>b i u</code>之间也可以互相组合一层套一层，比如<pre>&lt;i>&lt;b>一些文字&lt;/b>&lt;/i></pre>效果就是：',
    '<i><b>一些文字</b></i>',
    '或者使用<code>&lt;span style="颜色设置写在双引号里面">需要上色的文字&lt;/span></code>可以活得更多自由度，你就不要管span是什么意思了span没有特别的意思',
    '比如使用<pre>&lt;span style="color:green;">名字&lt;/span>&lt;span style="color:rgb(214, 122, 127);background-color:#00a400;">说&lt;/span>：</pre> 就可以达到添加文字和背景颜色的效果：',
    ' <span style="color:green;">名字</span><span style="color:red;background-color:black;">说</span>：',
    '你可以把文中的green换成任何颜色，颜色(color)和背景颜色(background-color)可以是英文单词，也可以是各种格式的rgb',
    '关于颜色的更加详细的文档可以看<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color">这里</a>或者<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/background-color">背景色</a>',
    '注意这里面的冒号，尖括号，分号，双引号，斜线等字符全部都要是英文标点',
    '有兴趣的同学可以实验一下',
    '<small>别忘了输入冒号（如果你想的话）</small>',
    '</details>',
    '<small>无敌小天使什么是逗你玩的不要真的选了效果很不理想</small>',
  ]
  let choices = [ 'From 名字：' ]
  let default_choice = [1]
  if (select_format_full_choice) {
    choices = choices.concat([
      '<b>From 名字：</b>',
      '名字：',
      '来自你的名字无敌小天使📣', //  which is &#128227;
      '你的自定义格式：<input type="text" id="customInput" size="48" value="<span style=&quot;color:rebeccapurple;&quot;><b>名字</b></span>：">',
    ])
    // default_choice = [1]
  }
  // hidden = choices.slice(1).map(i => `<div type="magic_type_seEx" style="hidden">${i}</div>`)
  html_selector(
    '选择输出姓名格式',
    html_prompt_list.join('<br>'),
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
      const customInput = document.getElementById('customInput');
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
  const transposition_result = start_transposition(raw_data, user_name_list, question_index_checked, name_format_string)
  // present that to html and generate a file to download
  // generate a text area
  // transpo_result_text = transposition_result.map(i => i.join('\n')).join('\n\n\n')
  provide_copy_and_download(transposition_result)

  // TODO: then, download pictures in batch if you want to
  // possible_picture_index = []
  const epilog_list = [
    '好了，这就是全部的内容了，有什么建议或者需求都可以提给我（微信在最网页下面），心情好就给你实现!',
    '警告，不要在手机上尝试把复制的人物志转换内容粘贴到微信里面（我的手机，系统桌面直接卡死了，你也可以逝世）,',
    '如果你想保存富文本，可以直接按Ctrl-S用你的浏览器把整个网页保存下来，以后该html文件在任何地方打开你都可以看见下面的富文本',
    '推荐大家检查一下转换后的文字，防bug',
  ]
  // clear the last list
  hideElement('html_selector_list')
  setText('prompt_title', '转换结果')
  setHTML('prompt_body', epilog_list.join('<br>'))
  showElement('rich_text_tutorial')
  // document.getElementById().style.display = 'block';
  setText('main-title', '转换完成！')
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
  const html_prompt_list = [
    '好，在开始转换之前，还要知道哪些问题是“你想展现在人物志里的”，',
    '“你想展现在人物志里的”问题，比如，“你想对XXX说”，或者“这次旅途的感想”之类的',
    '你要把这些问题都勾选上（默认全部勾选）',
    '不过如果你问了“上传你的照片”/“旅途中的照片”这种问题，就不要勾选该问题',
    '照片的话，就算我给你下载了，你还是得一个一个粘贴到人物志里所以我觉得意义不大',
    '<small>（或许意义不大吧，我没有排版人物志的经历，知道的朋友可以告诉我有没有这方面的需求，如果你不知道我是谁，我的联系方式在网页最下面）</small>'
  ]

  html_selector(
    '选择转换问题',
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

function findMaxLength(table) {
  if (table.length == 0)
    return 0;
  let max = table[0].length;
  for (const row of table)
    if (row.length > max)
      max = row.length;
  return max;
}

function checkTableSquare(table) {
  const len = findMaxLength(table);
  for (const row of table)
    if (row.length != len)
      return false;
  return true;
}

function preprocess_table(table) {
  console.log('xlsx load completed');
  console.log(table);
  let new_table = table.filter(row => row.length > 0);
  if (!checkTableSquare(new_table)) {
    alert("xlsx格式错误：行宽度不同一。最好不要改动xlsx文件，直接上传这里");
    return [];
  }
  return new_table;
}

//async function process_xlsx_workbook(workbook) {
// raw_data is an array of array
async function process_xlsx_workbook(raw_data) {
  // if this is called, then xlsx must be loaded
  //let table = await workbook_to_raw_data(workbook);
  raw_data = preprocess_table(raw_data);
  console.log(raw_data)
  console.log(raw_data.length)
  console.log(raw_data[0])
  if (0 == raw_data.length)
    return;
  hideElement('import_file_details')

  const useless_header = ["序号", "提交答卷时间", "所用时间", "来源", "来源详情", "来自IP"]
  remove_useless_columns(raw_data, useless_header); // oh, pass by reference
  // remove the prefixing number and '、'
  raw_data[0] = raw_data[0].map(i => i.replace(/^\d+、/, ""))

  let html_prompt_list = [
    `我已经把 ${JSON.stringify(useless_header)} 的列都删掉了`,
    '接下来我们需要人工一下智能，因为我需要知道哪一列（虽然一般是第一列）',
    '请在如下选项中勾选询问填问卷者名字的那个问题，因为程序不识字，所以要你告诉我',
  ]
  const default_choice = [0];
  function on_submit(index_checked) {
    after_name_column_select_question_column(raw_data, index_checked);
  }
  html_selector(
    '选择姓名列',
    html_prompt_list.join('<br>'),
    raw_data[0], default_choice, '', on_submit
  );
}

function remove_useless_columns(raw_data, useless_header) {
  console.log(raw_data.length)
  const header_list = raw_data[0]; // this is header
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
function present_choices(prompt_title, prompt_body, array_option, default_checked_index, on_click_func_name) {
  var prompt_list = ['<button id="checkButton">确定/下一步</button><br>']
  for (let i = 0; i < array_option.length; i++) {
    const checked = default_checked_index.includes(i) ? 'checked' : '';
    const breakline = (i % 5 == 4) ? '<br/>' : '';
    const on_click = (on_click_func_name.length == 0) ? '' : `onclick="${on_click_func_name}(this)"`
    prompt_list.push([
      '<label>',
      `<input type="checkbox" name="html_selector_options" value="${i}" ${on_click} ${checked}>`,
      array_option[i],
      `</label>${breakline}`
    ].join(''))
  }
  prompt_list.push('<br>')
  // prompt_list.push('</form>')
  setHTML('prompt_title', prompt_title)
  setHTML('prompt_body', prompt_body)
  setHTML('html_selector_list', prompt_list.join('\n'))
}

// return a array if index telling me which element is selected,
// don't return element themselves, return index
function html_selector(prompt_title, prompt_body, array_option, default_checked_index, on_click_func_name, on_submit) {
  // however, in through mode, just went all the way through!
  if (through_mode()) {
    on_submit(default_checked_index);
    return;
  }

  present_choices(prompt_title, prompt_body, array_option, default_checked_index, on_click_func_name)

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
