module.exports = {
    name: 'dev',
    description: 'Toggle developer mode for the bot.',
    dir: "admin",
    cooldown: 5, // Cooldown in seconds
    permissions: [8], // Requires Administrator permission
    options: [
        {
            name: 'confirm',
            description: 'Are you sure you want to enter developer mode?',
            type: 3, // STRING type
            required: true,
            choices: [
                { name: 'Yes', value: 'yes' },
                { name: 'No', value: 'no' }
            ]
        }
    ],

    run: async (client, interaction) => {
        const confirm = interaction.options.getString('confirm');

        if (confirm === 'yes') {
            client.devMode = true; // Set the bot to developer mode
            await interaction.reply({ content: 'Developer mode activated. The bot will ignore all commands and events except for /dev.' });
        } else {
            client.devMode = false; // Set the bot to developer mode
            await interaction.reply({ content: 'Developer mode activation cancelled.' });
        }
    }
};
