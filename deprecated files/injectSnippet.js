const encodedSnippetText = decodeURIComponent('%ENCODED_SNIPPET_TEXT%');

function scrollToSnippet() {
    const bodyTextNodes = document.evaluate('//body//text()[contains(.,"' + encodedSnippetText + '")]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
    );
    console.log('bodyTextNodes:', bodyTextNodes);

    if (bodyTextNodes.snapshotLength > 0) {
        const textNode = bodyTextNodes.snapshotItem(0);
        const snippetElem = textNode.parentElement;
        snippetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

scrollToSnippet();