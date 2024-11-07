const fs = require('fs');

module.exports = async (client) => {
    fs.readdir(`${__dirname}/../../event/`, (err, files) => {
        if (err) {
            client.logger.error(err);
            return; // Exit if there's an error reading the directory
        }

        let eventCount = 0; // Initialize a counter for loaded events

        files.forEach(file => {
            try {
                const event = require(`${__dirname}/../../event/${file}`);
                let eventName = file.split(".")[0];

                // Directly bind the event function to the client
                client.on(eventName, event.bind(null, client));
                eventCount++; // Increment the counter for each loaded event
            } catch (error) {
                client.logger.error(`Failed to load event file ${file}: ${error.message}`);
            }
        });
        client.logger.loader(`${client.color.chalkcolor.red('[EVENT]')} ${eventCount} events loaded`);
    });
}