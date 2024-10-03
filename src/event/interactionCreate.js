const { Collection, ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, InteractionResponse, SelectMenuBuilder } = require('discord.js');
const MongoUtilities = require('../utils/db');
// Initialize cooldowns collection
const cooldowns = new Collection();

module.exports = async (client, interaction) => {
    // Check if the bot is in developer mode
    if (client.devMode === true && interaction.commandName !== 'dev') {
        await interaction.deferReply({ ephemeral: true });
        await interaction.editReply({ content: 'Developer mode is currently active. You cannot use any commands except for /dev.', ephemeral: true });
        setTimeout(() => {
            interaction.deleteReply().catch(console.error);
        }, 6000);
        return; // Exit if in developer mode and not the /dev command
    }

    const mongoUtils = new MongoUtilities(client);
    if (interaction.isCommand()) {
        if (!interaction.guild) return;
        if (!client.slash.has(interaction.commandName)) return;

        const command = client.slash.get(interaction.commandName);
        try {
            if (!cooldowns.has(command.name)) { cooldowns.set(command.name, new Collection()); }

            const now = Date.now();
            const timestamps = cooldowns.get(command.name);
            const cooldownAmount = (command.cooldown || 2) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: `Wait ${timeLeft.toFixed(1)} more second${timeLeft.toFixed(1) < 2 ? '' : 's'} to use **${command.name}**` });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
            }
            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
            if (command.permissions) {
                const missingPermissions = command.permissions.filter(perm => !interaction.member.permissions.has(BigInt(perm)));
                if (missingPermissions.length > 0) {
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: `You're missing permissions: ${missingPermissions.join(', ')}` });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
            }
            await command.run(client, interaction, mongoUtils); // Pass mongoUtils to the command

        } catch (e) {
            console.log(e);
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ content: 'An error has occurred', ephemeral: true });
            setTimeout(() => {
                interaction.deleteReply().catch(console.error);
            }, 6000);
        }
    } else if (interaction.isButton()) {
        // Fetch the tempChannel data once for all cases
        const voiceChannelData = await mongoUtils.fetchVoiceChannelData(interaction.member);
        const voiceChannel = interaction.member.voice.channel; // Get the voice channel the member is in
        const channelId = voiceChannel ? voiceChannel.id : null; // Get the ID of the voice channel

        // Find the tempChannel based on the voice channel ID
        const tempChannel = voiceChannelData.tempChannels.find(channel => channel.TempChannel === channelId);
        
        // Handle button interactions
        switch (interaction.customId) {
            case 'name':
                if (!interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: 'You clicked the Name button!' });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                break;
            case 'limit':
                if (!tempChannel) {
                    if (!interaction.replied) {
                        await interaction.deferReply({ ephemeral: true });
                        await interaction.editReply({ content: 'Channel not found. Please try again.', ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                    }
                    return;
                }

                if (interaction.member.id !== tempChannel.Owner) {
                    if (!interaction.replied) {
                        await interaction.deferReply({ ephemeral: true });
                        await interaction.editReply({ content: 'You are not the owner of this channel and cannot set the limit.', ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                    }
                    return;
                }

                const modal = new ModalBuilder()
                    .setCustomId('set_channel_limit_modal')
                    .setTitle('Set Channel Limit');

                const limitInput = new TextInputBuilder()
                    .setCustomId('channel_limit_input')
                    .setLabel('Enter the channel limit:')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('0 = unlimited users, 99 = max users')
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(limitInput);
                modal.addComponents(row);
                if (!interaction.replied || !interaction.deferred) {
                    await interaction.showModal(modal);
                }

                // Listen for the modal submit interaction
                const filter = (i) => i.customId === 'set_channel_limit_modal' && i.user.id === interaction.user.id;
                const submittedInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 }).catch(console.error);

                if (submittedInteraction) {
                    const limitValue = parseInt(submittedInteraction.fields.getTextInputValue('channel_limit_input'), 10); // Parse as integer
                    // Check if the input is a valid number
                    if (!isNaN(limitValue) && limitValue >= 0 && limitValue <= 99) { // Ensure limit is within valid range
                        // Retrieve the actual voice channel object using the channel ID
                        const channel = interaction.guild.channels.cache.get(tempChannel.TempChannel);

                        if (channel) {
                            if (channel.type === 2) { // Ensure it's a voice channel (type 2)
                                try {
                                    await channel.setUserLimit(limitValue);
                                    if (!submittedInteraction.replied) {
                                        await submittedInteraction.reply({ content: `Channel limit successfully set to ${limitValue}!`, ephemeral: true });
                                    }
                                    setTimeout(() => {
                                        submittedInteraction.deleteReply().catch(console.error);
                                    }, 6000);
                                } catch (error) {
                                    console.error('Error setting user limit:', error);
                                    if (!submittedInteraction.replied) {
                                        await submittedInteraction.reply({ content: 'Failed to set channel limit due to an error.', ephemeral: true });
                                    }
                                    setTimeout(() => {
                                        submittedInteraction.deleteReply().catch(console.error);
                                    }, 6000);
                                }
                            } else {
                                if (!submittedInteraction.replied) {
                                    await submittedInteraction.reply({ content: 'Failed to set channel limit. This channel is not a voice channel.', ephemeral: true });
                                }
                                setTimeout(() => {
                                    submittedInteraction.deleteReply().catch(console.error);
                                }, 6000);
                            }
                        } else {
                            if (!submittedInteraction.replied) {
                                await submittedInteraction.reply({ content: 'Failed to set channel limit. Channel not found.', ephemeral: true });
                            }
                            setTimeout(() => {
                                submittedInteraction.deleteReply().catch(console.error);
                            }, 6000);
                        }
                    } else {
                        if (!submittedInteraction.replied) {
                            await submittedInteraction.reply({ content: 'Please enter a valid number for the channel limit (0-99).', ephemeral: true });
                        }
                        setTimeout(() => {
                            submittedInteraction.deleteReply().catch(console.error);
                        }, 6000);
                    }
                } else {
                    if (!interaction.replied) {
                        await interaction.reply({ content: 'Interaction has expired or was not submitted in time. Please try again.', ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                    }
                }
                break;
            case 'privacy':
                if (!interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: 'You clicked the Privacy button!', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                break; 
            case 'invite':
                if (!interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: 'You clicked the Invite button!', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                break;
            case 'kick':
                if (!interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: 'You clicked the Kick button!', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                break;
            case 'claim':
                if (!interaction.replied) {
                    const voiceChannel = interaction.member.voice.channel;
                    await interaction.deferReply({ ephemeral: true });
                    
                    // Check if the member is in a temp voice channel
                    if (!voiceChannel) {
                        await interaction.editReply({ content: 'You are not in any temporary voice channel to claim.', ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                        return;
                    }

                    // Ensure tempChannel is defined
                    if (!tempChannel) {
                        await interaction.editReply({ content: 'No temporary channel found for this voice channel.', ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                        return;
                    }

                    const currentOwner = tempChannel.Owner;

                    if (voiceChannel.members.has(currentOwner)) {
                        await interaction.editReply({ content: `<@${currentOwner}> is still in the voice channel and cannot be claimed.`, ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                        return;
                    }

                    // Update the owner in the database
                    const newOwnerId = interaction.member.id; // The current member becomes the new owner
                    await mongoUtils.updateDB('voice_channels', { _id: interaction.member.guild.id, 'temp_channels.TempChannel': tempChannel.TempChannel }, { 'temp_channels.$.Owner': newOwnerId });
                    await interaction.editReply({ content: 'You have successfully claimed your temporary channel!', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                break;
            case 'transfer':
                if (!interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                    const member = interaction.member;
                    const voiceChannel = member.voice.channel;

                    if (!voiceChannel) {
                        await interaction.editReply({ content: 'You are not in a voice channel.', ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                        return;
                    }
                    if (!tempChannel.TempChannel) {
                        await interaction.editReply({ content: 'You do not own any temporary channel.', ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                        return;
                    }
                    // Fetch users in the voice channel except the owner
                    const users = voiceChannel.members.filter(user => user.id !== member.id).map(user => user.user);
                    const userOptions = users.map(user => ({
                        label: user.username,
                        value: user.id,
                    }));

                    // Create a dropdown menu for selecting a new owner
                    const selectMenu = {
                        type: 1,
                        components: [{
                            type: 3,
                            custom_id: 'select_owner',
                            options: userOptions,
                            placeholder: 'Select a new owner you have 15 seconds to select',
                        }],
                    };

                    await interaction.editReply({ content: 'Select a new owner:', components: [selectMenu], ephemeral: true });

                    // Handle the selection of a new owner
                    const filter = i => i.customId === 'select_owner' && i.user.id === member.id;
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

                    collector.on('collect', async i => {
                        const newOwnerId = i.values[0];

                        // Update the owner in the database
                        await mongoUtils.updateDB('voice_channels', { _id: member.guild.id, 'temp_channels.TempChannel': channelId }, { 'temp_channels.$.Owner': newOwnerId });

                        await i.update({ content: `Ownership transferred to <@${newOwnerId}>`, components: [] });
                        setTimeout(() => {
                            i.deleteReply().catch(console.error);
                        }, 6000);
                        collector.stop();
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await interaction.editReply({ content: 'No selection made, transfer cancelled.', ephemeral: true });
                            setTimeout(() => {
                                interaction.deleteReply().catch(console.error);
                            }, 6000);
                        }
                    });
                }
                break;
            case 'delete':
                if (!interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: 'You clicked the Delete button!', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                break;
            default:
                await interaction.deferReply({ ephemeral: true });
                await interaction.editReply({ content: 'Unknown action!', ephemeral: true });
                setTimeout(() => {
                    interaction.deleteReply().catch(console.error);
                }, 6000);
        }
    }
};