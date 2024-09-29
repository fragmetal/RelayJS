const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fastify = require('fastify')(); // Import Fastify

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

//SET COLLECTION
client.slash = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();

//SET UTILS
client.logger = require('./src/utils/logger');
client.color = require('./src/utils/color.js');

//SET CONFIG
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
client.logger.loader(`${client.color.chalkcolor.red('[FINISH]')} ${loadedHandlerCount} handlers loaded`)

client.login(client.config.token);

// Fastify route example
fastify.get('/', async (request, reply) => {
    return { message: 'Hello from Fastify!' };
});

// Start Fastify server on port 8080
fastify.listen(8080, (err, address) => {
    if (err) {
        client.logger.error(err);
        process.exit(1);
    }
    client.logger.info(`Fastify server listening at ${address}`);
});