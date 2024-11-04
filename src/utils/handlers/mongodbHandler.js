const { MongoClient } = require("mongodb");
const logger = require("../logger");
const config = require("../../../config");

class MongoDBHandler {
  constructor() {
    this.client = new MongoClient(config.mongoURI);
    this.db = this.client.db(config.dbName);
  }

  async connect() {
    try {
      await this.client.connect();
      logger.database("Connected successfully to MongoDB");
    } catch (error) {
      logger.error("Failed to connect to MongoDB:", error);
    }
  }

  async disconnect() {
    try {
      await this.client.close();
      logger.database("Disconnected from MongoDB");
    } catch (error) {
      logger.error("Failed to disconnect from MongoDB:", error);
    }
  }

  async getCollection(collectionName) {
    if (!this.db) {
      logger.database("Database not initialized. Call connect first!");
      return null;
    }
    const collection = this.db.collection(collectionName);
    const count = await collection.countDocuments();
    if (count === 0) {
      logger.error(`Collection ${collectionName} is empty or does not exist.`);
    }
    return collection;
  }

  async getBotCredentials(botMode) {
    try {
      const collection = await this.getCollection("bot_credentials");
      if (!collection) {
        logger.error("Failed to load collection: bot_credentials");
        return null;
      }
      const credentials = await collection.findOne({ _id: botMode });
      if (!credentials) {
        logger.error(`No credentials found for bot mode: ${botMode}`);
        return null;
      }
      return credentials;
    } catch (error) {
      logger.error("Failed to get bot credentials:", error);
      return null;
    }
  }
}

module.exports = (client) => {
  const mongodbHandler = new MongoDBHandler();
  client.mongodb = mongodbHandler;
  mongodbHandler.connect();
};
