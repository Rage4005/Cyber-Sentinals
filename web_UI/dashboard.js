document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('extractedLinks', function(data) {
        const links = data.extractedLinks || [];
        const linksContainer = document.getElementById('linksContainer');

        if (links.length === 0) {
            linksContainer.innerHTML = '<p>No links found.</p>';
        } else {
            links.forEach(link => {
                const linkElement = document.createElement('a');
                linkElement.href = link;
                linkElement.textContent = link;
                linkElement.target = '_blank';
                linksContainer.appendChild(linkElement);
            });
        }
    });
});