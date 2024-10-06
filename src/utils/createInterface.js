const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const createInterface = async (channel) => {
    // Check if the channel is valid
    if (!channel) {
        console.error('Invalid channel not found.');
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setDescription('**This interface to manage temporary voice channels.** \n\n' +
                        '♾️ **Limit**: Set a user limit for the voice channel.\n' +
                        '🔒 **Privacy**: Toggle the privacy settings of the channel.\n' +
                        '📩 **Invite**: Send an invite link to the channel.\n' +
                        '🚫 **Kick**: Remove a user from the voice channel.\n' +
                        '👑 **Claim**: Claim ownership of the voice channel.\n' +
                        '🔄 **Transfer**: Transfer ownership to another user.\n' +
                        '🗑️ **Delete**: Permanently delete the voice channel.');

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('limit').setLabel('♾️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('privacy').setLabel('🔒').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('invite').setLabel('📩').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('kick').setLabel('🚫').setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('claim').setLabel('👑').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('transfer').setLabel('🔄').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('delete').setLabel('🗑️').setStyle(ButtonStyle.Secondary)
        );

    // Fetch the last message sent by the bot in the channel
    const messages = await channel.messages.fetch({ limit: 1 });
    const botMessage = messages.find(msg => msg.author.id === channel.client.user.id);

    // Delete the previous bot message if it exists
    if (botMessage) {
        await botMessage.delete();
    }

    // Send the embed without the attachment
    await channel.send({
        embeds: [embed],
        components: [row1, row2]
    });
};

module.exports = createInterface; // Export the function
