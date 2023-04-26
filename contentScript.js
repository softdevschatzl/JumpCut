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

function highlightElementByText(encodedSnippetText, index) {
  const decodedSnippetText = decodeURIComponent(encodedSnippetText);

  function findElementsWithText(text) {
    const elements = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function (node) {
          const normalizedText = node.textContent.replace(/\s+/g, " ").trim();
          if (normalizedText === text) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        },
      },
      false
    );

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      elements.push(currentNode);
    }
    return elements;
  }

  function highlightElement(element) {
    const highlightSpan = document.createElement("span");
    highlightSpan.style.backgroundColor = "yellow";
    highlightSpan.style.display = "inline";
    element.parentNode.insertBefore(highlightSpan, element);
    highlightSpan.appendChild(element);
  }

  const elementsWithText = findElementsWithText(decodedSnippetText);

  if (elementsWithText.length > index) {
    const targetElement = elementsWithText[index];
    highlightElement(targetElement);
  } else {
    console.warn(
      `No element found with the specified text and index: ${decodedSnippetText}, ${index}`
    );
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
  if (message.action === 'highlightElementByText') {
    highlightElementByText(message.encodedSnippetText, message.index);
  }
});

highlightSnippets();
observeSearchResults();
