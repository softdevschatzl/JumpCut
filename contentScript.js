function openLink(event) {
  const link = event.target.closest('.g').querySelector('a');
  if (link) {
    const snippet = event.target.innerText;
    const url = new URL(link.href)
    url.searchParams.append('highlight_snippet', snippet);
    window.open(url.href, '_blank');
  }
}

function highlightSnippets() {
    const snippetElements = document.querySelectorAll('.VwiC3b.yXK7lf.MUxGbd.yDYNvb.lyLwlc');
    snippetElements.forEach(element => {
      element.style.color = '#88c1ff';
      element.style.textDecoration = 'underline';
      element.style.cursor = 'pointer';

      element.addEventListener('click', openLink);

    const emElements = element.querySelectorAll('em');
    emElements.forEach(em => {
      em.style.color = '#88c1ff';
    });
    });
}
  
function waitForSearchResults() {
    if (document.querySelector('.VwiC3b.yXK7lf.MUxGbd.yDYNvb.lyLwlc')) {
      highlightSnippets();
      observeSearchResults();
    } else {
      setTimeout(waitForSearchResults, 500);
    }
}
  
function observeSearchResults() {
  const targetNode = document.querySelector('#search');
  if (targetNode) {
    const observer = new MutationObserver(() => {
      highlightSnippets();
    });

    observer.observe(targetNode, { childList: true, subtree: true });
  }
}
  
waitForSearchResults();
  