const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const createInterface = async (channel) => {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setImage('attachment://NeverGonnaGiveYouUp.png') // Set the image in the embed
        .setDescription('This interface can be used to manage temporary voice channels.');

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('name')
                .setLabel('🔗') // Icon for Name
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('limit')
                .setLabel('♾️') // Icon for Limit
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('region')
                .setLabel('🌍') // Icon for Region
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('privacy')
                .setLabel('🔒') // Icon for Privacy
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('waiting')
                .setLabel('⏳') // Icon for Waiting
                .setStyle(ButtonStyle.Primary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('trust')
                .setLabel('✅') // Icon for Trust
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('untrust')
                .setLabel('❌') // Icon for Untrust
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('invite')
                .setLabel('📩') // Icon for Invite
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('kick')
                .setLabel('🚫') // Icon for Kick
                .setStyle(ButtonStyle.Danger)
        );

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('thread')
                .setLabel('🧵') // Icon for Thread
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('claim')
                .setLabel('👑') // Icon for Claim
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('transfer')
                .setLabel('🔄') // Icon for Transfer
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('delete')
                .setLabel('🗑️') // Icon for Delete
                .setStyle(ButtonStyle.Danger)
        );

    await channel.send({ embeds: [embed], components: [row1, row2, row3] });
};

module.exports = createInterface; // Export the function
