function openLink(event) {
  const link = event.target.closest('.g').querySelector('a');
  const snippetElement = event.target.closest('.VwiC3b.yXK7lf.MUxGbd.yDYNvb.lyLwlc');
  if (link && snippetElement) {
    const encodedSnippetText = encodeURIComponent(snippetElement.innerText);
    chrome.runtime.sendMessage({
      action: 'openLink',
      url: link.href,
      encodedSnippetText,
    });
  }
}

function scrollToSnippet() {
  const bodyTextNodes = document.evaluate(
    '//body//text()[contains(.,"' + decodedSnippetText + '")]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  if (bodyTextNodes.snapshotLength > 0) {
    bodyTextNodes.snapshotItem(0).scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  