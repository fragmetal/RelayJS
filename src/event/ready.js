const { ActivityType } = require('discord.js');

module.exports = async (client) => {
    client.logger.info(`[!] The bot have ${client.commandes.size} commands and ${client.slash.size} (/) commands`)
    client.logger.info(`[!] ${client.user.username} is now started...`)
    client.user.setActivity('customstatus', { type: ActivityType.Custom, state: '🚀 USE /' });
};
