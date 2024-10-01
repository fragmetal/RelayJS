const fs = require('fs');

module.exports = async (client) => {
    fs.readdir(`${__dirname}/../../slashCommands/`, (err, dirs) => { // Changed 'files' to 'dirs' for clarity
        if (err) client.logger.error(err);
        dirs.forEach(dir => {
            // Exclude the 'testing' folder from being loaded
            if (dir !== 'testing') {
                fs.readdir(`${__dirname}/../../slashCommands/${dir}/`, (err, files) => { // Changed 'file' to 'files' for clarity
                    if (err) client.logger.error(err);
                    files.forEach(f => {
                        const props = require(`${__dirname}/../../slashCommands/${dir}/${f}`);
                        client.slash.set(props.name, props);
                    });

                    client.logger.loader(`${client.color.chalkcolor.red(`${dir}`)} loaded with ${files.length} (/) commands`); // Use 'files.length'
                });
            }
        });
    })
}