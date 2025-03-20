document.addEventListener('DOMContentLoaded', function() {
    const linkList = document.getElementById('link-list');

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: extractLinks
        }, (results) => {
            const links = results[0].result;
            displayLinks(links);
        });
    });

    function extractLinks() {
        const anchors = document.getElementsByTagName('a');
        const links = [];
        for (let i = 0; i < anchors.length; i++) {
            links.push(anchors[i].href);
        }
        return links;
    }

    function displayLinks(links) {
        if (links.length === 0) {
            linkList.innerHTML = '<li>No links found.</li>';
            return;
        }
        links.forEach(link => {
            const listItem = document.createElement('li');
            listItem.textContent = link;
            linkList.appendChild(listItem);
        });
    }
});