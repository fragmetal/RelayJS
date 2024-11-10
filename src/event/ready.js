const { ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js'); // Ensure correct imports
const MongoUtilities = require('../utils/db'); // Import the class directly
const createInterface = require('../utils/createInterface'); // Import the function
const { formatMS_HHMMSS } = require("../utils/time");
const http = require('http');

const messagesMap = new Map();
const playerCache = new Map();

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
    
        client.user.setActivity('customstatus', { type: ActivityType.Custom, state: '[ Uptime: ' + uptimeString + ' ]' });
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
        if (player && player.guildId) {
            playerCache.set(player.guildId, { player, loop: false });
        } else {
            console.error("Player guildId is undefined. Cannot update cache.");
        }
    })
    .on("playerDestroy", async(player, reason) => {
        const channel = client.channels.cache.get(player.textChannelId);
        if (channel) {
            try {
                let message;
                if (player.currentTrackMessageId) {
                    message = await channel.messages.fetch(player.currentTrackMessageId).catch(() => null);
                }
                if (message && message.editable) {
                    await message.edit({ embeds, components: [buttonsRow1, buttonsRow2] });
                } else {
                    message = await sendPlayerMessage(client, player, { embeds, components: [buttonsRow1, buttonsRow2] }, false);
                    player.currentTrackMessageId = message.id; // Store the message ID
                }
            } catch (error) {
                if (error.code === 10008) {
                    // Log the error less frequently or only once
                    console.error("Message not found, it might have been deleted.");
                } else {
                    console.error("Failed to handle track start message:", error);
                }
            }
        }
        playerCache.delete(player.guildId);
    })
    .on("playerDisconnect", async (player, voiceChannelId) => {
        //logPlayer(client, player, "Player disconnected the Voice Channel :: ", voiceChannelId);
    })
    .on("playerMove", async (player, oldVoiceChannelId, newVoiceChannelId) => {
        //logPlayer(client, player, "Player moved from Voice Channel :: ", oldVoiceChannelId, " :: To ::", newVoiceChannelId);
    })
    .on("playerSocketClosed", async (player, payload) => {
        //logPlayer(client, player, "Player socket got closed from lavalink :: ", payload);
    })
    .on("playerUpdate", async (player) => {
        // Log the player object to inspect its properties
        // console.log("Player object:", player);
        const voiceChannel = client.channels.cache.get(player.voiceChannelId);
        if (voiceChannel && voiceChannel.members.size === 1) {
            player.destroy();
            // console.log(`Bot disconnected from voice channel ${voiceChannel.id} as it was the only member.`);
        }
    })
    .on("playerMuteChange", async (player, selfMuted, serverMuted) => {
        // logPlayer(client, player, "INFO: playerMuteChange", { selfMuted, serverMuted });
        if(serverMuted) {
            player.set("paused_of_servermute", true);
            player.pause();
        } else {
            if(player.get("paused_of_servermute") && player.paused) player.resume();
        }
    })
    .on("playerDeafChange", async (player, selfDeaf, serverDeaf) => {
        //logPlayer(client, player, "INFO: playerDeafChange");
    })
    .on("playerSuppressChange", async (player, suppress) => {
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
    .on("playerQueueEmptyEnd", async (player) => {
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
    .on("playerQueueEmptyCancel", async (player) => {
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
    .on("playerVoiceLeave", async (player, userId) => {
       // logPlayer(client, player, "INFO: playerVoiceLeave: ", userId);
    })
    .on("playerVoiceJoin", async (player, userId) => {
       // logPlayer(client, player, "INFO: playerVoiceJoin: ", userId);
    })
    .on("debug", async (eventKey, eventData) => {
        // if(eventKey === DebugEvents.NoAudioDebug && eventData.message === "Manager is not initiated yet") return;
        // if(eventKey === DebugEvents.PlayerUpdateSuccess && eventData.state === "log") return;
        return;
    });

    client.lavalink.on("trackStart", async (player, track) => {
        //logPlayer(client, player, "Started Playing :: ", track?.info?.title, "QUEUE:", player.queue.tracks.map(v => v.info.title));
        const avatarURL = track?.requester?.avatar || undefined;
        const trackDuration = track?.info?.duration || 0;
    
        const embeds = [
            new EmbedBuilder()
                .setColor("Blurple")
                .setTitle(`🎶 ${track?.info?.title}`.substring(0, 256))
                .setThumbnail(track?.info?.artworkUrl || track?.pluginInfo?.artworkUrl || null)
                .setDescription(
                    [
                        `🎤 **Author:** ${track?.info?.author}`,
                        `⏱️ **Duration:** ${formatMS_HHMMSS(trackDuration)} **|** 🕒 **Ends:** <t:${Math.floor(Date.now() / 1000) + Math.floor(trackDuration / 1000)}:R>`,
                        `🌐 **Source:** ${track?.info?.sourceName}`,
                        `🙋‍♂️ **Requested by:** <@${track?.requester?.id}>`,
                        track?.pluginInfo?.clientData?.fromAutoplay ? `✅ *From Autoplay*` : undefined
                    ].filter(v => typeof v === "string" && v.length).join("\n").substring(0, 4096)
                )
                .setFooter({
                    text: `Requested by ${track?.requester?.username}`,
                    iconURL: /^https?:\/\//.test(avatarURL || "") ? avatarURL : undefined,
                })
                .setTimestamp()
        ];

        if (track?.info?.uri && /^https?:\/\//.test(track?.info?.uri)) embeds[0].setURL(track.info.uri);

        const buttonsRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pause_resume')
                    .setLabel(player.paused ? 'Resume' : 'Pause')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('skip')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setLabel('Stop')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('filters')
                    .setLabel('Filters')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('equalizers')
                    .setLabel('Equalizers')
                    .setStyle(ButtonStyle.Secondary)
            );

        const buttonsRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('loop_playlist')
                    .setLabel(player.loop ? 'Repeat' : 'No Repeat')
                    .setStyle(ButtonStyle.Secondary)
            );

            const channel = client.channels.cache.get(player.textChannelId);
            if (channel) {
            
                let message;
                if (player.currentTrackMessageId) {
                    message = await channel.messages.fetch(player.currentTrackMessageId).catch(() => null);
                }
                if (message && message.editable) {
                    await message.edit({ embeds, components: [buttonsRow1, buttonsRow2] });
                } else {
                    message = await sendPlayerMessage(client, player, { embeds, components: [buttonsRow1, buttonsRow2] }, false);
                    player.currentTrackMessageId = message.id; // Store the message ID
                }
        
            }
        

    })
    .on("trackEnd", async (player, track, payload) => {
        const playerData = playerCache.get(player.guildId);
        
        if (playerData && playerData.loop === true) {
            // Re-add the track to the queue if looping is enabled
            await player.queue.add(track);
        }

        if (player.queue.tracks.length > 0) {
            // Play the next track in the queue
            await player.play();
        } else {
            // If the queue is empty, disconnect the player
            await player.disconnect();
            if (player.currentTrackMessageId) {
                const channel = client.channels.cache.get(player.textChannelId);
                if (channel) {
                    try {
                        const message = await channel.messages.fetch(player.currentTrackMessageId);
                        if (message) await message.delete();
                    } catch (error) {
                        console.error("Failed to delete message:", error);
                    }
                }
            }
            sendPlayerMessage(client, player, {
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Queue Ended")
                        .setTimestamp()
                ]
            }, true);
        }
    })
    .on("trackError", async (player, track, payload) => {
        logPlayer(client, player, "Errored while Playing :: ", track?.info?.title, " :: ERROR DATA :: ", payload)
    })
    .on("trackStuck", async (player, track, payload) => {
        logPlayer(client, player, "Got Stuck while Playing :: ", track?.info?.title, " :: STUCKED DATA :: ", payload)
    })
    .on("queueEnd", async (player, track, payload) => {

        player.disconnect();
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
        //logPlayer(client, player, "No more tracks in the queue, after playing :: ", track?.info?.title || track)
        sendPlayerMessage(client, player, {
            embeds: [
                new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Queue Ended")
                .setTimestamp()
            ]
        }, true);
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

    async function sendPlayerMessage(client, player, messageData, autoDelete = true) {
        const channel = client.channels.cache.get(player.textChannelId);
        if (!channel) return;

        const message = await channel.send(messageData);

        if (autoDelete) {
            setTimeout(() => {
                message.delete().catch(console.error);
            }, 3000);
        }

        return message;
    }

    // Make the server listen on the specified port
    server.listen(2067, () => {});
};