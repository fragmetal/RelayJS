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
        //console.error("JoinCreate channel ID not found in the database.");
        return;
    }
    const settings = settingsArray[0];
    if (newState.channelId === settings.JoinCreate) {
        
        const member = newState.member;
        const channelName = member && member.displayName ? `⏳| ${member.displayName}'s` : "⏳| Default Channel";

        const categoryChannel = newState.channel.parent;

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
            const permissionOverwrites = joinCreateChannel.permissionOverwrites.cache.map(overwrite => {
                return {
                    id: overwrite.id,
                    allow: overwrite.allow ? overwrite.allow.toArray() : [], // Check if allow is not null
                    deny: overwrite.deny ? overwrite.deny.toArray() : [] // Check if deny is not null
                };
            });

            const newChannel = await guild.channels.create({
                name: channelName, // Ensure the name field is set
                type: ChannelType.GuildVoice,
                parent: categoryChannel,
                permissionOverwrites: [
                    ...permissionOverwrites, // Apply the permission overwrites from JoinCreate
                    {
                        id: member.id,
                        allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                    },
                    {
                        id: client.user.id,
                        allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect],
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
    const channelData = await mongoUtils.fetchVoiceChannelData(oldState.member); // Fetch channel data from the database
    // Check if the channel has become empty
    if (oldState.channel && !newState.channel) {
        const channel = oldState.channel; // Define the channel variable
        console.log(`Check if the channel has become empty`);
        if (channel.members.size === 0) { // Check if the channel is empty
            if (channel.id !== settings.JoinCreate && channel.id !== newState.guild.afkChannelId && channelData.tempChannels.some(temp => temp.TempChannel === channel.id)) {
                // Check if any owner's channels are not empty
                const ownerChannelsNotEmpty = await Promise.all(channelData.tempChannels.map(async temp => {
                    const ownerChannel = await oldState.guild.channels.fetch(temp.TempChannel).catch(err => {
                        console.error(`Failed to fetch channel with ID ${temp.TempChannel}:`, err);
                        return null; // Return null if fetching fails
                    }); // Fetch the channel by ID
                    return ownerChannel && ownerChannel.members.size > 0; // Check if the channel exists and has members
                }));

                console.log(`Check if any of the channels are not empty`);
                // Check if any channel is not empty
                if (!ownerChannelsNotEmpty.some(isNotEmpty => isNotEmpty)) { // Only delete if no other channels are occupied
                    try {
                        console.log(`Deleting empty channel: ${channel.name}`);
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
    }
};