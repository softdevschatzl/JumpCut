function openLink(event) {
  const link = event.target.closest('.g').querySelector('a');
  const snippetElement = event.target.closest('.VwiC3b.yXK7lf.MUxGbd.yDYNvb.lyLwlc');
  if (link && snippetElement) {
    const encodedSnippetText = encodeURIComponent(snippetElement.innerText);
    chrome.storage.local.set({ encodedSnippetText }, () => {
      chrome.runtime.sendMessage({
        action: 'openLink',
        url: link.href
      });
    });
  }
}

function scrollToSnippet(encodedSnippetText) {
  const decodedSnippetText = decodeURIComponent(encodedSnippetText);
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrollToSnippet') {
    chrome.storage.local.get('encodedSnippetText', (data) => {
      if (data.encodedSnippetText) {
        scrollToSnippet(data.encodedSnippetText);
        chrome.storage.local.remove('encodedSnippetText');
      }
    });
  }
});


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

// Tried implementing a find function to find the snippet text in the webpage.
function customFind(encodedSnippetText) {
  const decodedSnippetText = decodeURIComponent(encodedSnippetText);
  const bodyTextNodes = document.evaluate(
    '//body//text()[contains(.,"' + decodedSnippetText + '")]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  if (bodyTextNodes.snapshotLength > 0) {
    const textNode = bodyTextNodes.snapshotItem(0);
    const snippetElem = textNode.parentElement;
    snippetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight the found snippet text
    const highlighted = document.createElement('mark');
    highlighted.style.backgroundColor = 'yellow';
    textNode.parentElement.replaceChild(highlighted, textNode);
    highlighted.appendChild(textNode);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrollToSnippet') {
    chrome.storage.local.get('encodedSnippetText', (data) => {
      if (data.encodedSnippetText) {
        customFind(data.encodedSnippetText);
        // Clear the stored encodedSnippetText to avoid using it for other pages
        chrome.storage.local.remove('encodedSnippetText');
      }
    });
  }
});
  
waitForSearchResults();
  