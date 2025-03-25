from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)  # Enable CORS

# API Keys (Replace with your actual keys)
URLSCAN_API_KEY = "0195cbf3-8af6-7000-828a-de4e82ad6840"
GEMINI_API_KEY = "AIzaSyDrhYeijlm8U_jBbd3FmGfos1JCzvhfEvs"


@app.route('/scan-url', methods=['POST'])
def scan_url():
    data = request.json
    url = data.get("url")
    
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    # Step 1: Submit URL to URLScan.io
    headers = {
        "API-Key": URLSCAN_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {"url": url, "visibility": "public"}
    response = requests.post("https://urlscan.io/api/v1/scan/", json=payload, headers=headers)
    
    if response.status_code != 200:
        return jsonify({"error": "URLScan API request failed"}), 500
    
    scan_data = response.json()
    result_url = scan_data.get("result")
    uuid = scan_data.get("uuid")

    # Step 2: Wait for scan to complete
    time.sleep(10)  # Give some time for URLScan to process

    # Step 3: Fetch the scan result
    report_url = f"https://urlscan.io/api/v1/result/{uuid}/"
    report_response = requests.get(report_url)
    
    if report_response.status_code != 200:
        return jsonify({"error": "Failed to fetch URLScan report"}), 500

    report_data = report_response.json()

    # Step 4: Extract key information
    extracted_info = {
        "URL": report_data.get("page", {}).get("url", "N/A"),
        "Domain": report_data.get("page", {}).get("domain", "N/A"),
        "Submission Time": report_data.get("task", {}).get("time", "N/A"),
        "IP Address": report_data.get("page", {}).get("ip", "N/A"),
        "AS Organization": report_data.get("page", {}).get("asnname", "N/A"),
        "TLS Certificate": report_data.get("lists", {}).get("certificates", [{}])[0].get("issuer", "N/A"),
        "Google Safe Browsing": report_data.get("verdicts", {}).get("overall", {}).get("brands", "N/A"),
        "Page Title": report_data.get("page", {}).get("title", "N/A"),
        "Detected Technologies": report_data.get("meta", {}).get("processors", {}).get("wappalyzer", {}).get("data", [])
    }

    # Step 5: Extract webpage content for Gemini Analysis
    try:
        webpage_response = requests.get(url, timeout=10)
        soup = BeautifulSoup(webpage_response.text, "html.parser")
        page_text = soup.get_text()
    except Exception as e:
        page_text = "Could not extract webpage content"

    # Step 6: Analyze webpage content using Gemini AI
    gemini_headers = {"Authorization": f"Bearer {GEMINI_API_KEY}"}
    gemini_payload = {"input": {"text": page_text}, "parameters": {"temperature": 0.5}}

    gemini_response = requests.post("https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText",
                                    json=gemini_payload, headers=gemini_headers)

    if gemini_response.status_code != 200:
        gemini_analysis = "Failed to analyze with Gemini AI"
    else:
        gemini_analysis = gemini_response.json().get("candidates", [{}])[0].get("output", "No analysis available")

    # Step 7: Return formatted results
    return jsonify({
        "urlscan_result": result_url,
        "urlscan_summary": extracted_info,
        "gemini_analysis": gemini_analysis
    })

if __name__ == '__main__':
    app.run(debug=True)
