function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['contentScript.js'],
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    (tab.url.startsWith('https://www.google.com/search') ||
      tab.url.startsWith('https://www.google.com/webhp'))
  ) {
    injectContentScript(tabId);
  }
});

console.log('background script running');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openLink') {
    const { url, encodedSnippetText, index } = request;

    chrome.tabs.create({ url: url }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              files: ['contentScript.js'],
            },
            () => {
              chrome.tabs.sendMessage(tab.id, {
                action: 'scrollToSnippet',
                encodedSnippetText: encodedSnippetText,
                index: index,
              });
            }
          );
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    });
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'contentScript') {
    port.onMessage.addListener((message) => {
      if (message.action === 'highlightSnippets') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          console.log('Sending message to tab:', tabs[0].id);
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'highlightSnippets',
          });
        });
      }
    });
  }
});
