# Cyber Sentinels 🛡️

## Overview
Cyber Sentinels is a sophisticated browser extension that enhances web security by scanning and analyzing links in real-time. Using URLScan.io and advanced AI analysis, it helps users identify potential security threats while browsing.

## Key Features
- **Real-time Link Analysis**: Scans all links on active webpages using URLScan.io
- **AI-Powered Threat Detection**: Utilizes advanced AI to analyze potential security risks
- **Cyber-themed UI**: Modern, dark-mode interface with interactive elements
- **Detailed Reports**: Comprehensive security analysis for each scanned URL
- **Auto-Scan Option**: Toggle automatic scanning of links while browsing
- **Export Capabilities**: Save and share security reports

## Project Structure
```
Cyber-Sentinels/
├── server/
│   ├── app.py
│   └── requirements.txt
├── web_UI/
│   ├── url-scan.html
│   ├── url-scan.css
│   └── url-scan.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/
│   └── background.js
├── manifest.json
└── README.md
```

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Python, Flask
- **APIs**: URLScan.io, Google Generative AI, Google Safe Browsing
- **Extension**: Chrome Extension APIs

## Installation

### Prerequisites
- Python 3.8 or higher
- Chrome/Edge browser
- URLScan.io API key
- Google Generative AI API key
- Google Safe Browsing API key

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Cyber-Sentinels.git
   cd Cyber-Sentinels
   ```

2. Install Python dependencies:
   ```bash
   cd server
   pip install -r requirements.txt
   ```

3. Configure API keys:
   - Add your URLScan.io API key to `server/server.py`
   - Add your Google Generative AI key to `server/server.py`

4. Load the extension:
   - Open Chrome/Edge and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `Cyber-Sentinels` directory

## Usage
1. Click the Cyber Sentinels icon in your browser toolbar
2. Toggle "Auto Scan Links" to enable automatic scanning
3. Click on any link to view its detailed security analysis
4. View comprehensive reports in the URL scan interface

## Development
To run the development server:
```bash
cd server
python server.py
```
The server will start at `http://localhost:5000`

## Contributing
We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Team

### Core Contributors
- **[@GeorgeShaijuu](https://github.com/GeorgeShaijuu)**

- **[@MrJi421](https://github.com/MrJi421)** 

- **[@TeJu-13-code](https://github.com/TeJu-13-code)** 

### Want to Join?
We're always looking for passionate developers to join our team! If you're interested in contributing to Cyber Sentinels, please:
1. Check our [Contributing Guidelines](CONTRIBUTING.md)
2. Review open [Issues](https://github.com/yourusername/Cyber-Sentinels/issues)
3. Reach out to the team at [your-email@domain.com]

## License
This project is licensed under the Mozilla Public License Version 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- URLScan.io for their security API
- Google for the Generative AI API
- Contributors and supporters of the project
