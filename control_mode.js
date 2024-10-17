const sbox = document.getElementById('simple-mode');
function applyHideHelp() {
  if (sbox.checked) {
    document.querySelectorAll('.help').forEach(i => i.classList.contains('hide') || i.classList.add('hide'))
  } else {
    document.querySelectorAll('.help').forEach(i => i.classList.contains('hide') && i.classList.remove('hide'))
  }
}
sbox.addEventListener('click', () => applyHideHelp());
// hide all help
document.addEventListener('DOMContentLoaded', () => {
  applyHideHelp();
  const observer = new MutationObserver(() => { console.log('dom changes on body observed!'); applyHideHelp(); });
  observer.observe(document.body, { childList: true, subtree: true });
});
// document.addEventListener('DOMContentChanged', () => applyHideHelp());
