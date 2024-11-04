const { Client, Collection, EmbedBuilder, Colors, GatewayIntentBits } = require("discord.js");
const http = require('http');
const { Manager } = require("erela.js");

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

server.listen(443, '0.0.0.0', () => {
    //client.logger.info('Web Server running');
});

client.manager = new Manager({
    nodes: [
        {
            host: "lavalinkv3-id.serenetia.com",
            port: 443,
            password: "BatuManaBisa",
            secure: true,
        },
    ],
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
});

client.manager.on("nodeError", (node, error) => {
    client.logger.warn(`Node ${node.options.identifier} encountered an error: ${error.message}`)
});

client.manager.on("nodeConnect", node => {
    client.logger.info(`Node ${node.options.identifier} connected`);
});

client.manager.on("nodeReconnect", node => {
    client.logger.info(`Node ${node.options.identifier} is attempting to connect`);
});

client.manager.on("trackStart", async (player) => {
    try {
        function format(millis) {
            const h = Math.floor(millis / 3600000);
            const m = Math.floor(millis / 60000) % 60;
            const s = ((millis % 60000) / 1000).toFixed(0);
            return h < 1 
                ? `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s} | ${Math.floor(millis / 1000)} Seconds`
                : `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s} | ${Math.floor(millis / 1000)} Seconds`;
        }

        function getQueueList(player) {
            if (!player.queue || player.queue.size === 0) return 'No more songs in queue.';
            const queueList = player.queue.map((track, index) => `${index + 1}. [${track.title}](${track.uri})`);
            const maxLength = 1024;
            let result = '';
            for (const item of queueList) {
                if ((result + item + '\n').length > maxLength) break;
                result += item + '\n';
            }
            return result.trim();
        }

        const channel = client.channels.cache.get(player.textChannel);
        if (!player.queue.current) {
            return channel.send({
                embeds: [new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle(`Error | There is nothing playing`)
                ]
            });
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Current song playing:`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(`https://img.youtube.com/vi/${player.queue.current.identifier}/mqdefault.jpg`)
            .setURL(player.queue.current.uri)
            .setColor(Colors.Green)
            .setTitle(`🎶 **${player.queue.current.title}** 🎶`)
            .addFields(
                { name: `🕰️ Duration: `, value: `\`${format(player.queue.current.duration)}\``, inline: true },
                { name: `🎼 Song By: `, value: `\`${player.queue.current.author}\``, inline: true },
                { name: `🔢 Queue length: `, value: `\`${player.queue.length} Songs\``, inline: true },
                { name: `📜 Upcoming Songs:`, value: getQueueList(player) }
            )
            .setFooter({ text: `Requested by: ${player.queue.current.requester.tag}`, iconURL: player.queue.current.requester.displayAvatarURL({ dynamic: true }) });

        if (player.nowPlayingMessage) {
            const message = await channel.messages.fetch(player.nowPlayingMessage);
            return message.edit({ embeds: [embed] });
        } else {
            const sentMessage = await channel.send({ embeds: [embed] });
            player.nowPlayingMessage = sentMessage.id;
        }
    } catch (e) {
        //console.error(e);
        const channel = client.channels.cache.get(player.textChannel);
        return channel.send({
            embeds: [new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle(`ERROR | An error occurred`)
                .setDescription(`\`\`\`${e.message}\`\`\``)
            ]
        });
    }
});

client.manager.on("queueEnd", async (player) => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send("Queue has ended.").then(msg => {
        setTimeout(() => msg.delete(), 5000);
    });
    if (player.nowPlayingMessage) {
        try {
            const message = await channel.messages.fetch(player.nowPlayingMessage);
            if (message) await message.delete();
        } catch (e) {
            client.logger.error(`Failed to delete now playing message: ${e.message}`);
        }
    }
    player.destroy();
});

client.once("ready", () => {
    client.manager.init(client.user.id);
});

client.on("raw", d => client.manager.updateVoiceState(d));

client.login(client.config.token);