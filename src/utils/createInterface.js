const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const createInterface = async (channel) => {
    // Check if the channel is valid
    if (!channel) {
        console.error('Invalid channel not found.');
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setDescription('This interface can be used to manage temporary voice channels.')

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('name').setLabel('🔗').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('limit').setLabel('♾️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('region').setLabel('🌍').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('privacy').setLabel('🔒').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('waiting').setLabel('⏳').setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('trust').setLabel('✅').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('untrust').setLabel('❌').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('invite').setLabel('📩').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('kick').setLabel('🚫').setStyle(ButtonStyle.Secondary)
        );

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('thread').setLabel('🧵').setStyle(ButtonStyle.Secondary),
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

    // Send the new message with the embed and buttons, including the image in the embed
    await channel.send({
        embeds: [embed],
        files: [{
            attachment: './NeverGonnaGiveYouUp.png', // Path to the image file
            name: 'NeverGonnaGiveYouUp.png' // Name of the file
        }],
        components: [row1, row2, row3]
    });
};

module.exports = createInterface; // Export the function
