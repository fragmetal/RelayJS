const http = require('http');
const fs = require('fs');
const path = require('path');
const { logs } = require('./src/utils/logger');


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
        client.login(client.config.token)
            .then(() => {
                res.writeHead(200);
                res.end('Bot started successfully');
            })
            .catch(err => {
                res.writeHead(500);
                res.end('Error starting bot: ' + err.message);
            });
    } else if (req.url === '/stop-bot') {
        // Stop the bot
        client.destroy()
            .then(() => {
                res.writeHead(200);
                res.end('Bot stopped successfully');
            })
            .catch(err => {
                res.writeHead(500);
                res.end('Error stopping bot: ' + err.message);
            });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Start the server
server.listen(8080, '0.0.0.0', () => {
    client.logger.loader(`${client.color.chalkcolor.red('[ HTTP ]')} Server running`);
});