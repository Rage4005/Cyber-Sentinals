// Description: This script is executed when the popup is opened.
// It extracts all the links on the current page and displays them in the popup.
document.addEventListener('DOMContentLoaded', function() {
    const groupView = document.getElementById('group-view');
    const detailView = document.getElementById('detail-view');
    const detailTitle = document.getElementById('detail-title');
    const detailList = document.getElementById('detail-list');
    const backBtn = document.getElementById('back-btn');

    // Get the active tab and execute the content script to extract links.
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: extractLinks
        }, (results) => {
            let links = results[0].result;
            // Process links: remove duplicates, in-page anchors, and javascript: links.
            links = processLinks(links);
            displayGroupView(links);
        });
    });

    // Content script: extracts all links on the active page.
    function extractLinks() {
        const anchors = document.getElementsByTagName('a');
        const links = [];
        for (let i = 0; i < anchors.length; i++) {
            links.push(anchors[i].href);
        }
        return links;
    }

    // Process links: remove duplicates and unwanted urls.
    function processLinks(links) {
        const processed = [];
        const seen = new Set();
        links.forEach(link => {
            if (!link) return;
            try {
                const urlObj = new URL(link);
                if (urlObj.protocol === "javascript:") return;
                // Remove in-page anchor fragments.
                urlObj.hash = "";
                const normalized = urlObj.toString();
                if (!seen.has(normalized)) {
                    seen.add(normalized);
                    processed.push(normalized);
                }
            } catch (error) {
                console.error("Invalid URL:", link);
            }
        });
        return processed;
    }

    // Group links by their domain (protocol + hostname).
    function groupLinksByDomain(links) {
        const groups = {};
        links.forEach(link => {
            try {
                const urlObj = new URL(link);
                const key = `${urlObj.protocol}//${urlObj.hostname}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(link);
            } catch (error) {
                console.error("Invalid URL during grouping:", link);
            }
        });
        return groups;
    }

    // Display the group view (domains with count).
    function displayGroupView(links) {
        groupView.innerHTML = '';
        const groups = groupLinksByDomain(links);
        if (Object.keys(groups).length === 0) {
            groupView.innerHTML = '<li>No links found.</li>';
            return;
        }
        Object.keys(groups).forEach(domain => {
            const li = document.createElement('li');
            li.textContent = `${domain} (${groups[domain].length})`;
            li.addEventListener('click', () => {
                displayDetailView(domain, groups[domain]);
            });
            groupView.appendChild(li);
        });
    }

    // Display the detail view for a specific domain.
    function displayDetailView(domain, links) {
        detailTitle.textContent = domain;
        detailList.innerHTML = '';
        links.forEach(link => {
            const li = document.createElement('li');
            const anchor = document.createElement('a');
            anchor.href = link;
            anchor.textContent = link;
            anchor.target = "_blank";
            li.appendChild(anchor);
            detailList.appendChild(li);
        });
        // Hide group view and show detail view.
        groupView.style.display = "none";
        detailView.style.display = "block";
    }

    // Back button returns to the group view.
    backBtn.addEventListener('click', () => {
        detailView.style.display = "none";
        groupView.style.display = "block";
    });
});