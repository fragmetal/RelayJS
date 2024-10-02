const logger = require('./logger');

class MongoUtilities {
    constructor(client) {
        this.client = client;
        this.mongodbHandler = client.mongodb;
    }

    async loadFromDB(collectionName, query) {
        // Ensure query has _id
        if (!query || !query._id) {
            logger.error('_id is missing from the query object.');
            return null; // Early return if _id is not present
        }
        try {
            const collection = await this.mongodbHandler.getCollection(collectionName);
            if (!collection) {
                logger.error('Failed to load collection:', collectionName);
                return null;
            }
            return await collection.find(query).toArray();
        } catch (error) {
            logger.error('Failed to load data from DB:', error.message);
            return null;
        }
    }

    async saveToDB(collectionName, document) {
        // Ensure document has _id
        if (!document || !document._id) {
            logger.error('_id is missing from the document object.');
            return null; // Early return if _id is not present
        }
        try {
            const collection = await this.mongodbHandler.getCollection(collectionName);
            if (!collection) {
                logger.error('Failed to load collection:', collectionName);
                return null;
            }
            const result = await collection.insertOne(document);
            return result;
        } catch (error) {
            logger.error('Failed to save data to DB:', JSON.stringify(error)); // Log the entire error object
            return null;
        }
    }

    async updateDB(collectionName, query, update, options = {}) {
        // Ensure query has _id
        if (!query || !query._id) {
            logger.error('_id is missing from the query object.');
            return null; // Early return if _id is not present
        }
        try {
            const collection = await this.mongodbHandler.getCollection(collectionName);
            if (!collection) {
                logger.error('Failed to load collection:', collectionName);
                return null;
            }
            // Check if update object contains an update operator
            const updateObject = Object.keys(update).some(key => key.startsWith('$')) ? update : { $set: update };
            const result = await collection.updateOne(query, updateObject, options);
            return result;
        } catch (error) {
            logger.error('Failed to update data in DB:', JSON.stringify(error)); // Log the entire error object
            return null;
        }
    }

    async deleteFromDB(collectionName, query, options = {}) {
        // Ensure query has _id
        if (!query || !query._id) {
            logger.error('_id is missing from the query object.');
            return null; // Early return if _id is not present
        }
        try {
            const collection = await this.mongodbHandler.getCollection(collectionName);
            if (!collection) {
                logger.error('Failed to load collection:', collectionName);
                return null;
            }
            const result = await collection.deleteOne(query, options); // Use options if needed
            return result;
        } catch (error) {
            logger.error('Failed to delete data from DB:', JSON.stringify(error));
            return null;
        }
    }

    async getVoiceChannelConfig(guildId) {
        // Ensure guildId is provided
        if (!guildId) {
            logger.error('guildId is missing.');
            return null; // Early return if guildId is not present
        }
        try {
            const collection = await this.mongodbHandler.getCollection('voice_channels'); // Replace with your actual collection name
            if (!collection) {
                logger.error('Failed to load collection: voice_channels');
                return null;
            }
            return await collection.findOne({ _id: guildId }); // Assuming _id is the guildId
        } catch (error) {
            logger.error('Failed to get voice channel config:', JSON.stringify(error));
            return null;
        }
    }
    async fetchVoiceChannelData(member) {
        // Ensure member is provided
        if (!member || !member.guild) {
            logger.error('Member or guild is missing.');
            return null; // Early return if member or guild is not present
        }
        
        const guildId = member.guild.id; // Automatically get the guildId from the member
        try {
            const collection = await this.mongodbHandler.getCollection('voice_channels');
            if (!collection) {
                logger.error('Failed to load collection: voice_channels');
                return null;
            }
            const result = await collection.findOne({ _id: guildId }); // Fetch the document for the guild
            if (!result) {
                logger.error('No data found for the provided guildId.');
                return null;
            }
            // Return the necessary fields
            return {
                tempChannels: result.temp_channels || [],
                vc_dashboard: result.vc_dashboard || null,
                JoinCreate: result.JoinCreate || null,
                gamechat: result.gamechat || null,
                Owner: result.Owner || null,
                TempChannel: result.TempChannel || null
            };

        } catch (error) {
            logger.error('Failed to fetch voice channel data:', JSON.stringify(error));
            return; // Add a return statement to exit the function after logging the error
        }
    }
}

module.exports = MongoUtilities;
