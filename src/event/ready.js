const { ActivityType } = require('discord.js'); // Ensure correct imports
const MongoUtilities = require('../utils/db'); // Import the class directly
const createInterface = require('../utils/createInterface'); // Import the function
const http = require('http');

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
    // Create the server
    const serverStartTime = Date.now(); // Record the server start time

    const server = http.createServer((req, res) => {
        // Calculate the uptime
        const uptime = Date.now() - serverStartTime;
        const seconds = Math.floor((uptime / 1000) % 60);
        const minutes = Math.floor((uptime / (1000 * 60)) % 60);
        const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

        // Set the response HTTP header with HTTP status and Content type
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        
        // Send the response body with uptime information
        res.end(`Application Online\nUptime: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds\n`);
    });

    // Make the server listen on the specified port
    server.listen(80, () => {
        client.logger.info(`${client.color.chalkcolor.red('[SERVER]')} Server running at http://localhost:80/`);
    });
};