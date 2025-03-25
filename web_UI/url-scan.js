
async function scanUrl() {
    const url = document.getElementById("urlInput").value;
    const resultDiv = document.getElementById("result");
    const loadingDiv = document.getElementById("loading");

    if (!url) {
        resultDiv.innerHTML = "<p style='color: red;'>Please enter a valid URL.</p>";
        return;
    }

    loadingDiv.classList.remove("hidden");
    resultDiv.innerHTML = "";

    try {
        const response = await fetch("http://127.0.0.1:5000/scan-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error("Network response was not OK");
        }

        const data = await response.json();
        loadingDiv.classList.add("hidden");

        // Format extracted details
        let summary = `<h3>Scan Summary</h3>`;
        for (const [key, value] of Object.entries(data.urlscan_summary)) {
            summary += `<p><strong>${key}:</strong> ${Array.isArray(value) ? value.join(", ") : value}</p>`;
        }

        resultDiv.innerHTML = `
            ${summary}
            <h3>URLScan Report:</h3>
            <p><a href="${data.urlscan_result}" target="_blank">View Full Report</a></p>
            <h3>AI Analysis:</h3>
            <p>${data.gemini_analysis}</p>
        `;
    } catch (error) {
        loadingDiv.classList.add("hidden");
        resultDiv.innerHTML = `<p style='color: red;'>Error: ${error.message}</p>`;
    }
}
