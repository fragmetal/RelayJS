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
		const commandFiles = readdirSync(`./src/slashCommands/${dir}/`);
		if (commandFiles.length > 0) {
			commandFiles.forEach(cmd => {
				const command = require(path.join(__dirname, `./src/slashCommands/${dir}/${cmd}`));
				if (command && command.name && command.description) {
					commands.push(command);
					console.log(`Loaded command: ${command.name}`);
				} else {
					console.warn(`Command at ${cmd} is missing required properties.`);
				}
			});
		}
	}
});

// Add context menu commands
const contextMenuFiles = readdirSync("./src/contextMenus/");
if (contextMenuFiles.length > 0) {
	contextMenuFiles.forEach(file => {
		const command = require(`./src/contextMenus/${file}`);
		if (command && command.name) {
			commands.push(command);
			console.log(`Loaded context menu command: ${command.name}`);
		} else {
			console.warn(`Context menu command at ${file} is missing required properties.`);
		}
	});
}

const rest = new REST({ version: "9" }).setToken('MTI4ODUxMjkwODk2NzU0Mjg0NA.GwIndq.Degkq1BN0U2L1DENPXBVAkituLygKekE9cxTpE');

(async () => {
	try {
		console.log('[Discord API] Fetching existing application (/) commands.');

		// Fetch all existing commands
		const existingCommands = await rest.get(
			Routes.applicationCommands('1288512908967542844')
		);

		// Delete each command
		for (const command of existingCommands) {
			console.log(`Deleting command: ${command.name}`);
			await rest.delete(
				Routes.applicationCommand('1288512908967542844', command.id)
			);
		}

		console.log('[Discord API] All existing commands deleted.');

		console.log('[Discord API] Started refreshing application (/) commands.');
		await rest.put(
			Routes.applicationCommands('1288512908967542844'),
			{ body: commands },
		);
		console.log('[Discord API] Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();