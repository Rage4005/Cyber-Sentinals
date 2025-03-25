async function scanUrl() {
    const urlInput = document.getElementById("urlInput").value;
    const resultElement = document.getElementById("result");

    if (!urlInput) {
        resultElement.innerText = "Please enter a URL!";
        return;
    }

    resultElement.innerText = "Scanning... Please wait.";

    try {
        const response = await fetch("http://127.0.0.1:5000/scan-url", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: urlInput })
        });

        if (!response.ok) {
            throw new Error("Network response was not OK");
        }

        const result = await response.json();
        resultElement.innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        console.error("Error:", error);
        resultElement.innerText = "Error occurred. Check console.";
    }
}
