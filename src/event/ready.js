const { ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js'); // Ensure correct imports including EmbedBuilder
const MongoUtilities = require('../utils/db'); // Import the class directly

module.exports = async (client) => {
    const mongoUtils = new MongoUtilities(client); // Create an instance of MongoUtilities

    client.logger.info(`[!] The bot has ${client.slash.size} (/) commands`);
    client.logger.info(`[!] ${client.user.username} is now started...`);
    client.user.setActivity('customstatus', { type: ActivityType.Custom, state: '🛠️ USE /' });

    const guildId = client.guilds.cache.first().id; // Use the first guild ID for demonstration
    const existingDocument = await mongoUtils.getVoiceChannelConfig(guildId); // Call the method on the instance
    if (!existingDocument) {
        console.error('No configuration found for this server.');
        return;
    }

    const dashboardChannelId = existingDocument.vc_dashboard; // Get the ID of the dashboard channel
    const channel = await client.channels.fetch(dashboardChannelId);

    if (!channel) { // Check if the channel is a text channel
        console.error('Dashboard channel not found or is not a text channel.');
        return;
    }

    // Explanation of button functionalities with enhanced visibility
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
};
