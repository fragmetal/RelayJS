const { ChannelType, PermissionFlagsBits } = require('discord.js'); // Import ChannelType
const MongoUtilities = require('../../utils/db'); // Updated path

module.exports = {
    name: 'setup',
    description: 'Setup command for initial configuration.',
    dir: "admin",
    cooldown: 5, // Cooldown in seconds
    permissions: [8],
    options: [
        {
            name: 'create',
            description: 'Create new voice and text channels within a specified category',
            type: 1, // Type for SUB_COMMAND
            options: [] // Removed options for create command
        },
        {
            name: 'delete',
            description: 'Delete channels or configurations',
            type: 1, // Type for SUB_COMMAND
            options: []
        }
    ],

    run: async (client, interaction) => {
        if (!interaction.guild) {
            return await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true }); // Acknowledge the interaction

        await interaction.guild.members.fetch(); // Ensure all members are fetched

        // Fetch the bot member to check permissions
        let botMember;
        try {
            botMember = await interaction.guild.members.fetch(client.user.id);
        } catch (error) {
            console.error("Failed to fetch bot member data:", error);
            return await interaction.editReply({ content: "Failed to fetch bot member data." });
        }

        // Check if the interaction is in a category
        const categoryChannel = interaction.guild.channels.cache.find(channel => channel.type === ChannelType.GuildCategory);

        // Check if a category exists and log the result
        if (categoryChannel) {
            const botPermissionsInCategory = categoryChannel.permissionsFor(interaction.guild.me);
            
            // Check if botPermissionsInCategory is valid
            if (botPermissionsInCategory) {
                console.log('Bot Permissions in Category:', botPermissionsInCategory.toArray());

                // Check if the bot has the MANAGE_CHANNELS permission in the category
                if (!botPermissionsInCategory.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.editReply({ content: "I do not have permission to manage channels in this category." });
                }
            }
        } else {
            console.log("No category channel found. Skipping category permission check.");
            // Perform a check for global permissions even if no category exists
            if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return await interaction.editReply({ content: "I do not have permission to manage channels globally." });
            }
        }

        // Check if the bot has the MANAGE_CHANNELS permission globally
        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return await interaction.editReply({ content: "I do not have permission to manage channels." });
        }

        const mongoUtils = new MongoUtilities(client);
        const subCommand = interaction.options.getSubcommand();
        
        if (subCommand === 'create') {
            try {
                // Create a new category channel named 'Temp Channels'
                const newCategoryChannel = await interaction.guild.channels.create({
                    name: 'Temp Channels',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, // Everyone role
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages], // Allow viewing the category
                        },
                    ],
                });

                // Sync roles to the category
                const roles = interaction.guild.roles.cache.filter(role => role.id !== interaction.guild.id); // Exclude @everyone
                const rolePermissions = roles.map(role => ({
                    id: role.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages], // Allow viewing and sending messages
                }));

                // Add bot role permissions
                const botRole = botMember.roles.highest; // Get the highest role of the bot
                if (botRole) {
                    rolePermissions.push({
                        id: botRole.id,
                        allow: [
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.MoveMembers
                        ],
                    });
                } else {
                    console.error("Bot role not found.");
                }

                // Define channels to create with lowercase names
                const channelsToCreate = [
                    {
                        name: 'dashboard',
                        type: ChannelType.GuildText,
                    },
                    {
                        name: 'gamechat',
                        type: ChannelType.GuildText,
                    },
                    {
                        name: 'Join To Create',
                        type: ChannelType.GuildVoice,
                    }
                ];

                const createdChannels = [];

                // Create channels individually
                for (const channelData of channelsToCreate) {
                    try {
                        const channel = await interaction.guild.channels.create({
                            name: channelData.name,
                            type: channelData.type,
                            parent: newCategoryChannel.id,
                            permissionOverwrites: [
                                ...rolePermissions,
                                {
                                    id: interaction.guild.id,
                                    allow: [PermissionFlagsBits.ViewChannel], // Allow @everyone to view the channel
                                },
                            ],
                        });
                        createdChannels.push(channel); // Store created channel
                    } catch (error) {
                        console.error(`Failed to create channel ${channelData.name}:`, error);
                        await interaction.editReply({ content: `Failed to create channel ${channelData.name}. Please try again.` });
                        return; // Exit if any channel creation fails
                    }
                }

                // Ensure channels were created before accessing their IDs
                const gameChatChannel = createdChannels.find(channel => channel.name === 'gamechat'); // Match the exact name
                const joinCreateChannel = createdChannels.find(channel => channel.name === 'Join To Create'); // Match the exact name
                const dashboardChannel = createdChannels.find(channel => channel.name === 'dashboard'); // Match the exact name

                // Save only the Dashboard and Join To Create channels to the database
                const dbDocument = {
                    _id: interaction.guild.id,
                    gamechat: gameChatChannel ? gameChatChannel.id : null,
                    JoinCreate: joinCreateChannel ? joinCreateChannel.id : null,
                    vc_dashboard: dashboardChannel ? dashboardChannel.id : null,
                    temp_channels: []
                };

                const explanation = '**♾️ Limit Channel** - Menetapkan batas jumlah pengguna di voice ini.\n\n' +
                                    '**🔒 Lock Channel** - Coming Soon!\n\n' +
                                    '**🔓 Unlock Channel** - Coming Soon!\n\n' +
                                    '**👁️‍🗨️ Hide Channel** - Coming Soon!\n\n' +
                                    '**👁️ Show Channel** - Coming Soon!\n\n' +
                                    '**🏷️ Claim Channel** - Coming Soon!\n\n';

                const row1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('lock_channel')
                            .setLabel('🔒 Lock')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('unlock_channel')
                            .setLabel('🔓 Unlock')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('hide_channel')
                            .setLabel('👁️‍🗨️ Hide')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('show_channel')
                            .setLabel('👁️ Show')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('claim_channel')
                            .setLabel('🏷️ Claim')
                            .setStyle(ButtonStyle.Secondary)
                    );

                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('limit_channel')
                            .setLabel('♾️ Limit')
                            .setStyle(ButtonStyle.Secondary)
                    );

                // Delete the previous message if exists
                const messages = await channel.messages.fetch({ limit: 1 });
                if (messages.size > 0) {
                    await messages.first().delete();
                }

                await channel.send({
                    content: '**__Channel Control Panel__**',
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle('**__Channel Management__**')
                            .setDescription(explanation)
                            .setTimestamp()
                    ],
                    components: [row1, row2] // Send both action rows
                });

                const saveResult = await mongoUtils.saveToDB('voice_channels', dbDocument);
                if (saveResult && saveResult.insertedId) {
                    await interaction.editReply({ content: `Channels created successfully. Save result ID: ${saveResult.insertedId}.` });
                } else {
                    await interaction.editReply({ content: 'Failed to save channel information. Please try again.' });
                }
            } catch (error) {
                console.error('Error creating channels:', error);
                await interaction.editReply({ content: 'Failed to create channels. Please try again.' });
            }
        } else if (subCommand === 'delete') {
            const dbCollection = 'voice_channels';
            const query = { _id: interaction.guild.id };
            const existingDocument = await mongoUtils.loadFromDB(dbCollection, query);

            if (!existingDocument || existingDocument.length === 0) {
                await interaction.editReply({ content: 'No configuration found for this server.' });
                return;
            }
            
            const dashboardChannelId = existingDocument[0].vc_dashboard; // Get the ID of the dashboard channel
            const joinCreateChannelId = existingDocument[0].JoinCreate; // Get the ID of the join create channel
            const gameChatChannelId = existingDocument[0].gamechat; // Get the ID of the gamechat channel

            const channelsToDelete = [dashboardChannelId, joinCreateChannelId, gameChatChannelId];

            // Delete the dashboard, join create, and gamechat channels
            const deleteCategoryPromises = channelsToDelete.map(async (channelId) => {
                const channelToDelete = interaction.guild.channels.cache.get(channelId);
                if (channelToDelete) {
                    try {
                        await channelToDelete.delete();
                    } catch (error) {
                        console.error(`Failed to delete channel: ${channelToDelete.name}`, error);
                    }
                }
            });
            
            const tempChannels = existingDocument[0].temp_channels;

            // Only send a message if there are temporary channels to delete
            if (tempChannels.length > 0) {
                await interaction.editReply({ content: 'Deleting temporary channels...' });
            } else {
                await interaction.editReply({ content: 'No temporary channels to delete.' });
            }

            await Promise.all(deleteCategoryPromises);

            // Delete all temporary channels
            const deletePromises = tempChannels.map(async (tempChannel) => {
                const channelToDeleteId = tempChannel.TempChannel; // Get the ID of the temp channel
                const channelToDelete = interaction.guild.channels.cache.get(channelToDeleteId);

                if (channelToDelete) {
                    try {
                        await channelToDelete.delete();
                    } catch (error) {
                        console.error(`Failed to delete channel: ${channelToDelete.name}`, error);
                    }
                }
            });

            await Promise.all(deletePromises);

            // Remove all temp channels from the database
            const deleteResult = await mongoUtils.deleteFromDB('voice_channels', { _id: interaction.guild.id });

            if (deleteResult) {
                await interaction.editReply({ content: 'All specified channels deleted successfully.' });
            } else {
                await interaction.editReply({ content: 'Failed to remove channels from the database. Please try again.' });
            }
        }
    }
};