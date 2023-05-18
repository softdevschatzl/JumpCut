// This file adds styling to Google search result snippets 
// (highlightSnippets) and upon observeResults,
// adds event listeners to those snippets for onClick to open
// that result in a new tab and send the message across tabs
// to run the findTextAndScroll function to attempt to
// locate the exact text that was in the snippet and 
// scroll the page down to it.

console.log("contentScript is running");    // console log

function openLink(event) {
  console.log("openLink is running");   // console log
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

// This is where the real meat and potatoes is.
async function findTextAndScroll(encodedSnippetText, index) {
  let decodedSnippetText = decodeURIComponent(encodedSnippetText);
  const sentences = decodedSnippetText.split('. ');

  // Attempting to remove date-like strings that appear in the snippet,
  // but do not appear in the text on the webpage.
  decodedSnippetText = decodedSnippetText.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+—/g, '');

  // Wait for DOMContentLoaded event.
  await new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });

  // Observe changes in the DOM and wait for elements to appear
  // to reduce unnecessary delays and ensure that all necessary
  // elements are loaded.
  await new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });

  // Observe DOM changes and attempt to find and scroll to the text.
  let found = false;
  const observer = new MutationObserver(() => {
    if (!found) {
      for (let sentence of sentences) {
        const elements = document.evaluate(`//*[contains(text(),"${sentence}")]`, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        if (elements.snapshotLength > 0) {
          found = true;
          observer.disconnect();

          const element = elements.snapshotItem(0);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          highlightElement(element);
          break;
        }
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });

  window.addEventListener('beforeunload', (event) => {
    observer.disconnect();
  });
}

function highlightElement(element) {
  element.style.backgroundColor = '#5ba9fd';
}

// Function that highlights the snippet text underneath the Google search result.
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

// Function to observe the search results ensuring efficiency of the search.
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

// Sends message to background.js for findTextAndScroll.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findTextAndScroll') {
    findTextAndScroll(request.encodedSnippetText, request.index);
  }
});
