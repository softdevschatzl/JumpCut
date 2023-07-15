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

// This is where the real meat and potatoes begins.
async function findTextAndScroll(encodedSnippetText) {
  let decodedSnippetText = decodeURIComponent(encodedSnippetText);
  const sentences = decodedSnippetText.split('. ');

  // Removing date-like strings that appear in the snippet, but not on the webpage.
  decodedSnippetText = decodedSnippetText.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+—/g, '');
  
  // Wait for DOMContent to be loaded.
  await new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });

  // Using a TreeWalker, observe DOM changes and attempt to find and scroll to the text.
  // By jumping from text node to text node in the body of the html, it should be simple
  // to locate the text. When found, it will highlight the parent node of the text and 
  // scroll to it.
  let found = false;
  const observer = new MutationObserver(() => {
    if (!found) {
      for (let sentence of sentences) {
        const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node = treeWalker.nextNode();
        while (node) {
          if (node.textContent.includes(sentence)) {
            found = true;
            observer.disconnect();

            node.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center'});

            highlightElement(node.parentNode);
            break
          }
          node = treeWalker.nextNode();
        }
        if (found) break;
        else {
          console.log("Text not found. Text: ", decodedSnippetText);
        }
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });

  window.addEventListener('beforeunload', (event) => {
    observe.disconnect();
  });
}

function highlightElement(element) {
  element.style.backgroundColor = '#5ba9fd';
  element.style.color = 'black'
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
