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

             // Store URLs in the Google Sheet.
             sendToGoogleSheet(links);

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


    // Store URLs in Google Sheet using Google Apps Script web app.
    function sendToGoogleSheet(links) {
        const googleAppsScriptURL = "https://script.google.com/a/macros/kristujayanti.com/s/AKfycbx3w0oY9l2BRk-6C4jTYF6Mox0koSklUzDtZZlv45npXyVpcmI0fxFo5BxteavnpEtj/exec";

        // Get the user's IP using an external API
        fetch("https://api64.ipify.org?format=json")
            .then(response => response.json())
            .then(data => {
                const ip = data.ip;
                
                // Create an array of link objects with their safety status
                const linksWithStatus = links.map(link => ({
                    url: link,
                    status: linkStatusMapping[link] || "notProcessed"
                }));

                fetch(googleAppsScriptURL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ 
                        links: linksWithStatus,
                        ip: ip
                    }),
                })
                .then(response => response.text())
                .then(data => {
                    console.log("Stored URLs with IP:", data);
                })
                .catch(error => {
                    console.error("Error storing URLs in Google Sheet:", error);
                });
            })
            .catch(error => {
                console.error("Error getting IP:", error);
            });
    }
        
        
      
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

                  updateExtensionIndicator(links);
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
            li.className = 'group-item';
            
            // Create domain text container
            const domainText = document.createElement('span');
            domainText.className = 'domain-text';
            domainText.textContent = domain;
            
            // Evaluate group status
            const { status } = evaluateGroupStatus(groups[domain]);
            
            // Create status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.className = `status-indicator ${status === 'safe' ? 'status-safe' : 'status-unsafe'}`;
            statusIndicator.textContent = status === 'safe' ? 'SAFE' : 'UNSAFE';
            
            // Add elements to list item
            li.appendChild(domainText);
            li.appendChild(statusIndicator);
            
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
            li.className = 'detail-item';
            
            // Create link text that's clickable
            const linkText = document.createElement('a');
            linkText.className = 'link-text';
            linkText.textContent = link;
            linkText.href = '#';
            linkText.onclick = (e) => {
                e.preventDefault();
                chrome.tabs.create({
                    url: `../web_UI/url-scan.html?url=${encodeURIComponent(link)}`
                });
            };
            
            // Get status
            const status = linkStatusMapping[link] || "notProcessed";
            
            // Create status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.className = `status-indicator ${status === 'safe' ? 'status-safe' : 'status-unsafe'}`;
            statusIndicator.textContent = status === 'safe' ? 'SAFE' : 'UNSAFE';
            
            // Add elements to list item
            li.appendChild(linkText);
            li.appendChild(statusIndicator);
            
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

/**
 * Checks a URL using the VirusTotal API.
 * VirusTotal requires the URL to be base64 encoded (without trailing "=" characters).
 * Returns an object with a property "maliciousCount" indicating the number of detections.
 */
async function getVirusTotalThreatScore(url) {
  const API_KEY = "eb7ec2c121e8294fae83f9b62a5428ac440da6c21e17e3dd50f27d5961db6c4f"; // Replace with your VirusTotal API key.
  
  // Base64 encode the URL and remove any trailing '=' characters.
  const urlId = btoa(url).replace(/=+$/, '');
  
  const endpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;
  try {
    const response = await fetch(endpoint, {
      headers: {
        "x-apikey": API_KEY
      }
    });
    if (!response.ok) {
      console.error(`VirusTotal API error for ${url}: ${response.statusText}`);
      return { maliciousCount: 0 };
    }
    const data = await response.json();
    // Example: Use the "last_analysis_stats" from the response to get a count of malicious detections.
    const stats = data?.data?.attributes?.last_analysis_stats;
    const maliciousCount = stats ? stats.malicious : 0;
    return { maliciousCount };
  } catch (error) {
    console.error("Error in VirusTotal API for", url, error);
    return { maliciousCount: 0 };
  }
}

async function checkUrlsVirusTotal(urls) {
  // For each URL, call getVirusTotalThreatScore.
  const promises = urls.map(url => getVirusTotalThreatScore(url));
  const results = await Promise.all(promises);

  // Combine the mapping: url -> result
  const mapping = {};
  urls.forEach((url, index) => {
    mapping[url] = results[index];
  });
  return mapping;
}

// Example usage:
// (async () => {
//     const result = await getVirusTotalThreatScore("https://example.com/");
//     console.log("VirusTotal result:", result);
// })();



// Add this to your existing popup script
function notifyBackgroundAboutLinkSafety(links) {
    let maliciousCount = 0;
    let notProcessedCount = 0;

    links.forEach(link => {
        const status = linkStatusMapping[link];
        if (status === 'malicious') maliciousCount++;
        if (status === 'notProcessed') notProcessedCount++;
    });

    // Send message to background script
    chrome.runtime.sendMessage({
        action: 'updateBadge',
        maliciousCount,
        notProcessedCount
    });

    // Trigger blinking
    if (maliciousCount > 0) {
        chrome.runtime.sendMessage({ 
            action: 'startBlinking', 
            type: 'unsafe' 
        });
    } else if (notProcessedCount > 0) {
        chrome.runtime.sendMessage({ 
            action: 'startBlinking', 
            type: 'warning' 
        });
    } else {
        chrome.runtime.sendMessage({ 
            action: 'startBlinking', 
            type: 'safe' 
        });
    }
}

// Call this after processing links
notifyBackgroundAboutLinkSafety(links);








// Add this to your existing event listeners
document.getElementById('toggleReport').addEventListener('change', function(e) {
    const isEnabled = e.target.checked;
    // Save the toggle state
    chrome.storage.sync.set({ 'autoScanEnabled': isEnabled }, function() {
        console.log('Auto scan setting saved:', isEnabled);
    });
    
    // If enabled, scan current page links
    if (isEnabled) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: extractLinks
            }, (results) => {
                const links = results[0].result;
                // Process each link - open in url-scan.html
                links.forEach(link => {
                    chrome.tabs.create({
                        url: `../web_UI/url-scan.html?url=${encodeURIComponent(link)}`
                    });
                });
            });
        });
    }
});

// Restore toggle state when popup opens
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get('autoScanEnabled', function(data) {
        document.getElementById('toggleReport').checked = data.autoScanEnabled || false;
    });
});