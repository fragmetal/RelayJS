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
    const botNode = client.config.botNode;
    const retrievedNodeInfo = await client.mongodb.getLavalinkNodeInfo(botNode);
    // Use retrieved information if it exists, otherwise fall back to default
    const nodeConfig = retrievedNodeInfo || {
        authorization: "BatuManaBisa",
        host: "lavalink.serenetia.com",
        port: 443,
        secure: true,
        _id: "prodnode",
    };

    // If node information does not exist, save the default configuration
    if (!retrievedNodeInfo) {
        const saveResult = await client.mongodb.saveLavalinkNodeInfo(nodeConfig);
        const localNodeConfig = {
            authorization: "youshallnotpass",
            host: "localhost",
            port: 2333,
            secure: false,
            _id: "localnode",
        };
        const saveLocalResult = await client.mongodb.saveLavalinkNodeInfo(localNodeConfig);
        if (saveResult || saveLocalResult) {
            //console.log("Default Lavalink node information saved to MongoDB.");
        } else {
            //console.error("Failed to save default Lavalink node information.");
        }
    }

    // Create Lavalink instance with the node configuration
    client.lavalink = new LavalinkManager({
        nodes: [nodeConfig],
        sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
        autoSkip: true,
        client: {
            id: clientId,
        },
    });

    // if (retrievedNodeInfo) {
        //console.log("Loaded Lavalink node information from MongoDB:", retrievedNodeInfo);
    // } else {
        //console.log("Using default Lavalink node configuration.");
    // }

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
            // client.logger.info(`${client.color.chalkcolor.red('[RAW]')} ${node.id} :: RAW :: ${JSON.stringify(payload)}`);
        })
        .on("disconnect", (node, reason) => {
            //client.logger.loader(`${client.color.chalkcolor.red('[LAVALINK]')} ${node.id} :: Disconnected :: ${reason}`);
            client.logger.info(`${client.color.chalkcolor.red('[LAVALINK]')} ${node.id} :: Disconnected ::`);
        })
        .on("connect", (node) => {
            client.logger.info(`${client.color.chalkcolor.red('[LAVALINK]')} ${node.id} :: Connected ::`);
            // Uncomment the line below to test music playback once connected
            // testPlay(client);
        })
        .on("reconnecting", (node) => {
            client.logger.info(`${client.color.chalkcolor.red('[LAVALINK]')} ${node.id} :: Reconnecting ::`);
        })
        .on("create", (node) => {
            client.logger.info(`${client.color.chalkcolor.red('[LAVALINK]')} ${node.id} :: Created ::`);
        })
        .on("destroy", (node) => {
            client.logger.info(`${client.color.chalkcolor.red('[LAVALINK]')} ${node.id} :: Destroyed ::`);
        })
        .on("error", (node, error, payload) => {
            //client.logger.loader(`${client.color.chalkcolor.red('[LAVALINK]')} ${node.id} :: Error :: ${error} :: Payload :: ${JSON.stringify(payload)}`);
            client.logger.info(`${client.color.chalkcolor.red('[LAVALINK]')} ${node.id} :: Error ::`);
        })
        .on("resumed", (node, payload, players) => {
            // Handle resumed events if needed
            // client.logger.loader(`${client.color.chalkcolor.red('[RESUMED]')} ${node.id} :: Resumed :: ${Array.isArray(players) ? players.length : players} players still playing :: Payload :: ${JSON.stringify(payload)}`);
            client.logger.info(`${client.color.chalkcolor.red('[RESUMED]')} ${node.id} :: Resumed ::`);
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