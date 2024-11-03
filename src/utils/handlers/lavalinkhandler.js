const { Manager } = require("erela.js");
const logger = require('../logger');
const { EmbedBuilder, Colors } = require('discord.js');

class LavalinkHandler {
    constructor(client) {
        client.manager = new Manager({
            nodes: [
                {
                    host: "lavalinkv3-id.serenetia.com", // Lavalink host
                    port: 80,        // Lavalink port
                    password: "BatuManaBisa", // Lavalink password
                },
            ],
            send(id, payload) {
                const guild = client.guilds.cache.get(id);
                if (guild) guild.shard.send(payload);
            },
        });

        client.manager.on("nodeConnect", node => {
            logger.info(`Node ${node.options.identifier} connected`);
        });

        // this.manager.on("nodeError", (node, error) => {
        //     console.error(`Node ${node.options.identifier} had an error: ${error.message}`);
        //     console.error(`Error data: ${JSON.stringify(error, null, 2)}`);
        // });

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
    }
}

module.exports = LavalinkHandler;
