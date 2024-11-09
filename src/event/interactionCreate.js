const { Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextInputBuilder, ModalBuilder, TextInputStyle, StringSelectMenuBuilder, PermissionFlagsBits, CommandInteractionOptionResolver } = require('discord.js');
const MongoUtilities = require('../utils/db');
// Initialize cooldowns collection
const cooldowns = new Collection();

module.exports = async (client, interaction) => {
    const mongoUtils = new MongoUtilities(client);
    const voiceChannel = interaction.member.voice.channel;

    if (interaction.isCommand()) {
        if (!interaction.guild) return;
        if (!client.slash.has(interaction.commandName)) return;

        const command = client.slash.get(interaction.commandName);
        if (!cooldowns.has(command.name)) { cooldowns.set(command.name, new Collection()); }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 2) * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                if (!interaction.replied) {
                    await interaction.editReply({ content: `Wait ${timeLeft.toFixed(1)} more second${timeLeft.toFixed(1) < 2 ? '' : 's'} to use **${command.name}**` });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                return;
            }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        if (command.permissions) {
            const missingPermissions = command.permissions.filter(perm => !interaction.member.permissions.has(BigInt(perm)));
            if (missingPermissions.length > 0) {
                if (!interaction.replied) {
                    await interaction.reply({ content: `You're missing permissions: ${missingPermissions.join(', ')}`, ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                return;
            }
        }
        await command.run(client, interaction, mongoUtils); // Pass mongoUtils to the command
    } else if (interaction.isContextMenuCommand()) {
        // Handle context menu commands
        const command = client.slash.get(interaction.commandName);
        if (!command) return;

        await command.execute(interaction);
    } else if (interaction.isButton()) {
        const player = client.lavalink.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: 'No player found.', ephemeral: true });

        // Fetch the tempChannel data once for all cases
        const voiceChannelData = await mongoUtils.fetchVoiceChannelData(interaction.member);
        const channelId = voiceChannel ? voiceChannel.id : null; // Get the ID of the voice channel

        // Find the tempChannel based on the voice channel ID
        const tempChannel = voiceChannelData.tempChannels.find(channel => channel.TempChannel === channelId);

        // Handle other button interactions (e.g., limit, privacy, etc.)
        switch (interaction.customId) {
            case 'skip':
                if (player && typeof player.skip === 'function') {
                    player.skip();
                    await interaction.reply({ content: 'Track skipped.', ephemeral: true });
        
                } else {
                    await interaction.reply({ content: 'No more tracks to skip.', ephemeral: true });
                }
                setTimeout(() => {
                    interaction.deleteReply().catch(console.error);
                }, 3000);
                break;
            case 'stop':
                if (player && typeof player.destroy === 'function') {
                    player.destroy(); // Use destroy if stop is not available
                    await interaction.reply({ content: 'Player stopped and destroyed.', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Unable to stop player. Player not found or method not available.', ephemeral: true });
                }
                setTimeout(() => {
                    interaction.deleteReply().catch(console.error);
                }, 3000);
                break;
            case 'pause_resume':
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferUpdate();
                }

                if (player.paused) {
                    player.resume();
                } else {
                    player.pause();
                }

                // Create a new ActionRow with updated buttons
                const updatedButtons = new ActionRowBuilder()
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
                                .setStyle(ButtonStyle.Secondary)
                        );

                return interaction.editReply({ components: [updatedButtons] });
            case 'filters':
                let string = "";
                switch ((interaction.options instanceof CommandInteractionOptionResolver ? interaction.options : {}).getString("filter")) {
                    case "clear": await player.filterManager.resetFilters(); string = "Disabled all Filter-Effects"; break;
                    case "lowpass": await player.filterManager.toggleLowPass(); string = player.filterManager.filters.lowPass ? "Applied Lowpass Filter-Effect" : "Disabled Lowpass Filter-Effect"; break;
                    case "nightcore": await player.filterManager.toggleNightcore(); string = player.filterManager.filters.nightcore ? "Applied Nightcore Filter-Effect, ||disabled Vaporwave (if it was active)||" : "Disabled Nightcore Filter-Effect"; break;
                    case "vaporwave": await player.filterManager.toggleVaporwave(); string = player.filterManager.filters.vaporwave ? "Applied Vaporwave Filter-Effect, ||disabled Nightcore (if it was active)||" : "Disabled Vaporwave Filter-Effect"; break;
                    case "karaoke": await player.filterManager.toggleKaraoke(); string = player.filterManager.filters.karaoke ? "Applied Karaoke Filter-Effect" : "Disabled Karaoke Filter-Effect"; break;
                    case "rotation": await player.filterManager.toggleRotation(); string = player.filterManager.filters.rotation ? "Applied Rotation Filter-Effect" : "Disabled Rotation Filter-Effect"; break;
                    case "tremolo": await player.filterManager.toggleTremolo(); string = player.filterManager.filters.tremolo ? "Applied Tremolo Filter-Effect" : "Disabled Tremolo Filter-Effect"; break;
                    case "vibrato": await player.filterManager.toggleVibrato(); string = player.filterManager.filters.vibrato ? "Applied Vibrato Filter-Effect" : "Disabled Vibrato Filter-Effect"; break;
                    case "echo": await player.filterManager.lavalinkLavaDspxPlugin.toggleEcho(); string = player.filterManager.filters.lavalinkLavaDspxPlugin.echo ? "Applied Echo Filter-Effect" : "Disabled Echo Filter-Effect"; break;
                    case "highPass": await player.filterManager.lavalinkLavaDspxPlugin.toggleHighPass(); string = player.filterManager.filters.lavalinkLavaDspxPlugin.highPass ? "Applied HighPass Filter-Effect" : "Disabled HighPass Filter-Effect"; break;
                    case "lowPass": await player.filterManager.lavalinkLavaDspxPlugin.toggleLowPass(); string = player.filterManager.filters.lavalinkLavaDspxPlugin.lowPass ? "Applied LowPass Filter-Effect" : "Disabled LowPass Filter-Effect"; break;
                    case "normalization": await player.filterManager.lavalinkLavaDspxPlugin.toggleNormalization(); string = player.filterManager.filters.lavalinkLavaDspxPlugin.normalization ? "Applied Normalization Filter-Effect" : "Disabled Normalization Filter-Effect"; break;
                }
                await interaction.reply({
                    content: `✅ ${string}`
                });
                setTimeout(() => {
                    interaction.deleteReply().catch(console.error);
                }, 6000);
                break;
            case 'limit':
                if (!voiceChannel) {
                    await interaction.reply({ content: 'You are not in any temporary voice channel to perform this action.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
                if (!tempChannel) {
                    await interaction.reply({ content: 'No temporary channel found for this voice channel.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                if (interaction.member.id !== tempChannel.Owner) {
                    await interaction.reply({ content: 'You are not the owner of this channel and cannot set the limit.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
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

                const limitRow = new ActionRowBuilder().addComponents(limitInput);
                modal.addComponents(limitRow);
                
                await interaction.showModal(modal);

                // Listen for the modal submit interaction
                const limitFilter = (i) => i.customId === 'set_channel_limit_modal' && i.user.id === interaction.user.id;
                const submittedInteraction = await interaction.awaitModalSubmit({ filter: limitFilter, time: 60000 }).catch(console.error);

                if (submittedInteraction) {
                    const limitValue = parseInt(submittedInteraction.fields.getTextInputValue('channel_limit_input'), 10); // Parse as integer
                    // Check if the input is a valid number
                    if (!isNaN(limitValue) && limitValue >= 0 && limitValue <= 99) { // Ensure limit is within valid range
                        // Retrieve the actual voice channel object using the channel ID
                        const channel = interaction.guild.channels.cache.get(tempChannel.TempChannel);

                        if (channel) {
                            if (channel.type === 2) { // Ensure it's a voice channel (type 2)
                                await channel.setUserLimit(limitValue);
                                if (!submittedInteraction.replied) {
                                    await submittedInteraction.reply({ content: `Channel limit successfully set to ${limitValue}!`, ephemeral: true });
                                }
                                setTimeout(() => {
                                    submittedInteraction.deleteReply().catch(console.error);
                                }, 6000);
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
                    await interaction.reply({ content: 'Interaction has expired or was not submitted in time. Please try again.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                }
                break;
                
            case 'privacy':
                if (!voiceChannel) {
                    await interaction.reply({ content: 'You are not in any temporary voice channel to perform this action.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                if (!tempChannel) {
                    await interaction.reply({ content: 'No temporary channel found for this voice channel.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                if (interaction.member.id !== tempChannel.Owner) {
                    await interaction.reply({ content: 'You are not the owner of this channel and cannot use this action.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                const privacyOptions = [
                    {
                        label: 'Hide Voice Channel',
                        value: 'hide',
                    },
                    {
                        label: 'Show Voice Channel',
                        value: 'show',
                    },
                    {
                        label: 'Lock Voice Channel',
                        value: 'lock',
                    },
                    {
                        label: 'Unlock Voice Channel',
                        value: 'unlock',
                    },
                ];

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('privacy_select')
                    .setPlaceholder('Select a privacy option')
                    .addOptions(privacyOptions);

                const privacyRow = new ActionRowBuilder().addComponents(selectMenu);

                await interaction.reply({ content: 'Select a privacy option:', components: [privacyRow], ephemeral: true });

                const privacyFilter = (i) => i.customId === 'privacy_select' && i.user.id === interaction.user.id;
                const privacyCollector = interaction.channel.createMessageComponentCollector({ filter: privacyFilter, time: 15000 });

                privacyCollector.on('collect', async i => {
                    try {
                        const privacyValue = i.values[0];
                        switch (privacyValue) {
                            case 'hide':
                                if (!voiceChannel.permissionOverwrites.cache.get(voiceChannel.guild.roles.everyone.id)?.deny.has(PermissionFlagsBits.ViewChannel)) {
                                    await i.update({ content: 'Voice channel hidden.', components: [] });
                                    await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
                                        [PermissionFlagsBits.ViewChannel]: false,
                                    });
                                } else {
                                    await i.update({ content: 'Voice channel is already hidden.', components: [] });
                                }
                                break;
                            case 'show':
                                if (voiceChannel.permissionOverwrites.cache.get(voiceChannel.guild.roles.everyone.id)?.deny.has(PermissionFlagsBits.ViewChannel)) {
                                    await i.update({ content: 'Voice channel shown.', components: [] });
                                    await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
                                        [PermissionFlagsBits.ViewChannel]: true,
                                    });
                                } else {
                                    await i.update({ content: 'Voice channel is already visible.', components: [] });
                                }
                                break;
                            case 'lock':
                                if (!voiceChannel.permissionOverwrites.cache.get(voiceChannel.guild.roles.everyone.id)?.deny.has(PermissionFlagsBits.Connect)) {
                                    await i.update({ content: 'Voice channel locked.', components: [] });
                                    await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
                                        [PermissionFlagsBits.Connect]: false,
                                    });
                                } else {
                                    await i.update({ content: 'Voice channel is already locked.', components: [] });
                                }
                                break;
                            case 'unlock':
                                if (voiceChannel.permissionOverwrites.cache.get(voiceChannel.guild.roles.everyone.id)?.deny.has(PermissionFlagsBits.Connect)) {
                                    await i.update({ content: 'Voice channel unlocked.', components: [] });
                                    await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
                                        [PermissionFlagsBits.Connect]: true,
                                    });
                                } else {
                                    await i.update({ content: 'Voice channel is already unlocked.', components: [] });
                                }
                                break;
                            default:
                                await i.update({ content: 'Invalid privacy option selected.', components: [] });
                                break;
                        }
                        setTimeout(() => {
                            i.deleteReply().catch(console.error);
                        }, 6000);
                        privacyCollector.stop();
                    } catch (error) {
                        console.error('Error handling privacy interaction:', error);
                        await i.update({ content: 'An error occurred while handling the privacy interaction.', components: [] });
                        setTimeout(() => {
                            i.deleteReply().catch(console.error);
                        }, 6000);
                        privacyCollector.stop();
                    }
                });

                privacyCollector.on('end', async collected => {
                    if (collected.size === 0) {
                        await interaction.editReply({ content: 'No selection made, privacy option not changed.', components: [], ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                    }
                });
                break;
            case 'invite':
                if (!voiceChannel) {
                    await interaction.reply({ content: 'You are not in any temporary voice channel to perform this action.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
                if (!tempChannel) {
                    await interaction.reply({ content: 'No temporary channel found for this voice channel.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
                await interaction.reply({ content: 'Coming soon!', ephemeral: true });
                setTimeout(() => {
                    interaction.deleteReply().catch(console.error);
                }, 6000);
                break;
            case 'kick':
                if (!voiceChannel) {
                    await interaction.reply({ content: 'You are not in any temporary voice channel to perform this action.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
                if (!tempChannel) {
                    await interaction.reply({ content: 'No temporary channel found for this voice channel.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
                await interaction.reply({ content: 'Coming soon!', ephemeral: true });
                setTimeout(() => {
                    interaction.deleteReply().catch(console.error);
                }, 6000);
                break;
            case 'claim':
                if (!voiceChannel) {
                    await interaction.reply({ content: 'You are not in any temporary voice channel to claim.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                if (!tempChannel) {
                    await interaction.reply({ content: 'No temporary channel found for this voice channel.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                if (voiceChannel.members.has(tempChannel.Owner)) {
                    await interaction.reply({ content: `<@${tempChannel.Owner}> is still in the voice channel and cannot be claimed.`, ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                const newOwnerId = interaction.member.id;
                const oldOwnerId = tempChannel.Owner;

                // Update permissions on the voice channel
                await voiceChannel.permissionOverwrites.delete(oldOwnerId);

                // Set new owner's permission overwrites
                await voiceChannel.permissionOverwrites.edit(newOwnerId, {
                    [PermissionFlagsBits.Connect]: true,
                    [PermissionFlagsBits.ManageChannels]: true,
                });

                await mongoUtils.updateDB('voice_channels', { _id: interaction.member.guild.id, 'temp_channels.TempChannel': tempChannel.TempChannel }, { 'temp_channels.$.Owner': newOwnerId });
                await interaction.reply({ content: 'You have successfully claimed your temporary channel!', ephemeral: true });

                setTimeout(() => {
                    interaction.deleteReply().catch(console.error);
                }, 6000);
                break;
            case 'transfer':
                if (!voiceChannel) {
                    await interaction.reply({ content: 'You are not in any temporary voice channel to perform this action.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                // Fetch the tempChannel from your database or context
                if (!tempChannel.TempChannel) {
                    await interaction.reply({ content: 'You do not own any temporary channel.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                // Fetch users in the voice channel except the owner
                const users = voiceChannel.members.filter(user => user.id !== interaction.member.id).map(user => user.user);
                const userOptions = users.map(user => ({
                    label: user.username,
                    value: user.id,
                }));

                // Check if there are users to transfer ownership to
                if (userOptions.length === 0) {
                    await interaction.reply({ content: 'There are no other members in the voice channel to transfer ownership to.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }

                // Create a dropdown menu for selecting a new owner
                const transferSelectMenu = {
                    type: 1,
                    components: [{
                        type: 3,
                        custom_id: 'select_owner',
                        options: userOptions,
                        placeholder: 'Select a new owner (you have 15 seconds to select)',
                    }],
                };

                await interaction.reply({ content: 'Select a new owner:', components: [transferSelectMenu], ephemeral: true });

                // Handle the selection of a new owner
                const transferFilter = i => i.customId === 'select_owner' && i.user.id === interaction.member.id;
                const transferCollector = interaction.channel.createMessageComponentCollector({ filter: transferFilter, time: 15000 });

                transferCollector.on('collect', async i => {
                    const newOwnerId = i.values[0];
                    const oldOwnerId = tempChannel.Owner;

                    // Remove old owner's permission overwrites
                    await voiceChannel.permissionOverwrites.delete(oldOwnerId);

                    // Set new owner's permission overwrites
                    await voiceChannel.permissionOverwrites.edit(newOwnerId, {
                        [PermissionFlagsBits.Connect]: true,
                        [PermissionFlagsBits.ManageChannels]: true,
                    });

                    // Update the owner in the database
                    await mongoUtils.updateDB('voice_channels', { _id: interaction.member.guild.id, 'temp_channels.TempChannel': tempChannel.TempChannel }, { 'temp_channels.$.Owner': newOwnerId });

                    await i.update({ content: `Ownership transferred to <@${newOwnerId}>`, components: [] });

                    setTimeout(() => {
                        i.deleteReply().catch(console.error);
                    }, 6000);
                    transferCollector.stop();
                });

                transferCollector.on('end', async collected => {
                    if (collected.size === 0) {
                        await interaction.editReply({ content: 'No selection made, transfer cancelled.', ephemeral: true });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 6000);
                    }
                });
                break;
            case 'delete':
                if (!voiceChannel) {
                    await interaction.reply({ content: 'You are not in any temporary voice channel to perform this action.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
                if (!tempChannel) {
                    await interaction.reply({ content: 'No temporary channel found for this voice channel.', ephemeral: true });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
                await interaction.reply({ content: 'Coming soon!', ephemeral: true });
                setTimeout(() => {
                    interaction.deleteReply().catch(console.error);
                }, 6000);
                break;
            default:
                await interaction.reply({ content: 'Unknown action!', ephemeral: true });
                setTimeout(() => {
                    interaction.deleteReply().catch(console.error);
                }, 6000);
                
        }
    }
};