// Description: This script is executed when the popup is opened.
// It extracts all the links on the current page and displays them in the popup.
document.addEventListener('DOMContentLoaded', function() {
    const groupView = document.getElementById('group-view');
    const detailView = document.getElementById('detail-view');
    const detailTitle = document.getElementById('detail-title');
    const detailList = document.getElementById('detail-list');
    const backBtn = document.getElementById('back-btn');
  
    // Global mapping for link statuses.
    // statuses: "safe" (green), "malicious" (red), "notProcessed" (yellow)
    let linkStatusMapping = {};

    // Get the active tab and execute the content script to extract links.
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: extractLinks
        }, (results) => {
            let links = results[0].result;
            // Process links: remove duplicates, in-page anchors, and javascript: links.
            links = processLinks(links);
            // Test all links via the Safe Browsing API.
            safeBrowsingTest(links)
              .then(mapping => {
                linkStatusMapping = mapping;
              })
              .catch(error => {
                console.error("Safe Browsing API error:", error);
                // If error, mark all links as not processed.
                links.forEach(link => {
                  linkStatusMapping[link] = "notProcessed";
                });
              })
              .finally(() => {
                displayGroupView(links);
              });
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
  
    // Process links: remove duplicates and unwanted URLs.
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
  
    // Test links with Google Safe Browsing API.
    function safeBrowsingTest(links) {
        return new Promise((resolve, reject) => {
            const API_KEY = "AIzaSyD6a02ERpTXyrKUzF31u0uEhSJgZXq5qu8"; // API key.
            const apiEndpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;
  
            const requestBody = {
                client: {
                    clientId: "cyber-sentinels",
                    clientVersion: "1.0"
                },
                threatInfo: {
                    threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    platformTypes: ["ANY_PLATFORM"],
                    threatEntryTypes: ["URL"],
                    threatEntries: links.map(link => ({ url: link }))
                }
            };
  
            fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
              .then(response => response.json())
              .then(data => {
                  const mapping = {};
                  links.forEach(link => {
                      mapping[link] = "safe";
                  });
                  if (Object.keys(data).length === 0) {
                      resolve(mapping);
                  } else if (data.matches && data.matches.length > 0) {
                      data.matches.forEach(match => {
                          if (match.threat && match.threat.url) {
                              mapping[match.threat.url] = "malicious";
                          }
                      });
                      resolve(mapping);
                  } else {
                      resolve(mapping);
                  }
              })
              .catch(error => {
                  reject(error);
              });
        });
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
  
    // Evaluate a group's status.
    function evaluateGroupStatus(links) {
        let redCount = 0, yellowCount = 0, greenCount = 0;
        links.forEach(link => {
            const status = linkStatusMapping[link] || "notProcessed";
            if (status === "malicious") redCount++;
            else if (status === "notProcessed") yellowCount++;
            else greenCount++; // safe
        });
        // Priority: If any red, group is red; else if any yellow, group is yellow; else green.
        if (redCount > 0) return { status: "malicious", count: redCount };
        if (yellowCount > 0) return { status: "notProcessed", count: yellowCount };
        return { status: "safe", count: greenCount };
    }
  
    // Display the group view (domains with count and colored badge).
    function displayGroupView(links) {
        groupView.innerHTML = '';
        const groups = groupLinksByDomain(links);
        if (Object.keys(groups).length === 0) {
            groupView.innerHTML = '<li>No links found.</li>';
            return;
        }
        Object.keys(groups).forEach(domain => {
            const li = document.createElement('li');
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.padding = "5px";
            li.style.marginBottom = "5px";
            li.style.backgroundColor = "#3a3a4d";
            li.style.borderRadius = "3px";
            li.style.cursor = "pointer";
  
            li.textContent = `${domain}`;
  
            // Evaluate group status.
            const { status, count } = evaluateGroupStatus(groups[domain]);
  
            // Create a badge element.
            const badge = document.createElement('div');
            badge.style.width = "20px";
            badge.style.height = "20px";
            badge.style.borderRadius = "50%";
            badge.style.display = "flex";
            badge.style.justifyContent = "center";
            badge.style.alignItems = "center";
            badge.style.fontSize = "10px";
            badge.style.fontWeight = "bold";
            badge.style.color = "#ffffff";
  
            if (status === "malicious") {
                badge.style.backgroundColor = "#f44336"; // red
            } else if (status === "notProcessed") {
                badge.style.backgroundColor = "#ffc107"; // yellow
            } else {
                badge.style.backgroundColor = "#4caf50"; // green
            }
            badge.textContent = count;
  
            // Container for text and badge.
            const container = document.createElement('div');
            container.style.display = "flex";
            container.style.justifyContent = "space-between";
            container.style.alignItems = "center";
            container.style.width = "100%";
            container.appendChild(document.createTextNode(`${domain} (${groups[domain].length})`));
            container.appendChild(badge);
  
            li.innerHTML = ""; // clear textContent previously set
            li.appendChild(container);
  
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
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.padding = "5px";
            li.style.marginBottom = "5px";
            li.style.backgroundColor = "#3a3a4d";
            li.style.borderRadius = "3px";
  
            const anchor = document.createElement('a');
            anchor.href = link;
            anchor.textContent = link;
            anchor.target = "_blank";
            anchor.style.flexGrow = "1";
  
            const statusIcon = document.createElement('div');
            statusIcon.style.width = "12px";
            statusIcon.style.height = "12px";
            statusIcon.style.borderRadius = "50%";
  
            let status = linkStatusMapping[link] || "notProcessed";
  
            if (status === "safe") {
                statusIcon.style.backgroundColor = "#4caf50"; // green
            } else if (status === "malicious") {
                statusIcon.style.backgroundColor = "#f44336"; // red
            } else {
                statusIcon.style.backgroundColor = "#ffc107"; // yellow
            }
  
            li.appendChild(anchor);
            li.appendChild(statusIcon);
            detailList.appendChild(li);
        });
        groupView.style.display = "none";
        detailView.style.display = "block";
    }
  
    // Back button returns to the group view.
    backBtn.addEventListener('click', () => {
        detailView.style.display = "none";
        groupView.style.display = "block";
    });
});