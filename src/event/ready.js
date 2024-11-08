const { ActivityType, EmbedBuilder } = require('discord.js'); // Ensure correct imports
const MongoUtilities = require('../utils/db'); // Import the class directly
const createInterface = require('../utils/createInterface'); // Import the function
const { formatMS_HHMMSS } = require("../utils/time");
const http = require('http');

const messagesMap = new Map();

module.exports = async (client) => {
    const mongoUtils = new MongoUtilities(client); // Create an instance of MongoUtilities
    const updateUptime = () => {
        const uptime = process.uptime();
        let uptimeString = '';
    
        if (uptime >= 24 * 60 * 60) {
            const days = Math.floor(uptime / (24 * 60 * 60));
            uptimeString += `${days} d `;
        }
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
        if (hours > 0) {
            uptimeString += `${hours} h `;
        }
        const minutes = Math.floor((uptime % (60 * 60)) / 60);
        uptimeString += `${minutes} m`;
    
        client.user.setActivity('customstatus', { type: ActivityType.Custom, state: '[ Uptime: ' + uptimeString + ' ] 🛠️ USE / ' });
    };
    
    updateUptime();
    setInterval(updateUptime, 60 * 1000); // Update every 1 minute
    
    client.logger.info(`[!] The bot has ${client.slash.size} (/) commands`);
    client.logger.info(`[!] ${client.user.username} is now started...`);
    const guilds = client.guilds.cache; // Get all guilds the bot is in
    if (guilds.size === 0) {
        console.error('No guilds found.'); // Handle the case where there are no guilds
        return; // Exit if no guilds are available
    }

    for (const guild of guilds.values()) { // Iterate through each guild
        const guildId = guild.id; // Get the current guild ID
        const existingDocument = await mongoUtils.getVoiceChannelConfig(guildId); // Call the method on the instance
        if (existingDocument) {
            // Use the createInterface function
            const dashboardChannelId = existingDocument.vc_dashboard;
            const channel = await client.channels.fetch(dashboardChannelId);

            if (channel) {
                await createInterface(channel); // Call the function to create the interface
            } else {
                console.error(`Dashboard channel not found for guild: ${guild.name}.`);
            }
        }
    }

    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <head>
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            font-family: Arial, sans-serif;
                            background-color: #f0f0f0;
                        }
                        h1 {
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <h1>Bot Online</h1>
                </body>
            </html>
        `);
    });

    client.lavalink.on("playerCreate", (player) => {
        //logPlayer(client, player, "Created a Player :: ");
    })
    .on("playerDestroy", (player, reason) => {
        //logPlayer(client, player, "Player got Destroyed :: ");
        sendPlayerMessage(client, player, {
            embeds: [
                new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Player Destroyed")
                .setDescription(`Reason: ${reason || "Unknown"}`)
                .setTimestamp()
            ]
        });
    })
    .on("playerDisconnect", (player, voiceChannelId) => {
        //logPlayer(client, player, "Player disconnected the Voice Channel :: ", voiceChannelId);
    })
    .on("playerMove", (player, oldVoiceChannelId, newVoiceChannelId) => {
        //logPlayer(client, player, "Player moved from Voice Channel :: ", oldVoiceChannelId, " :: To ::", newVoiceChannelId);
    })
    .on("playerSocketClosed", (player, payload) => {
        //logPlayer(client, player, "Player socket got closed from lavalink :: ", payload);
    })
    .on("playerUpdate", (player) => {
        // use this event to update the player in your cache if you want to save the player's data(s) externally!
    })
    .on("playerMuteChange", (player, selfMuted, serverMuted) => {
        // logPlayer(client, player, "INFO: playerMuteChange", { selfMuted, serverMuted });
        if(serverMuted) {
            player.set("paused_of_servermute", true);
            player.pause();
        } else {
            if(player.get("paused_of_servermute") && player.paused) player.resume();
        }
    })
    .on("playerDeafChange", (player, selfDeaf, serverDeaf) => {
        //logPlayer(client, player, "INFO: playerDeafChange");
    })
    .on("playerSuppressChange", (player, suppress) => {
        //logPlayer(client, player, "INFO: playerSuppressChange");
    })
    .on("playerQueueEmptyStart", async (player, delayMs) => {
        //logPlayer(client, player, "INFO: playerQueueEmptyStart");
        const msg = await sendPlayerMessage(client, player, {
            embeds: [
                new EmbedBuilder()
                    .setDescription(`Player queue got empty, will disconnect <t:${Math.round((Date.now() + delayMs) / 1000)}:R>`)
            ]
        });
        if(msg) messagesMap.set(`${player.guildId}_queueempty`, msg);
    })
    .on("playerQueueEmptyEnd", (player) => {
        //logPlayer(client, player, "INFO: playerQueueEmptyEnd");
        const msg = messagesMap.get(`${player.guildId}_queueempty`);
        if(msg?.editable) {
            msg.edit({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`Player got destroyed because of queue Empty`)
                ]
            })
        }
    })
    .on("playerQueueEmptyCancel", (player) => {
        //logPlayer(client, player, "INFO: playerQueueEmptyEnd");
        const msg = messagesMap.get(`${player.guildId}_queueempty`);
        if(msg?.editable) {
            msg.edit({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`Player queue empty timer got cancelled. Because I got enqueued a new track`)
                ]
            })
        }
    })
    .on("playerVoiceLeave", (player, userId) => {
       // logPlayer(client, player, "INFO: playerVoiceLeave: ", userId);
    })
    .on("playerVoiceJoin", (player, userId) => {
       // logPlayer(client, player, "INFO: playerVoiceJoin: ", userId);
    })
    .on("debug", (eventKey, eventData) => {
        // if(eventKey === DebugEvents.NoAudioDebug && eventData.message === "Manager is not initiated yet") return;
        // if(eventKey === DebugEvents.PlayerUpdateSuccess && eventData.state === "log") return;
        return;
    });

    client.lavalink.on("trackStart", async (player, track) => {
        const avatarURL = track?.requester?.avatar || undefined;

        //logPlayer(client, player, "Started Playing :: ", track?.info?.title, "QUEUE:", player.queue.tracks.map(v => v.info.title));

        const embeds = [
            new EmbedBuilder()
            .setColor("Blurple")
            .setTitle(`🎶 ${track?.info?.title}`.substring(0, 256))
            .setThumbnail(track?.info?.artworkUrl || track?.pluginInfo?.artworkUrl || null)
            .setDescription(
                [
                    `> - **Author:** ${track?.info?.author}`,
                    `> - **Duration:** ${formatMS_HHMMSS(track?.info?.duration || 0)} | Ends <t:${Math.floor((Date.now() + (track?.info?.duration || 0)) / 1000)}:R>`,
                    `> - **Source:** ${track?.info?.sourceName}`,
                    `> - **Requester:** <@${track?.requester?.id}>`,
                    track?.pluginInfo?.clientData?.fromAutoplay ? `> *From Autoplay* ✅` : undefined
                ].filter(v => typeof v === "string" && v.length).join("\n").substring(0, 4096)
            )
            .setFooter({
                text: `Requested by ${track?.requester?.username}`,
                iconURL: /^https?:\/\//.test(avatarURL || "") ? avatarURL : undefined,
            })
            .setTimestamp()
        ];
        if(track?.info?.uri && /^https?:\/\//.test(track?.info?.uri)) embeds[0].setURL(track.info.uri)

        const message = await sendPlayerMessage(client, player, { embeds });
        player.currentTrackMessageId = message.id; // Store the message ID
    })
    .on("trackEnd", async (player, track, payload) => {
        // logPlayer(client, player, "Finished Playing :: ", track?.info?.title);

        // Delete the last track's message
        if (player.currentTrackMessageId) {
            const channel = client.channels.cache.get(player.textChannelId);
            if (channel) {
                try {
                    const message = await channel.messages.fetch(player.currentTrackMessageId);
                    if (message)
                        await message.delete();
                } catch (error) {
                    console.error("Failed to delete message:", error);
                }
            }
        }
    })
    .on("trackError", (player, track, payload) => {
        logPlayer(client, player, "Errored while Playing :: ", track?.info?.title, " :: ERROR DATA :: ", payload)
    })
    .on("trackStuck", (player, track, payload) => {
        logPlayer(client, player, "Got Stuck while Playing :: ", track?.info?.title, " :: STUCKED DATA :: ", payload)
    })
    .on("queueEnd", (player, track, payload) => {
        logPlayer(client, player, "No more tracks in the queue, after playing :: ", track?.info?.title || track)
        sendPlayerMessage(client, player, {
            embeds: [
                new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Queue Ended")
                .setTimestamp()
            ]
        });
    });

    function logPlayer(client, player, ...messages) {
        console.group("Player Event");
            console.log(`| Guild: ${player.guildId} | ${client.guilds.cache.get(player.guildId)?.name}`);
            console.log(`| Voice Channel: #${(client.channels.cache.get(player.voiceChannelId) || {}).name || player.voiceChannelId}`);
            console.group("| Info:")
                console.log(...messages);
            console.groupEnd();
        console.groupEnd();
        return;
    }

    async function sendPlayerMessage(client, player, messageData) {
        const channel = client.channels.cache.get(player.textChannelId);
        if(!channel) return;

        return channel.send(messageData);
    }
    // Make the server listen on the specified port
    server.listen(2067, () => {});
};