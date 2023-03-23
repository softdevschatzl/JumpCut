function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
  }
  
  function scrollToSnippet(snippet) {
    const query = snippet.split(' ').map(escapeRegExp).join('\\s+');
    const regex = new RegExp(query, 'i');
    const elements = document.getElementsByTagName('*');
  
    for (let i = 0; i < elements.length; i++) {
      if (regex.test(elements[i].innerText)) {
        elements[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  }
  
  function createSnippetLink(snippet) {
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = '[Scroll to Snippet]';
    link.style.marginLeft = '10px';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToSnippet(snippet);
    });
    return link;
  }
  
  function attachSnippetLinks() {
    const searchResults = document.querySelectorAll('.g .rc');
    searchResults.forEach((result) => {
      const snippet = result.querySelector('.st');
      if (!snippet) return;
      const snippetLink = createSnippetLink(snippet.innerText);
      snippet.appendChild(snippetLink);
    });
  }
  
  if (window.location.href.includes('www.google.com/search')) {
    attachSnippetLinks();
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrollToSnippet') {
      scrollToSnippet(request.snippet);
    }
  });
  