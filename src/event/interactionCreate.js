const { Collection, ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, InteractionResponse } = require('discord.js');
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
        // Fetch the tempChannel data
        const voiceChannelData = await mongoUtils.fetchVoiceChannelData(interaction.member);
        const tempChannel = voiceChannelData.tempChannels.find(channel => channel.Owner === interaction.member.id);
        const channelId = tempChannel ? tempChannel.TempChannel : null; // Ensure tempChannel is defined

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
                if (channelId) {
                    const channel = interaction.guild.channels.cache.get(channelId); // Use cache instead of fetch
                    if (!channel) {
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
                    if(!interaction.replied || !interaction.deferred) {
                        await interaction.showModal(modal);
                    }

                    // Listen for the modal submit interaction
                    const filter = (i) => i.customId === 'set_channel_limit_modal' && i.user.id === interaction.user.id;
                    const submittedInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 }).catch(console.error);

                    if (submittedInteraction) {
                        const limitValue = submittedInteraction.fields.getTextInputValue('channel_limit_input');
                        // Check if the input is a valid number
                        if (!isNaN(limitValue) && limitValue.trim() !== '') {
                            if (channel) {
                                await channel.setUserLimit(limitValue);
                                await submittedInteraction.reply({ content: `Channel limit successfully set to ${limitValue}!`, ephemeral: true });
                                setTimeout(() => {
                                    submittedInteraction.deleteReply().catch(console.error);
                                }, 6000);
                            } else {
                                await submittedInteraction.reply({ content: 'Failed to set channel limit. This channel is not a voice channel.', ephemeral: true });
                                setTimeout(() => {
                                    submittedInteraction.deleteReply().catch(console.error);
                                }, 6000);
                            }
                        } else {
                            await submittedInteraction.reply({ content: 'Please enter a valid number for the channel limit.', ephemeral: true });
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
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: 'You clicked the Claim button!', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                break;
            case 'transfer':
                if (!interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: 'You clicked the Transfer button!', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
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