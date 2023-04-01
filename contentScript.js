function openLink(event) {
  const link = event.target.closest('.g').querySelector('a');
  const snippetElement = event.target.closest('.VwiC3b.yXK7lf.MUxGbd.yDYNvb.lyLwlc');
  if (link && snippetElement) {
    const encodedSnippetText = encodeURIComponent(snippetElement.innerText);
    const index = Array.from(snippetElement.parentNode.children).indexOf(snippetElement);

    chrome.runtime.sendMessage({
      action: 'openLink',
      url: link.href,
      encodedSnippetText: encodedSnippetText,
      index: index,
    });
  }
}

function scrollToSnippet(encodedSnippetText, index) {
  const decodedSnippetText = decodeURIComponent(encodedSnippetText);
  const bodyTextNodes = document.evaluate(
    '//body//text()[contains(.,"' + decodedSnippetText + '")]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  if (bodyTextNodes.snapshotLength > index) {
    const textNode = bodyTextNodes.snapshotItem(index);
    const snippetElem = textNode.parentElement;
    snippetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight the found snippet text
    const highlighted = document.createElement('mark');
    highlighted.style.backgroundColor = 'yellow';
    textNode.parentElement.replaceChild(highlighted, textNode);
    highlighted.appendChild(textNode);
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

function observeSearchResults() {
  const targetNode = document.querySelector('#search');
  if (targetNode) {
    const observer = new MutationObserver(() => {
      highlightSnippets();
    });

    observer.observe(targetNode, { childList: true, subtree: true });
  }
}

highlightSnippets();
observeSearchResults();
