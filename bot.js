const { Client, Collection, GatewayIntentBits } = require("discord.js");
const http = require('http');
const fs = require('fs');
const path = require('path');

const client = new Client({
    allowedMentions: { parse: ['users', 'roles'] },
    fetchAllMembers: false,
    intents: [ 
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMessageReactions, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// SET COLLECTION
client.slash = new Collection();

// SET UTILS
const { logs } = require('./src/utils/logger.js');
client.logger = require('./src/utils/logger.js')
client.color = require('./src/utils/color.js');

// SET CONFIG
client.config = require('./config.js');

// LOAD THE HANDLERS MANUALLY IN A MORE CONCISE WAY
const handlers = ["error", "event", "mongodbHandler", "slashCommands"];

let loadedHandlerCount = 0; // Initialize a counter for loaded handlers

try {
    handlers.forEach(handlerName => {
        require(`./src/utils/handlers/${handlerName}.js`)(client);
        loadedHandlerCount++; // Increment the counter for each loaded handler
    });
} catch (error) {
    console.error('Failed to load a handler:', error);
}
client.logger.loader(`${client.color.chalkcolor.red('[FINISH]')} ${loadedHandlerCount} handlers loaded`);

client.login(client.config.token);

// HTTP Server to manage bot actions
const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

    let contentType = 'text/html'; // Default to HTML
    if (filePath.endsWith('.css')) {
        contentType = 'text/css';
    } else if (filePath.endsWith('.js')) {
        contentType = 'application/javascript';
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                if (!res.headersSent) {
                    res.writeHead(404);
                    res.end('File not found');
                }
            } else {
                if (!res.headersSent) {
                    res.writeHead(500);
                    res.end('Server error');
                }
            }
        } else {
            if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        }
    });

    if (req.url === '/stop') {
    server.close(() => {
        client.logger.info('HTTP server stopped.');
        process.exit(0); // Exit the process
    });
    } else if (req.url === '/logs') {
        if (!res.headersSent) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ logs: logs || [] }));
        }
        return; 
    } else {
        res.writeHead(404);
        res.end('File not found');
        return; 
    }
});

// Start the server on port 3000
server.listen(3000, '0.0.0.0', () => {
    client.logger.info('Bot management server running on http://0.0.0.0:3000');
});