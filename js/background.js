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


// Background Service Worker for Link Safety Indication

class LinkSafetyIndicator {
    constructor() {
        this.safeIcons = {
            '16': 'img/icon safe.png',
            '32': 'img/icon safe.png',
            '48': 'img/icon safe.png',
            '128': 'img/icon safe.png'
        };
        this.unsafeIcons = {
            '16': 'img/icon unsafe.png',
            '32': 'img/icon unsafe.png',
            '48': 'img/icon unsafe.png',
            '128': 'img/icon unsafe.png'
        };
        this.warningIcons = {
            '16': 'img/icon unsafe.png',
            '32': 'img/icon unsafe.png',
            '48': 'img/icon unsafe.png',
            '128': 'img/icon unsafe.png'    
        };
        this.blinkInterval = null;
    }

    startBlinking(type = 'warning', duration = 5000) {
        this.stopBlinking();

        const icons = type === 'unsafe' ? this.unsafeIcons :
                      type === 'safe' ? this.safeIcons :
                      this.warningIcons;

        let isVisible = true;
        this.blinkInterval = setInterval(() => {
            chrome.action.setIcon({ 
                path: isVisible ? icons : this.getTransparentIcons() 
            });
            isVisible = !isVisible;
        }, 500);

        setTimeout(() => this.stopBlinking(), duration);
    }

    stopBlinking() {
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
            chrome.action.setIcon({ path: this.safeIcons });
        }
    }

    updateBadge(maliciousCount = 0, notProcessedCount = 0) {
        const badgeText = maliciousCount > 0 ? maliciousCount.toString() :
                          notProcessedCount > 0 ? '!' : '';
        
        const badgeColor = maliciousCount > 0 ? '#FF0000' :  // Red for malicious
                           notProcessedCount > 0 ? '#FFA500' : // Orange for not processed
                           '#00FF00';  // Green for safe

        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    }

    getTransparentIcons() {
        return {
            '16': 'img/icon.png',
            '32': 'img/icon.png',
            '48': 'img/icon.png',
            '128': 'img/icon.png'
        };
    }
}

// Create a global instance
const linkSafetyIndicator = new LinkSafetyIndicator();

// Listen for messages from content or popup scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.action) {
        case 'startBlinking':
            linkSafetyIndicator.startBlinking(request.type);
            break;
        case 'stopBlinking':
            linkSafetyIndicator.stopBlinking();
            break;
        case 'updateBadge':
            linkSafetyIndicator.updateBadge(
                request.maliciousCount, 
                request.notProcessedCount
            );
            break;
    }
});