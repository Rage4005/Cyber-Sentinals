document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("linksList");
    const dashboardButton = document.getElementById("openDashboard");

    // Retrieve links from storage and display them
    chrome.storage.local.get("links", (data) => {
        if (data.links && data.links.length > 0) {
            list.innerHTML = "";
            data.links.forEach(link => {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = link;
                a.textContent = link;
                a.target = "_blank";
                li.appendChild(a);
                list.appendChild(li);
            });
        } else {
            list.innerHTML = "<li>No links found</li>";
        }
    });


    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("openDashboard").addEventListener("click", () => {
            chrome.tabs.create({ url: "dashboard.html" });
        });
    });
    
});
