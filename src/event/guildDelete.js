const MongoUtilities = require('../utils/db');
const logger = require('../utils/logger');

module.exports = async (client, guild) => {
    const mongoUtils = new MongoUtilities(client);
    try {
        const deleteResult = await mongoUtils.deleteFromDB('voice_channels', { _id: guild.id });
        
        if (deleteResult) {
            logger.info(`Successfully removed data for guild: ${guild.name} (ID: ${guild.id}) from the database.`);
        } else {
            logger.error(`Failed to remove data for guild: ${guild.name} (ID: ${guild.id}) from the database.`);
        }
    } catch (error) {
        logger.error(`Error removing data for guild: ${guild.name} (ID: ${guild.id}):`, error);
    }
};