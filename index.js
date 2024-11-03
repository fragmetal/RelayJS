const { Client, Collection, GatewayIntentBits } = require("discord.js");
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

const { EmbedBuilder, Colors } = require('discord.js');

// Assuming `client` is already defined in index.js
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

client.manager.on("nodeConnect", node => {
    client.logger.info(`Node ${node.options.identifier} connected`);
});

client.manager.on("trackStart", async (player) => {
    try {
        function format(millis) {
            try {
                var h = Math.floor(millis / 3600000),
                    m = Math.floor(millis / 60000),
                    s = ((millis % 60000) / 1000).toFixed(0);
                if (h < 1) return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s + " | " + (Math.floor(millis / 1000)) + " Seconds";
                else return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s + " | " + (Math.floor(millis / 1000)) + " Seconds";
            } catch (e) {
                console.log(String(e.stack).bgRed);
            }
        }

        function createBar(player) {
            if (!player.queue.current) return `**"[""🔘""▬".repeat(size - 1)}]**\n**00:00:00 / 00:00:00**`;
            let current = player.queue.current.duration !== 0 ? player.position : player.queue.current.duration;
            let total = player.queue.current.duration;
            let size = 15;
            let bar = String("| ") + String("🔘").repeat(Math.round(size * (current / total))) + String("▬").repeat(size - Math.round(size * (current / total))) + String(" |");
            return `**${bar}**\n**${new Date(player.position).toISOString().substr(11, 8) + " / " + (player.queue.current.duration == 0 ? " ◉ LIVE" : new Date(player.queue.current.duration).toISOString().substr(11, 8))}**`;
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

        // Check if there's an existing message to edit
        if (player.nowPlayingMessage) {
            const message = await channel.messages.fetch(player.nowPlayingMessage);
            return message.edit({
                embeds: [new EmbedBuilder()
                    .setAuthor({ name: `Current song playing:`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setThumbnail(`https://img.youtube.com/vi/${player.queue.current.identifier}/mqdefault.jpg`)
                    .setURL(player.queue.current.uri)
                    .setColor(Colors.Green)
                    .setTitle(`🎶 **${player.queue.current.title}** 🎶`)
                    .addFields(
                        { name: `🕰️ Duration: `, value: `\`${format(player.queue.current.duration)}\``, inline: true },
                        { name: `🎼 Song By: `, value: `\`${player.queue.current.author}\``, inline: true },
                        { name: `🔢 Queue length: `, value: `\`${player.queue.length} Songs\``, inline: true },
                        { name: `🎛️ Progress: `, value: createBar(player) }
                    )
                    .setFooter({ text: `Requested by: ${player.queue.current.requester.tag}`, iconURL: player.queue.current.requester.displayAvatarURL({ dynamic: true }) })
                ]
            });
        } else {
            // Send a new message and store its ID
            const sentMessage = await channel.send({
                embeds: [new EmbedBuilder()
                    .setAuthor({ name: `Current song playing:`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setThumbnail(`https://img.youtube.com/vi/${player.queue.current.identifier}/mqdefault.jpg`)
                    .setURL(player.queue.current.uri)
                    .setColor(Colors.Green)
                    .setTitle(`🎶 **${player.queue.current.title}** 🎶`)
                    .addFields(
                        { name: `🕰️ Duration: `, value: `\`${format(player.queue.current.duration)}\``, inline: true },
                        { name: `🎼 Song By: `, value: `\`${player.queue.current.author}\``, inline: true },
                        { name: `🔢 Queue length: `, value: `\`${player.queue.length} Songs\``, inline: true },
                        { name: `🎛️ Progress: `, value: createBar(player) }
                    )
                    .setFooter({ text: `Requested by: ${player.queue.current.requester.tag}`, iconURL: player.queue.current.requester.displayAvatarURL({ dynamic: true }) })
                ]
            });
            player.nowPlayingMessage = sentMessage.id;
        }
    } catch (e) {
        console.log(String(e.stack).bgRed);
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

client.manager.on("queueEnd", player => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send("Queue has ended.").then(msg => {
        setTimeout(() => msg.delete(), 5000);
    });
    player.destroy();
});

client.once("ready", () => {
    client.manager.init(client.user.id);
});

client.on("raw", d => client.manager.updateVoiceState(d));

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