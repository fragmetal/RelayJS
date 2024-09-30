const http = require('http');
const { exec } = require('child_process');

// HTTP Server
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        http.get('http://localhost:3000/', (response) => {
            let data = '';

            // Collect data from the response
            response.on('data', chunk => {
                data += chunk;
            });

            // When the response ends, check the status code
            response.on('end', () => {
                if (response.statusCode === 200) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(data);
                } else {
                    res.writeHead(500);
                    res.end('Error: Server at localhost:3000 is not online. Status code: ' + response.statusCode);
                }
            });
        }).on('error', (error) => {
            res.writeHead(500);
            res.end('Error fetching status: ' + error.message);
        });
    } else if (req.url === '/start') {
        // Start the bot
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Starting bot... Please wait.');
        exec('npm run bot', (error, stdout, stderr) => {
            if (error) {
                console.error('Error starting bot:', error.message);
                return;
            }
            console.log('Bot started successfully:', stdout);
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