
// Permissions:
//   Administrator          - 8          // Allows nearly all other permissions.
//   ManageChannels         - 16         // Allows creating, updating, and deleting channels.
//   ManageGuild            - 32         // Allows editing the guild information, creating invitations, etc.
//   KickMembers            - 2          // Allows kicking members from the guild.
//   BanMembers             - 4          // Allows banning members from the guild.
//   ManageRoles            - 268435456  // Allows creating, editing, and deleting roles.
//   ManageWebhooks         - 131072     // Allows creating, editing, and deleting webhooks.
//   ManageEmojisAndStickers- 262144     // Allows managing emojis and stickers.
//   ViewAuditLog           - 128        // Allows viewing the audit logs of the guild.
//   SendMessages           - 2048       // Allows sending messages in channels.
//   ManageMessages         - 8192       // Allows deleting messages and managing pins in channels.
//   MuteMembers            - 4194304    // Allows muting members in voice channels.
//   DeafenMembers          - 8388608    // Allows deafening members in voice channels.
//   MoveMembers            - 16777216   // Allows moving members between voice channels.
//   UseVAD                 - 33554432   // Allows using Voice Activity Detection in voice channels.

// Slash Command Option Types:
//   SUB_COMMAND            - 1          // Used for SUB_COMMAND in slash commands.
//   SUB_COMMAND_GROUP      - 2          // Used for SUB_COMMAND_GROUP in slash commands.
//   STRING                 - 3          // Used for STRING options in slash commands.
//   INTEGER                - 4          // Used for INTEGER options in slash commands.
//   BOOLEAN                - 5          // Used for BOOLEAN options in slash commands.
//   USER                   - 6          // Used for USER options in slash commands.
//   CHANNEL                - 7          // Used for CHANNEL options in slash commands.
//   ROLE                   - 8          // Used for ROLE options in slash commands.
//   MENTIONABLE            - 9          // Used for MENTIONABLE options in slash commands.
//   NUMBER                 - 10         // Used for NUMBER options in slash commands.
//   ATTACHMENT             - 11         // Used for ATTACHMENT options in slash commands.

module.exports = {
    name: 'clearchat',
    description: 'Clears a specified number of messages from the channel.',
    cooldown: 5, // Cooldown in seconds
    permissions: [8],
    options: [
        {
            name: 'number',
            description: 'Number of messages to clear (1-100)',
            type: 4, // Change type to Integer for direct number input
            required: true
        }
    ],
    
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const number = interaction.options.getInteger('number');
        if (number < 1 || number > 100) {
            await interaction.editReply({ content: 'Please specify a number between 1 and 100.' });
            return;
        }

        try {
            const messages = await interaction.channel.messages.fetch({ limit: number });
            const deletedMessages = await interaction.channel.bulkDelete(messages, true);
            await interaction.editReply({ content: `Cleared ${deletedMessages.size} messages.` });
        } catch (error) {
            if (error.code === 50013) {
                await interaction.editReply({ content: 'Failed to clear messages. Missing permissions to delete messages.' });
            } else {
                console.error('Failed to delete messages:', error);
                await interaction.editReply({ content: 'Failed to clear messages. Make sure I have the proper permissions and the messages are not older than 14 days.' });
            }
        }
    }
};
