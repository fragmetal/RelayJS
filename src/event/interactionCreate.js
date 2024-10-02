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
        // Handle button interactions
        switch (interaction.customId) {
            case 'name':
                // Handle name button logic
                await interaction.reply({ content: 'Name button clicked!', ephemeral: true });
                break;
            case 'limit':
                const channelId = tempChannel.TempChannel;
                const channel = await interaction.guild.channels.fetch(channelId);
                
                if (interaction.member.id !== tempChannel.Owner) {
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({ content: 'You are not the owner of this channel and cannot set the limit.' });
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
                    } else {
                        await submittedInteraction.reply({ content: 'Failed to set channel limit. This channel is not a voice channel.', ephemeral: true });
                    }
                }
                break;
            case 'privacy':
                // Handle privacy button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Privacy button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'waiting':
                // Handle waiting button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Waiting button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'trust':
                // Handle trust button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Trust button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'untrust':
                // Handle untrust button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Untrust button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'invite':
                // Handle invite button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Invite button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'kick':
                // Handle kick button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Kick button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'region':
                // Handle region button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Region button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'thread':
                // Handle thread button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Thread button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'claim':
                // Handle transfer button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Claim button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'transfer':
                // Handle transfer button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Transfer button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            case 'delete':
                // Handle delete button logic
                await interaction.deferReply({ ephemeral: true });
                await interaction.reply({ content: 'Delete button clicked!', ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
                break;
            default:
                await interaction.deferReply({ ephemeral: true });
                await interaction.editReply({ content: 'Unknown action!' });
                setTimeout(() => interaction.deleteReply().catch(console.error), 6000);
        }
    }
};