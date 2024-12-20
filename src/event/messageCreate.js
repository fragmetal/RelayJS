
module.exports = async (client, message) => {
    // Check if the bot is in developer mode
    if (client.devMode === true) {
        await message.deferReply({ ephemeral: true });
        await message.editReply({ content: 'Developer mode is currently active. You cannot use any commands except for /dev.', ephemeral: true });
        setTimeout(() => {
            message.deleteReply().catch(console.error);
        }, 6000);
        return; // Exit if in developer mode
    }

    if (message.author.bot) return;

    // Ensure the member data is available
    if (!message.member) {
        // Attempt to fetch the member if not available
        message.member = await message.guild.members.fetch(message.author.id).catch(err => console.log("Failed to fetch member:", err));
    }

    // If member data is still not available, return
    if (!message.member) return;

    // Additional message handling logic can be added here
};
