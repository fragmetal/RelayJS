const { Collection, ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require('discord.js');
const MongoUtilities = require('../utils/db');
// Initialize cooldowns collection
const cooldowns = new Collection();

module.exports = async (client, interaction) => {
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
                    interaction.editReply({ content: `You're missing permissions: ${missingPermissions.join(', ')}` });
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 6000);
                    return;
                }
            }
            command.run(client, interaction);

        } catch (e) {
            console.log(e);
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ content: 'An error has occurred', ephemeral: true });
            setTimeout(() => {
                interaction.deleteReply().catch(console.error);
            }, 6000);
        }
    } else if (interaction.isButton()) {
        if (!interaction.member.voice.channel) {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ content: 'You must be in a voice channel to use this action.' });
            setTimeout(() => {
                interaction.deleteReply().catch(console.error);
            }, 6000);
            return;
        }
        // Fetch voice channel data using the new method
        const voiceChannelData = await mongoUtils.fetchVoiceChannelData(interaction.member);
        // Check if tempChannels exists and is an array
        const tempChannels = voiceChannelData.tempChannels; // Access the tempChannels array

        // Assuming you want to get the first temp channel or handle it accordingly
        const tempChannel = tempChannels.length > 0 ? tempChannels[0] : null; // Get the first temp channel or null

        if (!tempChannel) {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ content: 'This is not a temporary channel.', ephemeral: true });
            setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
            return;
        }

        switch (interaction.customId) {
            case 'lock_channel':
                await interaction.deferReply({ ephemeral: true });
                await interaction.editReply({ content: 'Channel locked!' });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'unlock_channel':
                await interaction.deferReply({ ephemeral: true });
                await interaction.editReply({ content: 'Channel unlocked!' });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'hide_channel':
                await interaction.deferReply({ ephemeral: true });
                await interaction.editReply({ content: 'Channel hidden!' });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'show_channel':
                await interaction.deferReply({ ephemeral: true });
                await interaction.editReply({ content: 'Channel shown!' });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'claim_channel':
                await interaction.deferReply({ ephemeral: true });
                await interaction.editReply({ content: 'Channel claimed!' });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'limit_channel':
                const channelId = tempChannel.TempChannel;
                const channel = await interaction.guild.channels.fetch(channelId);
                if(interaction.member.id !== tempChannel.TempOwner) {
                    //await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: 'You are not the owner of this channel and cannot set the limit.', ephemeral: true });
                    setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                    return;
                }
                const modal = new ModalBuilder()
                    .setCustomId('set_channel_limit_modal')
                    .setTitle('Set Channel Limit');

                const limitInput = new TextInputBuilder()
                    .setCustomId('channel_limit_input')
                    .setLabel('Enter the channel limit:')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('e.g., 5')
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(limitInput);
                modal.addComponents(row);
                await interaction.showModal(modal);

                // Listen for the modal submit interaction
                const filter = (i) => i.customId === 'set_channel_limit_modal' && i.user.id === interaction.user.id;
                const submittedInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 }).catch(console.error);

                if (submittedInteraction) {
                    const limitValue = submittedInteraction.fields.getTextInputValue('channel_limit_input');

                    if (tempChannel.TempChannel === channel.id) {
                        await channel.setUserLimit(limitValue);
                        await submittedInteraction.deferReply({ ephemeral: true });
                        await submittedInteraction.editReply({ content: `Channel limit set to ${limitValue}!` });
                        setTimeout(() => submittedInteraction.deleteReply().catch(console.error), 6000);
                    } else {
                        await submittedInteraction.reply({ content: 'Failed to set channel limit. This channel is not a voice channel.', ephemeral: true });
                        setTimeout(() => submittedInteraction.deleteReply().catch(console.error), 6000);
                    }
                }
                break;
            default:
                await interaction.deferReply({ ephemeral: true });
                await interaction.editReply({ content: 'Unknown action!' });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
        }
    }
};