chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openLink') {
        const { url, encodedSnippetText } = request;
        chrome.tabs.create({ url }, (tab) => {
            chrome.scripting.executrScript({
                func: eval('(' + request.injectScrollToSnippetScript.toString() + ')'),
                args: [encodeSnippetText],
            });
        });
    }
});