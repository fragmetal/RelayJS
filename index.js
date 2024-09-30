const { Client, Collection, GatewayIntentBits } = require("discord.js");
const http = require('http');
const fs = require('fs');
const path = require('path');
const { logs } = require('./src/utils/logger');

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
client.logger = require('./src/utils/logger');
client.color = require('./src/utils/color.js');

// SET CONFIG
client.config = require('./config');

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
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Log console messages to the logs array with color
// client.on('debug', info => {
//     const coloredInfo = `${client.color.chalkcolor.green(`[${new Date().toISOString()}] DEBUG:`)} ${info}`;
//     logs.push(coloredInfo);
// });

// Start the server
server.listen(8080, '0.0.0.0', () => {
    client.logger.loader(`${client.color.chalkcolor.red('[ HTTP ]')} Server running at http://0.0.0.0:8080`);
});