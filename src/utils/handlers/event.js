const fs = require('fs');

module.exports = async (client) => {
    fs.readdir(`${__dirname}/../../event/`, (err, files) => {
        if (err) {
            client.logger.error(err);
            return; // Exit if there's an error reading the directory
        }

        files.forEach(file => {
            try {
                const event = require(`${__dirname}/../../event/${file}`);
                let eventName = file.split(".")[0];

                // Directly bind the event function to the client
                client.on(eventName, event.bind(null, client));
                client.logger.loader(`${client.color.chalkcolor.red('[EVENT]')} ${file} event loaded`);
            } catch (error) {
                client.logger.error(`Failed to load event file ${file}: ${error.message}`);
            }
        });
    });
}