function openLink(event) {
  const link = event.target.closest('.g').querySelector('a');
  const snippetElement = event.target.closest('.VwiC3b.yXK7lf.MUxGbd.yDYNvb.lyLwlc');
  console.log("snippetElement: ", snippetElement);    // console log
  if (link && snippetElement) {
    const encodedSnippetText = encodeURIComponent(snippetElement.textContent);
    const index = Array.from(snippetElement.parentNode.children).indexOf(snippetElement);
    console.log("encodedSnippetText and index: ", encodedSnippetText, index);   // console log

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
    console.log("highlighted: ", highlighted);
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
      // Check if background script is available before sending message
      console.log('Connecting to background script');
      const port = chrome.runtime.connect({ name: 'contentScript' });
      port.postMessage({ action: 'highlightSnippets' });
    });

    observer.observe(targetNode, { childList: true, subtree: true });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrollToSnippet') {
    scrollToSnippet(message.encodedSnippetText, message.index);
  }
});

highlightSnippets();
observeSearchResults();
