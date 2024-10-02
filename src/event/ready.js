const { ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js'); // Ensure correct imports including EmbedBuilder
const MongoUtilities = require('../utils/db'); // Import the class directly
const createInterface = require('../utils/createInterface'); // Import the function

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

    // Use the createInterface function
    const dashboardChannelId = existingDocument.vc_dashboard;
    const channel = await client.channels.fetch(dashboardChannelId);

    if (channel) {
        await createInterface(channel); // Call the function to create the interface
    }
};
