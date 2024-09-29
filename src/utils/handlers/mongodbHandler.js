const { MongoClient } = require('mongodb');
const config = require('../../../config'); // Go up three levels from mongodbHandler.js
const logger = require('../logger');

class MongoDBHandler {
    constructor() {
        // Remove the deprecated options
        this.client = new MongoClient(config.mongoURI);
        this.db = null;
    }

    async connect() {
        try {
            await this.client.connect();
            logger.database('Connected successfully to MongoDB');
            this.db = this.client.db(config.dbName);
        } catch (error) {
            logger.error('Failed to connect to MongoDB:', error);
        }
    }

    async disconnect() {
        try {
            await this.client.close();
            logger.database('Disconnected from MongoDB');
        } catch (error) {
            logger.error('Failed to disconnect from MongoDB:', error);
        }
    }

    async getCollection(collectionName) {
        if (!this.db) {
            logger.database('Database not initialized. Call connect first!');
            return null;
        }
        return this.db.collection(collectionName);
    }
}

module.exports = (client) => {
    const mongodbHandler = new MongoDBHandler();
    client.mongodb = mongodbHandler; // Attach the handler to the client
    mongodbHandler.connect(); // Optionally connect immediately or handle connection elsewhere
};
