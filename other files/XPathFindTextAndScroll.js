// Made this file to help with comparing different methods of search.
// Here I use an XPath expression to create an easier string to locate.

// This is a helper function to create the XPath expression to make things simpler and allow
// for all types of punctuation by splitting and rejoining the strings at these characters.
function createXPathExpression(text) {
    // Split each part at a quote character.
    let parts = text.split(/(['"])/);
    let quoteParts = [];
    for (let i = 0; i < parts.length; i++) {
        // Wrap each part in the opposite quote character.
        if (i % 2 === 0) quoteParts.push(`"${parts[i]}"`);
        else quoteParts.push(`'${parts[i]}'`);
    }
    // Join the parts of the string with ','.
    const joinedParts = quoteParts.join(',');
    
    return `//text()[contains(., concat(${joinedParts}))]`;
  }
  
  // This is the main function used to locate text within a webpage.
  async function findTextAndScroll(encodedSnippetText, index) {
    let decodedSnippetText = decodeURIComponent(encodedSnippetText);
    const sentences = decodedSnippetText.split('. ');
  
    // Attempting to remove date-like strings that appear in the snippet,
    // and do not appear in the text on the webpage.
    decodedSnippetText = decodedSnippetText.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+—/g, '');
  
    // Wait for DOMContentLoaded event.
    await new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  
    // Observe changes in the DOM and wait for elements to appear
    // to reduce unnecessary delays and ensure that all necessary
    // elements are loaded.
    await new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  
    // Observe DOM changes and attempt to find and scroll to the text.
    let found = false;
    const observer = new MutationObserver(() => {
      if (!found) {
        for (let sentence of sentences) {
          let xPathExpression = createXPathExpression(sentence);
  
          const elements = document.evaluate(xPathExpression, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  
          if (elements.snapshotLength > 0) {
            found = true;
            observer.disconnect();
  
            const element = elements.snapshotItem(0).parentNode;
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
            highlightElement(element);
            break;
          } else {
            console.log("Text not found. Text: ", decodedSnippetText);
          }
        }
      }
    });
  
    observer.observe(document, { childList: true, subtree: true });
  
    window.addEventListener('beforeunload', (event) => {
      observer.disconnect();
    });
  }
  