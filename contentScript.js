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

async function findTextAndScroll(encodedSnippetText, index) {
  const decodedSnippetText = decodeURIComponent(encodedSnippetText);

  // Wait for DOMContentLoaded event
  await new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });

  // Wait for additional time to allow dynamic content to load
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Adjust the waiting time as needed

  // Observe DOM changes and attempt to find and scroll to the text
  let found = false;
  const observer = new MutationObserver(() => {
    if (!found) {
      const elements = document.evaluate(`//*[contains(text(),"${decodedSnippetText}")]`, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

      if (elements.snapshotLength > 0) {
        found = true;
        observer.disconnect();

        const element = elements.snapshotItem(0);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });

  // Set a timeout to stop observing after a certain time if the text is not found
  setTimeout(() => {
    if (!found) {
      observer.disconnect();
      console.warn(`Text not found: ${decodedSnippetText}`);
    }
  }, 10000); // Adjust the timeout duration as needed
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findTextAndScroll') {
    findTextAndScroll(request.encodedSnippetText, request.index);
  }
});
