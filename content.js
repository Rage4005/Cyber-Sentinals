// Extract all links on the page and store them
const links = Array.from(document.querySelectorAll('a')).map(a => a.href);
chrome.storage.local.set({ links });
 