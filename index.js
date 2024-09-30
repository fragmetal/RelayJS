const http = require('http');
const fs = require('fs');
const path = require('path');
const { logs } = require('./src/utils/logger');
const client = require('./bot'); // Import the client instance
const { exec } = require('child_process');

// HTTP Server
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        // Serve the main HTML file
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/style.css') {
        // Serve the CSS file
        fs.readFile(path.join(__dirname, 'public', 'style.css'), (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading style.css');
            }
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(data);
        });
    } else if (req.url === '/logs') {
        // Serve the logs as JSON
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ logs }));
    } else if (req.url === '/start-bot') {
        // Start the bot
        exec('npm run bot', (error, stdout, stderr) => {
            if (error) {
                res.writeHead(500);
                res.end('Error starting bot: ' + error.message);
                return;
            }
            res.writeHead(200);
            res.end('Bot started successfully: ' + stdout);
        });
    } else if (req.url === '/stop-bot') {
        // Stop the bot gracefully
        client.destroy() // Gracefully shut down the bot
            .then(() => {
                res.writeHead(200);
                res.end('Bot stopped successfully.');
            })
            .catch(error => {
                res.writeHead(500);
                res.end('Error stopping bot: ' + error.message);
            });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Start the server
server.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080');
});