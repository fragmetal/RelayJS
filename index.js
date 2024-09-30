const http = require('http');
const fs = require('fs');
const path = require('path');
const { logs } = require('./src/utils/logger');
const { exec } = require('child_process');

// HTTP Server
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('online.');
    } else if (req.url === '/start') {
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
    } else if (req.url === '/stop') {
        // Stop the bot by calling the bot management server
        http.get('http://localhost:3000/stop', (response) => {
            let data = '';
            response.on('data', chunk => {
                data += chunk;
            });
            response.on('end', () => {
                res.writeHead(200);
                res.end(data);
            });
        }).on('error', (error) => {
            res.writeHead(500);
            res.end('Error stopping bot: ' + error.message);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Start the server on port 8080
server.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080');
});