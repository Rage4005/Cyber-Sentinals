from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS

# URLScan API
URLSCAN_API = "https://urlscan.io/api/v1/scan/"
API_KEY = "0195cbf3-8af6-7000-828a-de4e82ad6840"  # Replace with your actual API key

@app.route('/scan-url', methods=['POST'])
def scan_url():
    data = request.json
    url_to_scan = data.get("url")

    if not url_to_scan:
        return jsonify({"error": "URL is required"}), 400

    headers = {
        "Content-Type": "application/json",
        "API-Key": API_KEY
    }

    payload = {"url": url_to_scan, "visibility": "public"}

    try:
        response = requests.post(URLSCAN_API, json=payload, headers=headers)
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
