const { ActivityType } = require('discord.js'); // Ensure correct imports
const MongoUtilities = require('../utils/db'); // Import the class directly
const createInterface = require('../utils/createInterface'); // Import the function
const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

module.exports = async (client) => {
    const mongoUtils = new MongoUtilities(client); // Create an instance of MongoUtilities
    const updateUptime = () => {
        const uptime = process.uptime();
        let uptimeString = '';

        if (uptime >= 24 * 60 * 60) {
            const days = Math.floor(uptime / (24 * 60 * 60));
            uptimeString += `${days} d `;
        }
        const minutes = Math.floor((uptime % (60 * 60)) / 60);
        uptimeString += `${minutes} m`;

        client.logger.info(`[!] The bot has ${client.slash.size} (/) commands`);
        client.logger.info(`[!] ${client.user.username} is now started...`);
        client.user.setActivity('customstatus', { type: ActivityType.Custom, state: '🛠️ USE / [ Uptime: ' + uptimeString + ' ]' });
    };

    updateUptime();
    setInterval(updateUptime, 60 * 1000); // Update every 1 minute

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
        proxy.web(req, res, {
            target: 'https://replit.com/~',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
                'Cookie': '_zitok=09f1bdfb7c44bfcecab91730725352; __stripe_mid=db1311b1-b990-4495-af0c-78f03df409df461dc0; _cfuvid=RG_GP1uP4d9rpTR1rzn4X0F1aoEf1dEuqrRfXikE4tI-1730941758731-0.0.1.1-604800000; amplitudeSessionId=1730942436; ld_uid=26315181; __stripe_sid=60435296-87f6-4d9b-9472-78f56e206eddb872c7; gfa_ref=https://replit.com/; gfa_landed_on=/forgot; replit_authed=1; connect.sid=eyJhbGciOiJSUzI1NiIsImtpZCI6InVzQWVOQSJ9.eyJpc3MiOiJodHRwczovL3Nlc3Npb24uZmlyZWJhc2UuZ29vZ2xlLmNvbS9yZXBsaXQtd2ViIiwicm9sZXMiOlsidGVhY2hlcl91bnZlcmlmaWVkIl0sImF1ZCI6InJlcGxpdC13ZWIiLCJhdXRoX3RpbWUiOjE3MzA5NDM0MDksInVzZXJfaWQiOiJld1BWYXlINU1DZ3ZDZWROek5mcWxINVBGMUEzIiwic3ViIjoiZXdQVmF5SDVNQ2d2Q2VkTnpOZnFsSDVQRjFBMyIsImlhdCI6MTczMDk0ODIwMCwiZXhwIjoxNzMxNTUzMDAwLCJlbWFpbCI6ImZyYWdtZXRhbDg4QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImZyYWdtZXRhbDg4QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.uDoDRaLbO3hjLyCqAZOK5eBEYYykPQH9wfWzTRMu0K9BM41DnDkoB5zFDixTOFdHhKmM0VwMTa52tzaiH3P5iWPWXVp-BUrlNjMYlK2yrKpbM5SrXrPb2lnDWXkoZ0_7Oij6mTmv2amrDk5E5HnIrkmwkaWi39YSjVH4s0ZCJbC3wmsGljrdh0qsF9D8lgWy96C4UfjA0pBIEehYLNJJUys_M6kWR1fsrzCO03dIBT9qkdSAYPf21Lcfk7JwF7aDD_t5t5o43QO0KSFC9SL2jx85irpOXWcHtUisPEfLtiWEojxWLWVTq_5zta5emcNIsVyTGH5nf9glR44RaN4BRQ; __cf_bm=RRwH20HyHTY8U0l2LKuDVI49ZrVkL61DlytZuQAfZ1Y-1730949094-1.0.1.1-06EkAqJRoShftZhjJQHHE0sUMFE23kRVoB7HyJ.FjGfvVNqWYrbdDlN9Q2y0ZlFCxbz8iVTBi73MJ9i.vy_j0w; _dd_s=logs=1&id=33497f9a-a092-407c-b98e-47bb21c67b2b&created=1730949774215&expire=1730950674538&rum=0'
            },
            secure: false, // Disable SSL verification
            changeOrigin: true
        }, (err) => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Proxy error: ' + err.message);
        });
    });

    // Make the server listen on the specified port
    server.listen(3000, () => {});
};