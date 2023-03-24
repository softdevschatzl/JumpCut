function highlightSnippets() {
    const snippetElements = document.querySelectorAll('.VwiC3b.yXK7lf.MUxGbd.yDYNvb.lyLwlc');
    snippetElements.forEach(element => {
      element.style.color = '#88c1ff';

    const emElements = element.querySelectorAll('em');
    emElements.forEach(em => {
      em.style.color = '#88c1ff';
    });
    });
  }
  
  function waitForSearchResults() {
    if (document.querySelector('.VwiC3b.yXK7lf.MUxGbd.yDYNvb.lyLwlc')) {
      highlightSnippets();
      observeSearchResults();
    } else {
      setTimeout(waitForSearchResults, 500);
    }
  }
  
  function observeSearchResults() {
    const targetNode = document.querySelector('#search');
    if (targetNode) {
      const observer = new MutationObserver(() => {
        highlightSnippets();
      });
  
      observer.observe(targetNode, { childList: true, subtree: true });
    }
  }
  
  waitForSearchResults();
  