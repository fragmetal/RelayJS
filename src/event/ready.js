const { ActivityType } = require('discord.js'); // Ensure correct imports
const MongoUtilities = require('../utils/db'); // Import the class directly
const createInterface = require('../utils/createInterface'); // Import the function
const http = require('http');

module.exports = async (client) => {
    const mongoUtils = new MongoUtilities(client); // Create an instance of MongoUtilities
    const updateUptime = () => {
        const uptime = process.uptime();
        let uptimeString = '';
    
        if (uptime >= 24 * 60 * 60) {
            const days = Math.floor(uptime / (24 * 60 * 60));
            uptimeString += `${days} d `;
        }
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
        if (hours > 0) {
            uptimeString += `${hours} h `;
        }
        const minutes = Math.floor((uptime % (60 * 60)) / 60);
        uptimeString += `${minutes} m`;
    
        client.user.setActivity('customstatus', { type: ActivityType.Custom, state: '🛠️ USE / [ Uptime: ' + uptimeString + ' ]' });
    };
    
    updateUptime();
    setInterval(updateUptime, 60 * 1000); // Update every 1 minute
    
    client.logger.info(`[!] The bot has ${client.slash.size} (/) commands`);
    client.logger.info(`[!] ${client.user.username} is now started...`);
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

    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <head>
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            font-family: Arial, sans-serif;
                            background-color: #f0f0f0;
                        }
                        h1 {
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <h1>Bot Online</h1>
                </body>
            </html>
        `);
    });

    // Make the server listen on the specified port
    server.listen(3000, () => {});
};