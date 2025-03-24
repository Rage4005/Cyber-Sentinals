function doGet() {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <title>Cyber Sentinels Analytics</title>
        <style>
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #000;
            color: #fff;
          }
          .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          .card {
            background: rgba(84, 244, 252, 0.05);
            border: 1px solid #54F4FC;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(84, 244, 252, 0.1);
          }
          .risk-score {
            font-size: 48px;
            font-weight: bold;
            color: #54F4FC;
            text-align: center;
            margin: 20px 0;
          }
          .risk-label {
            text-align: center;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 20px;
          }
          .stat-item {
            text-align: center;
            padding: 10px;
            background: rgba(84, 244, 252, 0.1);
            border-radius: 8px;
          }
          .chart-container {
            height: 300px;
            margin-top: 20px;
          }
          .loading {
            text-align: center;
            padding: 20px;
            font-size: 18px;
            color: #54F4FC;
          }
        </style>
      </head>
      <body>
        <h1>Cyber Sentinels Analytics Dashboard</h1>
        <div id="dashboard" class="dashboard">
          <div class="card">
            <h2>Overall Risk Assessment</h2>
            <div id="risk-score" class="risk-score">-</div>
            <div id="risk-label" class="risk-label">Calculating...</div>
            <div class="stats">
              <div class="stat-item">
                <div>Total Links</div>
                <div id="total-links">-</div>
              </div>
              <div class="stat-item">
                <div>Safe Links</div>
                <div id="safe-links">-</div>
              </div>
              <div class="stat-item">
                <div>Unsafe Links</div>
                <div id="unsafe-links">-</div>
              </div>
              <div class="stat-item">
                <div>Unique Domains</div>
                <div id="unique-domains">-</div>
              </div>
            </div>
          </div>
          <div class="card">
            <h2>Recent Activity</h2>
            <div id="recent-activity">Loading...</div>
          </div>
        </div>
        
        <script>
          function loadData() {
            google.script.run
              .withSuccessHandler(function(data) {
                displayData(data);
              })
              .withFailureHandler(function(error) {
                console.error('Error loading data:', error);
                document.getElementById('dashboard').innerHTML = 'Error loading data';
              })
              .getAnalyticsData();
          }
          
          function calculateRiskScore(data) {
            let totalLinks = 0;
            let safeLinks = 0;
            let unsafeLinks = 0;
            const uniqueDomains = new Set();
            
            data.forEach(row => {
              if (row.length >= 3) {
                const links = JSON.parse(row[2]);
                totalLinks += links.length;
                
                links.forEach(link => {
                  try {
                    const domain = new URL(link).hostname;
                    uniqueDomains.add(domain);
                  } catch (e) {
                    console.error('Invalid URL:', link);
                  }
                });
              }
            });
            
            // Calculate risk score (0-100)
            const riskScore = Math.min(100, Math.round((unsafeLinks / totalLinks) * 100));
            
            return {
              riskScore,
              totalLinks,
              safeLinks,
              unsafeLinks,
              uniqueDomains: uniqueDomains.size
            };
          }
          
          function getRiskLabel(score) {
            if (score <= 20) return 'Very Safe';
            if (score <= 40) return 'Safe';
            if (score <= 60) return 'Moderate Risk';
            if (score <= 80) return 'High Risk';
            return 'Very High Risk';
          }
          
          function displayData(data) {
            const stats = calculateRiskScore(data);
            
            // Update risk score
            document.getElementById('risk-score').textContent = stats.riskScore + '%';
            document.getElementById('risk-label').textContent = getRiskLabel(stats.riskScore);
            
            // Update stats
            document.getElementById('total-links').textContent = stats.totalLinks;
            document.getElementById('safe-links').textContent = stats.safeLinks;
            document.getElementById('unsafe-links').textContent = stats.unsafeLinks;
            document.getElementById('unique-domains').textContent = stats.uniqueDomains;
            
            // Update recent activity
            const recentActivity = data.slice(-5).reverse().map(row => {
              const timestamp = new Date(row[0]).toLocaleString();
              const ip = row[1];
              const links = JSON.parse(row[2]);
              return \`
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(84, 244, 252, 0.1); border-radius: 8px;">
                  <div><strong>Time:</strong> \${timestamp}</div>
                  <div><strong>IP:</strong> \${ip}</div>
                  <div><strong>Links:</strong> \${links.length}</div>
                </div>
              \`;
            }).join('');
            
            document.getElementById('recent-activity').innerHTML = recentActivity;
          }
          
          // Load data when page loads
          window.onload = loadData;
        </script>
      </body>
    </html>
  `);
}

function getAnalyticsData() {
  // Get the spreadsheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  
  // Get all data from the sheet
  const data = sheet.getDataRange().getValues();
  
  // Skip header row if exists
  if (data.length > 0 && data[0][0].toString().toLowerCase().includes('timestamp')) {
    return data.slice(1);
  }
  
  return data;
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  
  // Add timestamp
  const timestamp = new Date();
  
  // Add the new data to the sheet
  sheet.appendRow([
    timestamp,
    data.ip,
    JSON.stringify(data.links)
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
} 