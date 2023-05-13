// This file listens for messages from the openLink function
// and upon receiving that message, creates a new tab with the
// specified URL. After waiting for the tab to completely load,
// it sends a messages back to the contentScript with the action
// findTextAndScroll from the contentScript.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openLink') {
    chrome.tabs.create({ url: request.url }, (newTab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === newTab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(newTab.id, {
            action: 'findTextAndScroll',
            encodedSnippetText: request.encodedSnippetText,
            index: request.index,
          });
        }
      });
    });
  }
});
