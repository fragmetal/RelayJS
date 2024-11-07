const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const createInterface = async (channel) => {
    // Check if the channel is valid
    if (!channel.isTextBased()) {
        throw new Error('Channel is not a text-based channel');
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
            new ButtonBuilder().setCustomId('kick').setLabel('🚫').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('claim').setLabel('👑').setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('transfer').setLabel('🔄').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('delete').setLabel('🗑️').setStyle(ButtonStyle.Secondary)
        );

    // Fetch the last message sent by the bot in the channel
    const messages = await channel.messages.fetch({ limit: 1 });
    const botMessage = messages.find(msg => msg.author.id === channel.client.user.id);

    // Check if the existing message is identical
    if (botMessage) {
        const isIdentical = botMessage.embeds.length > 0 &&
            botMessage.embeds[0].description === embed.data.description &&
            botMessage.components.length === 2 &&
            botMessage.components[0].components.length === row1.components.length &&
            botMessage.components[1].components.length === row2.components.length;

        if (isIdentical) {
            //console.log('Identical message found, no need to send a new one.');
            return;
        }

        // Delete the previous bot message if it is not identical
        await botMessage.delete();
    }

    // Send the embed without the attachment
    await channel.send({
        embeds: [embed],
        components: [row1, row2]
    });
};

module.exports = createInterface; // Export the function
