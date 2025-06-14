// contentScript.js

// This file adds styling to Google search result snippets 
// (highlightSnippets) and upon observeResults,
// adds event listeners to those snippets for onClick to open
// that result in a new tab and send the message across tabs
// to run the findTextAndScroll function to attempt to
// locate the exact text that was in the snippet and 
// scroll the page down to it.

// console.log("contentScript is running!");    // console log



function highlightElement(element) {
  element.style.backgroundColor = '#5ba9fd';
  element.style.color = 'black'
}

// Function that highlights the snippet text underneath the Google search result.
function highlightSnippets() {
  // console.log("highlightSnippets is running!");        // console log
  const snippetElements = document.querySelectorAll('[data-snippet], .VwiC3b, [role="text"]');
  snippetElements.forEach(element => {
    if (!element.hasAttribute('data-listener-attached')) {
      element.setAttribute('data-listener-attached', 'true');
      element.style.color = '#88c1ff';
      element.style.textDecoration = 'underline';
      element.style.cursor = 'pointer';

      element.addEventListener('click', openLink);
      const emElements = element.querySelectorAll('em');
      emElements.forEach(em => {
        em.style.color = '#88c1ff';
      });
    }
  });
}

// Function to observe the search results ensuring efficiency of the search.
function observeSearchResults() {
  const targetNode = document.querySelector('#search');
  if (targetNode) {
    const observer = new MutationObserver(() => {
      highlightSnippets();
    });

    observer.observe(targetNode, { childList: true, subtree: true });
  }
}

// Triggered when a Google search snippet is clicked, gets the URL of the
// clicked search result, and sends a message to the background script
// ('background.js') to open the link in a new tab and then calls the 
// ('findTextAndScroll') function to scroll to the snippet text in that
// newly opened tab.
function openLink(event) {
  event.stopPropagation();
  const container = event.target.closest('[data-sokoban-container], [data-header-feature], .g, div[data-hveid]');
  if (!container) {
    console.log('DEBUG: Container not found. Current element:', event.target);
    return;
  }

  const link = container.querySelector('h3 > a, a[ping], a[data-ved]');
  const snippetElement = event.target.closest('[data-snippet], .VwiC3b, [role="text"]');

  if (link && snippetElement) {
    const encodedSnippetText = encodeURIComponent(snippetElement.innerText);
    const index = Array.from(snippetElement.parentNode.children).indexOf(snippetElement);

    chrome.runtime.sendMessage({
      action: 'openLink',
      url: link.href,
      encodedSnippetText: encodedSnippetText,
      index: index,
    });
  } else {
    console.log('DEBUG: Elements not found:', { link, snippetElement });
  }
}

// This is where the real meat and potatoes begins. Searches for the 
// snippet text in the opened webpage, highlights the portion of the 
// page where the text appears.
// 1.) Uses a MutationObserver to keep looking for the snippet even
// if the page's content changes or loads asynchronously. Scrolls to
// the highlighted portion of the page.

// Function to calculate the match score of a given string by splitting
// and comparing to our given searchText.
function getMatchScore(nodeText, searchText) {
  const nodeWords = nodeText.split(/\s+/);
  const searchWords = searchText.split(/\s+/);

  let score = 0;
  for (const word of searchWords) {
    if (nodeWords.includes(word)) {
      score += 1;
    }
  }

  return score / searchWords.length;
}

// Function to calculate the best match for the snippet text on the
// website using a TreeWalker.
function findBestMatch(decodedSnippetText) {
  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let bestMatch = null;
  let highestScore = 0;

  let node = treeWalker.nextNode();
  while (node) {
    const score = getMatchScore(node.textContent, decodedSnippetText);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = node;
    }

    if (highestScore === 1) { // 1 means 100% match.
      break;
    }

    node = treeWalker.nextNode();
  }

  return bestMatch;
}

// i like this method better
function findExactTextMatch(node, searchText) {
  // normalize both texts
  const normalizedNodeText = node.textContent.trim().replace(/\s+/g, ' ');
  const normalizedSearchText = searchText.trim().replace(/\s+/g, ' ');
  
  // in a perfect world
  if (normalizedNodeText === normalizedSearchText) {
    return true;
  }

  // if no match, check for phrase match
  const phraseRegex = new RegExp(`^.*?\\b(${escapeRegExp(normalizedSearchText)})\\b.*?$`);
  const match = normalizedNodeText.match(phraseRegex);
  
  if (match) {
    // only return true if the matched portion isn't part of a larger sentence
    const beforeMatch = normalizedNodeText.substring(0, normalizedNodeText.indexOf(match[1])).trim();
    const afterMatch = normalizedNodeText.substring(normalizedNodeText.indexOf(match[1]) + match[1].length).trim();
    
    // check if there's no text before or if text before ends with sentence terminator
    const validPrefix = !beforeMatch || /[.!?]\s*$/.test(beforeMatch);
    // check if there's no text after or if text after starts with sentence terminator
    const validSuffix = !afterMatch || /^[.!?]\s*/.test(afterMatch);
    
    return validPrefix && validSuffix;
  }
  
  return false;
}

// still don't know how regex works
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findTextAndScroll(encodedSnippetText) {
  console.log("Searching...");
  let decodedSnippetText = decodeURIComponent(encodedSnippetText);
  
  // clean up text
  decodedSnippetText = decodedSnippetText
    .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+—/g, '')
    .trim();
  
  const sentences = decodedSnippetText.split('. ').filter(s => s.length > 10);
  
  // wait for DOM
  await new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });

  let found = false;
  let searchAttempts = 0;
  const MAX_ATTEMPTS = 15;
  const TIMEOUT_MS = 15000;

  // Initial search before setting up observer
  const searchNodes = () => {
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.textContent.trim().length < 10) return NodeFilter.FILTER_REJECT;
          if (node.parentElement.offsetParent === null) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (let sentence of sentences) {
      const match = textNodes.find(node => 
        findExactTextMatch(node, sentence) && 
        node.parentElement.offsetHeight > 0
      );

      if (match) {
        found = true;
        console.log("Text found.");
        match.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightElement(match.parentNode);
        return true;
      }
    }
    return false;
  };

  // try initial search
  if (searchNodes()) {
    return;
  }

  // set up observer for dynamic content
  const observer = new MutationObserver(() => {
    if (!found && searchAttempts < MAX_ATTEMPTS) {
      searchAttempts++;
      if (searchNodes()) {
        observer.disconnect();
      }
    }

    // try fuzzy match on last attempt
    if (searchAttempts === MAX_ATTEMPTS && !found) {
      const match = findBestMatch(decodedSnippetText);
      if (match) {
        found = true;
        match.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightElement(match.parentNode);
      } else {
        console.log("Text not found after all attempts:", decodedSnippetText);
      }
      observer.disconnect();
    }
  });

  // observe DOM changes
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    characterData: true 
  });

  // cleanup
  window.addEventListener('beforeunload', () => observer.disconnect());
  
  // don't wanna take all day
  setTimeout(() => {
    if (!found) {
      observer.disconnect();
      console.log("Search timed out after 15 seconds, fucking off..");
      // const match = findBestMatch(decodedSnippetText);
      // if (match) {
      //   found = true;
      //   match.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      //   highlightElement(match.parentNode);
      // } else {
      //   console.log("No matches found after timeout:", decodedSnippetText);
      // }
    }
  }, TIMEOUT_MS);
}

// 💀💀💀💀💀
let tiltedTowers = null;

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const fuckleChuck = new Date().getMinutes();
    if (fuckleChuck !== tiltedTowers) {
      ingrownToenail();
      tiltedTowers = fuckleChuck;
    }
  }
});

// i still have a conscience 
function ingrownToenail() {
  const chuckleFuck = Math.floor(Math.random() * 60).toString().padStart(2, '0');
  const fuckleChuck = new Date().getMinutes().toString().padStart(2, '0');
  
  if (chuckleFuck === fuckleChuck) {
    const nonsense = [
        "whoever's using this browser now has snake aids",
        "redtail catfish get my goat man",
        "when's the last time you ",
        "Im tired of motherfuckers in school tellin me always in the barbershop Chief Keef aint bout this Chief Keef aint bout that My boy a BD on fuckin Lamron and them He he they say that n***a dont be puttin in no work Shut the fuck up yall n***as aint know shit All yall motherfuckers talkin about Chief Keef aint no hitter Chief Keef aint this Chief Keef a fake Shut the fuck up yall dont live with that n***a Yall know that n***a got caught with a ratchet Shootin at the police and shit n***a been on probation since fuckin I dont know when Motherfucker stop fuckin playin him like that Them n***as savages out there If I catch another motherfucker talkin sweet about Chief Keef Im fuckin beatin they ass Im not fuckin playin no more Know them n***as roll with Lil Reese and them"
    ];
    console.log(nonsense[Math.floor(Math.random() * nonsense.length)]);
  }
}

// where we do shit
highlightSnippets();
observeSearchResults();

// Sends message to background.js for findTextAndScroll.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findTextAndScroll') {
    findTextAndScroll(request.encodedSnippetText, request.index);
  }
});
