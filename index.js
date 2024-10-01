const http = require('http');
const { spawn } = require('child_process');

let botProcess = null; // Variable to hold the bot process

// HTTP Server
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        http.get('http://localhost:3000/', (response) => {
            if (response.statusCode === 200) {
                res.writeHead(302, { Location: 'http://localhost:3000/' });
                res.end();
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error: Server at localhost:3000 is not online. Status code: ' + response.statusCode);
            }
        }).on('error', () => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Welcome to the bot management server.');
        });
        
    } else if (req.url === '/start') {
        if (botProcess) {
            res.writeHead(400);
            res.end('Bot is already running.');
            return;
        }

        // Start the bot
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Starting bot... Please wait.');

        botProcess = spawn('node', ['bot.js'], { stdio: 'inherit' });

        // Check server status
        const checkServer = setInterval(() => {
            http.get('http://dev.projectrelay.uk.to/', (response) => {
                if (response.statusCode === 200) {
                    clearInterval(checkServer);
                    if (!res.headersSent) {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Online');
                    }
                }
            }).on('error', () => {

            });
        }, 1000);

        botProcess.on('error', (error) => {
            console.error('Error starting bot:', error.message);
            botProcess = null;
            if (!res.headersSent) {
                res.writeHead(500);
                res.end('Failed to start bot process: ' + error.message);
            }
        });

        botProcess.on('exit', (code) => {
            console.log(`Bot exited with code ${code}`);
            botProcess = null; // Reset the bot process variable
        });
    } else if (req.url === '/stop') {
        if (!botProcess) {
            res.writeHead(400);
            res.end('Bot is not running.');
            return;
        }

        // Stop the bot by calling the bot management server
        http.get('http://localhost:3000/stop', (response) => {
            let data = '';
            response.on('data', chunk => {
                data += chunk;
            });
            response.on('end', () => {
                if (!res.headersSent) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(data);
                }
            });
        }).on('error', (error) => {
            if (!res.headersSent) {
                res.writeHead(500);
                res.end('Error stopping bot: ' + error.message);
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found: The requested URL ' + req.url + ' was not found on this server.');
    }
});

// Start the server on port 8080
server.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080');
});