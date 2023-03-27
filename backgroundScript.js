chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openLink') {
        const { url, encodedSnippetText } = request;
        chrome.tabs.create({ url }, (tab) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'scrollToSnippet',
                        encodedSnippetText,
                    });
                }
            });
        });
    }
});