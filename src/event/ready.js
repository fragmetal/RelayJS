const { ActivityType } = require('discord.js'); // Ensure correct imports
const MongoUtilities = require('../utils/db'); // Import the class directly
const createInterface = require('../utils/createInterface'); // Import the function
module.exports = async (client) => {

    const mongoUtils = new MongoUtilities(client); // Create an instance of MongoUtilities

    client.logger.info(`[!] The bot has ${client.slash.size} (/) commands`);
    client.logger.info(`[!] ${client.user.username} is now started...`);
    client.user.setActivity('customstatus', { type: ActivityType.Custom, state: '🛠️ USE /' });

    const guilds = client.guilds.cache; // Get all guilds the bot is in
    if (guilds.size === 0) {
        console.error('No guilds found.'); // Handle the case where there are no guilds
        return; // Exit if no guilds are available
    }

    for (const guild of guilds.values()) { // Iterate through each guild
        const guildId = guild.id; // Get the current guild ID
        const existingDocument = await mongoUtils.getVoiceChannelConfig(guildId); // Call the method on the instance
        if (existingDocument) {
            // Use the createInterface function
            const dashboardChannelId = existingDocument.vc_dashboard;
            const channel = await client.channels.fetch(dashboardChannelId);

            if (channel) {
                await createInterface(channel); // Call the function to create the interface
            } else {
                console.error(`Dashboard channel not found for guild: ${guild.name}.`);
            }
        }
    }
};