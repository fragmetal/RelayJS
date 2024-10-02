const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const createInterface = async (interaction) => {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setDescription('This interface can be used to manage temporary voice channels.');

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('name')
                .setLabel('🔗') // Icon for Name
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('limit')
                .setLabel('♾️') // Icon for Limit
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('region')
                .setLabel('🌍') // Icon for Region
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('privacy')
                .setLabel('🔒') // Icon for Privacy
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('waiting')
                .setLabel('⏳') // Icon for Waiting
                .setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('trust')
                .setLabel('✅') // Icon for Trust
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('untrust')
                .setLabel('❌') // Icon for Untrust
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('invite')
                .setLabel('📩') // Icon for Invite
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('kick')
                .setLabel('🚫') // Icon for Kick
                .setStyle(ButtonStyle.Secondary)
        );

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('thread')
                .setLabel('🧵') // Icon for Thread
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('claim')
                .setLabel('👑') // Icon for Claim
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('transfer')
                .setLabel('🔄') // Icon for Transfer
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('delete')
                .setLabel('🗑️') // Icon for Delete
                .setStyle(ButtonStyle.Secondary)
        );

    //await channel.send({ embeds: [embed], components: [row1, row2, row3] });
    // Fetch the last message sent by the bot in the channel
    const messages = await interaction.channel.messages.fetch({ limit: 1 });
    const botMessage = messages.find(msg => msg.author.id === interaction.client.user.id);

    // Delete the previous bot message if it exists
    if (botMessage) {
        await botMessage.delete();
    }

    // Send the new message with the embed and buttons
    await interaction.channel.send({
        embeds: [embed],
        components: [row1, row2, row3],
        files: [{
            attachment: 'attachment://NeverGonnaGiveYouUp.png', // Ensure this path is correct
            name: 'NeverGonnaGiveYouUp.png' // Name of the file
        }]
    });
};

module.exports = createInterface; // Export the function
