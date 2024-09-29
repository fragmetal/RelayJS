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
    name: 'example',
    description: 'Very simple example of a command to understand how to use this template',
    usage: '<prefix>example [ping]', //OPTIONAL (for the help cmd)
    examples: ['example', 'example ping:true'], //OPTIONAL (for the help cmd)
    dir: "basic",
    cooldown: 1, // Cooldown in seconds, by default it's 2 seconds | OPTIONAL
    permissions: [], // OPTIONAL
    options: [
        {
            name: 'ping',
            description: "Get the bot's latency",
            type: 3, required: false,
            choices: [ { name: "yes", value: 'true' }, { name: "no", value: 'false' } ]
        }
    ], // OPTIONAL, (/) command options ; read https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure
    
    run: async (client, interaction) => {
        if(interaction.options.getString('ping') === 'true') {
            interaction.reply({ content: `Hello world !\n> Bot's latency : **${Math.round(client.ws.ping)}ms**` });
        } else {
            interaction.reply({ content: 'Hello world !' });
        }
    }
}