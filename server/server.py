from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time
from bs4 import BeautifulSoup
import google.generativeai as genai

app = Flask(__name__)
CORS(app)  # Enable CORS

# API Keys (Replace with your actual keys)
URLSCAN_API_KEY = "0195cbf3-8af6-7000-828a-de4e82ad6840"
GEMINI_API_KEY = "AIzaSyDrhYeijlm8U_jBbd3FmGfos1JCzvhfEvs"

@app.route('/scan-url', methods=['POST'])
def scan_url():
    try:
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
        
        try:
            response = requests.post("https://urlscan.io/api/v1/scan/", json=payload, headers=headers)
            response.raise_for_status()
        except requests.RequestException as e:
            return jsonify({"error": f"URLScan API request failed: {str(e)}"}), 500
    
        scan_data = response.json()
        result_url = scan_data.get("result")
        uuid = scan_data.get("uuid")
        
        # Step 2: Wait for scan to complete
        time.sleep(10)  # Give some time for URLScan to process
        
        # Step 3: Fetch the scan result
        report_url = f"https://urlscan.io/api/v1/result/{uuid}/"
        
        try:
            report_response = requests.get(report_url)
            report_response.raise_for_status()
        except requests.RequestException as e:
            return jsonify({"error": f"Failed to fetch URLScan report: {str(e)}"}), 500
        
        report_data = report_response.json()
        
        # Step 4: Extract key information
        extracted_info = {
            "URL": report_data.get("page", {}).get("url", "N/A"),
            "Domain": report_data.get("page", {}).get("domain", "N/A"),
            "Submission Time": report_data.get("task", {}).get("time", "N/A"),
            "IP Address": report_data.get("page", {}).get("ip", "N/A"),
            "AS Organization": report_data.get("page", {}).get("asnname", "N/A"),
            "TLS Certificate": report_data.get("lists", {}).get("certificates", [{}])[0].get("issuer", "N/A"),
            "Page Title": report_data.get("page", {}).get("title", "N/A"),
            # "Detected Technologies": report_data.get("meta", {}).get("processors", {}).get("wappalyzer", {}).get("data", [])
        }
        
        # Step 5: Extract webpage content
        try:
            webpage_response = requests.get(url, timeout=10)
            webpage_response.raise_for_status()
            soup = BeautifulSoup(webpage_response.text, "html.parser")
            page_text = soup.get_text()
        except requests.RequestException:
            page_text = "Could not extract webpage content"
        
        # Step 6: Analyze using Google Generative AI (Gemini)
        try:
            # Configure Gemini API
            genai.configure(api_key=GEMINI_API_KEY)
            
            # Create the model
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Create a more specific prompt about the URL
            prompt = f"Perform a comprehensive security analysis of the URL: {url}. " \
                     "Assess potential risks including:\n" \
                     "- Phishing indicators\n" \
                     "- Malware potential\n" \
                     "- Suspicious domain characteristics\n" \
                     "- Potential security threats\n" \
                     "Provide a detailed, professional assessment."
            
            # Generate content with safety settings
            generation_config = {
                "temperature": 0.5,
                "max_output_tokens": 1000
            }
            
            # Generate the response with safety settings
            response = model.generate_content(
                prompt, 
                generation_config=generation_config
            )
            
            # Extract text from the response
            gemini_analysis = response.text
        
        except Exception as e:
            gemini_analysis = f"Error in Gemini analysis: {str(e)}"
        
        # Step 7: Return formatted results
        return jsonify({
            "urlscan_result": result_url,
            "urlscan_summary": extracted_info,
            "gemini_analysis": gemini_analysis
        })
    
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)