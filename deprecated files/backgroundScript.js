chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openLink') {
    console.log('received scrolltosnippet message:', request);
    const { url, encodedSnippetText } = request;
    console.log('encodedSnippetText:', encodedSnippetText);
    chrome.tabs.create({ url }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(tabId, { 
            action: 'scrollToSnippet',
            encodedSnippetText
          }, (response) => {
            console.log('Received scrollToSnippet response:', response);
          });
        }
      });
    });
  }
});
