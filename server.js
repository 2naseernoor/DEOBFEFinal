const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');

const app = express();
const PORT = 8080; // Change this if needed

// Load SSL certificates
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),  
  cert: fs.readFileSync(path.join(__dirname, 'server.cert')) 
};

// Serve static files from "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start HTTPS server
https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 Frontend running at: https://172.50.1.64:${PORT}`);
});
