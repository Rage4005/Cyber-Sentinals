document.addEventListener('DOMContentLoaded', () => {
    const links = Array.from(document.querySelectorAll('a')).map(link => link.href);
    chrome.runtime.sendMessage({ links: links });
});