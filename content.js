function getAllLinks() {
    let links = [];

    // Collect links from the main page
    document.querySelectorAll('a[href]').forEach(a => links.push(a.href));

    // Collect links inside iframes
    document.querySelectorAll('iframe').forEach(iframe => {
        try {
            let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.querySelectorAll('a[href]').forEach(a => links.push(a.href));
        } catch (error) {
            console.warn("Cannot access iframe:", error);
        }
    });

    // Remove duplicates and store links
    links = [...new Set(links)];
    chrome.storage.local.set({ links });
}

// Run when the page loads
getAllLinks();

// Watch for dynamically added links
const observer = new MutationObserver(() => getAllLinks());
observer.observe(document.body, { childList: true, subtree: true });
