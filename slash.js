// This file allows you to register slash commands, it must be launched each time you add a new (/) command

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs');
const path = require('path');
const config = require("./config");

const commands = [];

// Read directories in the slashCommands folder
readdirSync("./src/slashCommands/").forEach(dir => {
	if (dir !== 'testing') {
		readdirSync(`./src/slashCommands/${dir}/`).forEach(cmd => {
			const command = require(path.join(__dirname, `./src/slashCommands/${dir}/${cmd}`));
			if (command && command.name && command.description) {
				commands.push(command);
				console.log(`Loaded command: ${command.name}`);
			} else {
				console.warn(`Command at ${cmd} is missing required properties.`);
			}
		});
	}
});

// Add context menu commands
readdirSync("./src/contextMenus/").forEach(file => {
	const command = require(`./src/contextMenus/${file}`);
	if (command && command.name) {
		commands.push(command);
		console.log(`Loaded context menu command: ${command.name}`);
	} else {
		console.warn(`Context menu command at ${file} is missing required properties.`);
	}
});

const rest = new REST({ version: "9" }).setToken(config.token);

(async () => {
	try {
		console.log('[Discord API] Fetching existing application (/) commands.');

		// Fetch all existing commands
		const existingCommands = await rest.get(
			Routes.applicationCommands(config.botID)
		);

		// Delete each command
		for (const command of existingCommands) {
			console.log(`Deleting command: ${command.name}`);
			await rest.delete(
				Routes.applicationCommand(config.botID, command.id)
			);
		}

		console.log('[Discord API] All existing commands deleted.');

		console.log('[Discord API] Started refreshing application (/) commands.');
		await rest.put(
			Routes.applicationCommands(config.botID),
			{ body: commands },
		);
		console.log('[Discord API] Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();