// Get the highlighted snippet text element
let snippet = document.getElementById('snippet');

// Get all the search result elements on the page
let searchResults = document.querySelectorAll('div.g');

// Loop through each search result element and highlight its corresponding snippet text
searchResults.forEach(function(searchResult) {
  // Get the snippet text element for the current search result
  let currentSnippet = searchResult.querySelector('div.IsZvec');

  // If the current search result has a snippet text element, highlight it and add a click event listener
  if (currentSnippet) {
    // Highlight the snippet text in yellow
    currentSnippet.style.backgroundColor = 'yellow';
    currentSnippet.style.cursor = 'pointer';

    // Add a click event listener to the snippet text element
    currentSnippet.addEventListener('click', function() {
      // Get the search result link element and its href attribute
      let link = searchResult.querySelector('a');
      let href = link.getAttribute('href');

      // Open a new tab with the search result link and scroll to the position of the snippet text
      chrome.tabs.create({ url: href }, function(tab) {
        chrome.tabs.executeScript(tab.id, {
          code: "window.scrollTo(0, " + (currentSnippet.offsetTop - 50) + ");"
        });
      });
    });
  }
});

// Set the text of the snippet element in the extension popup
snippet.textContent = 'Click the highlighted text below to go to the search result page and scroll to the exact text that was in the snippet.';
