chrome.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        const url = new URL(tab.url);
        const snippet = url.searchParams.get('highlight_sippet');
        if (snippet) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: (snippet) => {
                    window.find(snippet);
                },
                args: [snippet],
            });
        }
    }
});