const links = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractLinks") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    function: getLinks,
                },
                (results) => {
                    if (results && results[0]) {
                        links.push(...results[0].result);
                        sendResponse({ links: links });
                    }
                }
            );
        });
        return true; // Indicates that the response will be sent asynchronously
    }
});

function getLinks() {
    const anchorTags = document.querySelectorAll('a');
    return Array.from(anchorTags).map(anchor => anchor.href).filter(href => href);
}