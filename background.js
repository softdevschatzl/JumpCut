chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openLink') {
      const { url, encodedSnippetText, index } = request;
  
      chrome.tabs.create({ url: url }, (tab) => {
        const scrollToSnippet = (encodedSnippetText, index) => {
          const decodedSnippetText = decodeURIComponent(encodedSnippetText);
          const bodyTextNodes = document.evaluate(
            '//body//text()[contains(.,"' + decodedSnippetText + '")]',
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );
  
          if (bodyTextNodes.snapshotLength > index) {
            const textNode = bodyTextNodes.snapshotItem(index);
            const snippetElem = textNode.parentElement;
            snippetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
            // Highlight the found snippet text
            const highlighted = document.createElement('mark');
            highlighted.style.backgroundColor = 'yellow';
            textNode.parentElement.replaceChild(highlighted, textNode);
            highlighted.appendChild(textNode);
          }
        };
  
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [encodedSnippetText, index],
          function: scrollToSnippet,
        });
      });
    }
  });
  