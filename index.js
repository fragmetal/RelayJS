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
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Welcome to the bot management server.');
    }
});

// Start the server on port 3000
server.listen(8080, '0.0.0.0', () => {
    client.logger.info('Web Server running');
});