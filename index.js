const { Client, Collection, GatewayIntentBits } = require("discord.js");
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
        await client.lavalink.init(client.user.id, "auto");
    });

    /**
     * Node Events
     * Handles various events emitted by the Lavalink node manager.
     */
    client.lavalink.nodeManager
        .on("raw", (node, payload) => {
            // Handle raw events if needed
            // console.log(`${node.id} :: RAW ::`, payload);
        })
        .on("disconnect", (node, reason) => {
            console.log(`[LAVALINK] ${node.id} :: Disconnected ::`, reason);
        })
        .on("connect", (node) => {
            console.log(`[LAVALINK] ${node.id} :: Connected ::`);
            // Uncomment the line below to test music playback once connected
            // testPlay(client);
        })
        .on("reconnecting", (node) => {
            console.log(`[LAVALINK] ${node.id} :: Reconnecting ::`);
        })
        .on("create", (node) => {
            console.log(`[LAVALINK] ${node.id} :: Created ::`);
        })
        .on("destroy", (node) => {
            console.log(`[LAVALINK] ${node.id} :: Destroyed ::`);
        })
        .on("error", (node, error, payload) => {
            console.log(`[LAVALINK] ${node.id} :: Error ::`, error, ":: Payload ::", payload);
        })
        .on("resumed", (node, payload, players) => {
            // Handle resumed events if needed
            // console.log(`${node.id} :: Resumed ::`, Array.isArray(players) ? players.length : players, "players still playing :: Payload ::", payload);
        });
    
    client.on("raw", d => {
       // console.log('Raw event data:', d);
        client.lavalink.sendRawData(d);
    });

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

StartBot();