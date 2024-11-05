const { Client, Collection, GatewayIntentBits } = require("discord.js");
const http = require('http');
const { LavalinkManager } = require('lavalink-client');

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

async function StartBot() {
    
    const botMode = client.config.botMode;
    const credentials = await client.mongodb.getBotCredentials(botMode);

    if (!credentials) {
        console.error('Failed to retrieve bot credentials. Exiting...');
        process.exit(1);
    }
    const { clientId, token } = credentials;

    // create instance
    client.lavalink = new LavalinkManager({
        nodes: [
            {
                authorization: "youshallnotpass",
                host: "localhost",
                port: 2333,
                id: "prodnode",
            }
        ],
        sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
        autoSkip: true,
        client: {
            id: clientId,
        },
    });

    client.once('ready', async () => {
        client.lavalink.init(client.user); // init lavalink
    });
    
    client.lavalink.on("create", (node, payload) => {
        console.log(`The Lavalink Node #${node.id} connected`);
    });

    // for all node based errors:
    client.lavalink.on("error", (node, error, payload) => {
        console.error(`The Lavalink Node #${node.id} errored: `, error);
        console.error(`Error-Payload: `, payload)
    });
    
    client.lavalink.nodeManager.on("create", (node, payload) => {
        console.log(`The Lavalink Node #${node.id} connected`);
    });
    
    client.lavalink.nodeManager.on("error", (node, error, payload) => {
        console.error(`The Lavalink Node #${node.id} errored: `, error);
        console.error(`Error-Payload: `, payload);
    });
    
    client.on("raw", d => client.lavalink.sendRawData(d)); // send raw data to lavalink-client to handle stuff

    await client.login(token);
}

const handlers = ["error", "event", "mongodbHandler", "slashCommands"];

let loadedHandlerCount = 0; // Initialize a counter for loaded handlers

try {
    handlers.forEach(handlerName => {
        const handler = require(`./src/utils/handlers/${handlerName}.js`);
        handler(client); // Call the function with client
        loadedHandlerCount++; // Increment the counter for each loaded handler
    });
} catch (error) {
    console.error('Failed to load a handler:', error);
}

client.logger.loader(`${client.color.chalkcolor.red('[FINISH]')} ${loadedHandlerCount} handlers loaded`);
// HTTP Server to manage bot actions
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Welcome to the bot management server.');
    }
});

server.listen(80, '0.0.0.0', () => {});

StartBot();