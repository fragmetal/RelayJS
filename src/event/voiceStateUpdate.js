const { PermissionFlagsBits, ChannelType } = require('discord.js'); // Added import
const MongoUtilities = require('../utils/db');

module.exports = async (client, oldState, newState) => {
    // Check if the bot is in developer mode
    if (client.devMode === true) {
        return; // Exit if in developer mode
    }

    // Initialize MongoUtilities
    const mongoUtils = new MongoUtilities(client);

    // Ensure MongoDB is connected
    if (!client.mongodb.db) {
        console.log("MongoDB is not connected. Please ensure MongoDB connection is established.");
        return;
    }

    // Check if newState.guild is available
    if (!newState.guild) {
        console.log("Guild is not available.");
        return;
    }

    let guild = newState.guild;

    if (!guild.available) {
        try {
            guild = await guild.fetch();
        } catch (error) {
            console.error("Failed to fetch guild:", error);
            return;
        }
    }
    
    let botMember;
    try {
        botMember = await guild.members.fetch(client.user.id);
    } catch (error) {
        console.error("Failed to fetch bot member data:", error);
        return;
    }

    // Check if the bot has the MANAGE_CHANNELS permission
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        console.error("The bot does not have permission to manage channels.");
        return;
    }

    const settingsArray = await mongoUtils.loadFromDB('voice_channels', { _id: newState.guild.id });
    if (!settingsArray || settingsArray.length === 0 || !settingsArray[0].JoinCreate) {
        return;
    }
    const settings = settingsArray[0];
    if (newState.channelId === settings.JoinCreate) {
        
        const member = newState.member;
        const channelName = member && member.displayName ? `⏳| ${member.displayName}'s` : "⏳| Default Channel";
        const categoryChannel = settings.categoryChannelId;

        // Check if categoryChannel is valid
        if (!categoryChannel) {
            console.error("The channel does not have a parent category.");
            return;
        }

        try {
            // Retrieve the JoinCreate channel to get its permission overwrites
            const joinCreateChannel = await guild.channels.fetch(settings.JoinCreate);
            if (!joinCreateChannel) {
                console.error("Failed to fetch JoinCreate channel.");
                return;
            }

            const newChannel = await guild.channels.create({
                name: channelName, // Ensure the name field is set
                type: ChannelType.GuildVoice,
                parent: categoryChannel,
                permissionOverwrites: [
                    {
                        id: guild.id, // @everyone
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Speak],
                    },
                    {
                        id: member.id, // User
                        allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                    },
                    {
                        id: client.user.id, // Bot
                        allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel]
                    }
                ],
            }).catch(error => {
                console.error('Failed to create new channel:', error);
                return null; // Return null if channel creation fails
            });

            if (!newChannel) return; // Exit if channel creation failed

            // Define the query to find the document by _id
            const query = { _id: newState.guild.id };

            // Define the update object to append to temp_channels
            const update = {
                $push: {
                    temp_channels: {
                        Owner: member.id,
                        TempChannel: newChannel.id,
                        Created: new Date()
                    }
                }
            };
            
            // Use updateDB
            const updateResult = await mongoUtils.updateDB('voice_channels', query, update);
            if (!updateResult) {
                console.error('Failed to update document in DB.');
            }

            if (!botMember.permissions.has(PermissionFlagsBits.MoveMembers)) {
                console.error("The bot does not have permission to move members.");
                return;
            }

            await member.voice.setChannel(newChannel);

        } catch (error) {
            console.error('Failed to create or move to a new channel:', error);
        }
    }
    const channelData = await mongoUtils.fetchVoiceChannelData(oldState.member);
    
    if (oldState.channel && oldState.channel.id !== newState.channelId) {
        const channel = oldState.channel; // Define the channel variable
        if (channel.members.size === 0) { // Check if the channel is empty

            if (channel.id !== settings.JoinCreate && channel.id !== newState.guild.afkChannelId && channelData.tempChannels.some(temp => temp.TempChannel === channel.id)) {
                try {
                    // Check if the bot has permission to delete the channel
                    const botMember = await channel.guild.members.fetch(client.user.id);
                    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
                        console.error("The bot does not have permission to delete channels.");
                        return; // Exit if the bot lacks permission
                    }

                    // Attempt to delete the empty channel
                    await channel.delete();

                    await mongoUtils.updateDB('voice_channels', { _id: channel.guild.id }, {
                        $pull: {
                            temp_channels: { TempChannel: channel.id } // Use channel ID for the pull operation
                        }
                    });
                } catch (error) {
                    console.error(`Failed to delete empty channel: ${channel.name}`, error);
                }
            }
        }
    }
};
