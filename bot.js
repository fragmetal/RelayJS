const { Client, Collection, GatewayIntentBits } = require("discord.js");
const http = require('http');
const fs = require('fs'); // Import fs to read files
const { exec } = require('child_process');
const { logs } = require('./src/utils/logger'); // Import logs from logger.js

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
client.logger = require('./src/utils/logger.js');
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
    if (req.url === '/public/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.readFile('./public/index.html', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading index.html: ' + err.message);
                return;
            }
            res.end(data);
        });
    } else if (req.url === '/public/style.css') {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        fs.readFile('./public/style.css', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading style.css: ' + err.message);
                return;
            }
            res.end(data);
        });
    } else if (req.url === '/public/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        fs.readFile('./public/favicon.ico', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading favicon.ico: ' + err.message);
                return;
            }
            res.end(data);
        });
    } else if (req.url === '/logs') {
        // Serve the logs as JSON
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ logs }));
    } else if (req.url === '/stop') {
        client.destroy() // Gracefully shut down the bot
            .then(() => {
                res.writeHead(200);
                res.end('Bot stopped successfully.');
            })
            .catch(error => {
                res.writeHead(500);
                res.end('Error stopping bot: ' + error.message);
            });
    } else if (req.url === '/client-info') {
        // Print client information (e.g., guilds the bot is in)
        const clientInfo = {
            guilds: client.guilds.cache.map(guild => ({
                id: guild.id,
                name: guild.name,
            })),
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(clientInfo));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Start the server on port 3000
server.listen(3000, '0.0.0.0', () => {
    console.log('Bot management server running on http://0.0.0.0:3000');
});