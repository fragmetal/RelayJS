const { EmbedBuilder, Colors } = require('discord.js');
const { formatMS_HHMMSS } = require("../../utils/time.js");

module.exports = {
    name: 'queue',
    description: 'List the queue',
    usage: '<prefix>queue',
    examples: ['queue'],
    dir: "basic",
    cooldown: 1,
    permissions: [],
    options: [],

    run: async (client, interaction) => {
        try {
            const player = client.lavalink.getPlayer(interaction.guildId);
            if (!player) {
                return interaction.reply({ ephemeral: true, content: "I'm not connected" }).then(() => {
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 5000);
                });
            }
            const vcId = interaction.member.voice?.channelId;
            if (!vcId) {
                return interaction.reply({ ephemeral: true, content: "Join a Voice Channel" }).then(() => {
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 5000);
                });
            }
            if (player.voiceChannelId !== vcId) {
                return interaction.reply({ ephemeral: true, content: "You need to be in my Voice Channel" }).then(() => {
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 5000);
                });
            }

            const currentTrack = player.queue.current;
            if (!currentTrack) {
                return interaction.reply({ ephemeral: true, content: `No track is currently playing` }).then(() => {
                    setTimeout(() => {
                        interaction.deleteReply().catch(console.error);
                    }, 5000);
                });
            }

            function createBar(player) {
                try {
                    if (!player.queue.current) return `**[🔘▬▬▬▬▬▬▬▬▬▬▬▬▬]**\n**00:00:00 / 00:00:00**`;
                    
                    const current = player.position || 0;
                    const total = currentTrack.info.duration || 1;
                    const size = 15;
                    const progress = Math.round(size * (current / total));
                    const bar = `▬`.repeat(size).split('');
                    bar[progress] = '🔘';

                    return `**[${bar.join('')}]**\n**${formatMS_HHMMSS(current)} / ${formatMS_HHMMSS(total)}**`;
                } catch (e) {
                    console.log("Error in createBar:", e);
                    return `**[🔘▬▬▬▬▬▬▬▬▬▬▬▬▬]**\n**00:00:00 / 00:00:00**`;
                }
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Current song playing:`, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(currentTrack.info.artworkUrl || '')
                .setColor(Colors.Blurple)
                .setTitle(`🎶 **${currentTrack.info.title || 'Unknown'}** 🎶`)
                .addFields(
                    { name: `🕰️ Duration: `, value: `\`${formatMS_HHMMSS(currentTrack.info.duration || 0)}\``, inline: true },
                    { name: `🎼 Song By: `, value: `\`${currentTrack.info.author || 'Unknown'}\``, inline: true },
                    { name: `🔢 Queue length: `, value: `\`${player.queue.tracks.length} Songs\``, inline: true },
                    { name: `🎛️ Progress: `, value: createBar(player) }
                );

            const nextTracks = player.queue.tracks.slice(0, 10);
            if (nextTracks.length > 0) {
                const maxLength = 50;
                const nextSongs = nextTracks.map((track, index) => {
                    const requesterTag = track.requester ? track.requester.tag : 'Unknown';
                    let title = track.info.title;
                    if (title.length > maxLength) {
                        title = title.substring(0, maxLength - 3) + '...';
                    }
                    const duration = formatMS_HHMMSS(track.info.duration);
                    return `**${index + 1}. ${title}** | \`${duration}\` | by: \`${requesterTag}\``;
                }).join('\n');

                embed.addFields({ name: '⏭️ Next Songs:', value: nextSongs });
            }

            const requester = currentTrack.requester;
            if (requester) {
                embed.setFooter({ text: `Requested by: ${requester.tag}`, iconURL: requester.displayAvatarURL({ dynamic: true }) });
            }

            await interaction.reply({
                ephemeral: true, embeds: [embed]
            });
            setTimeout(() => {
                interaction.deleteReply().catch(console.error);
            }, 15000);
        } catch (e) {
            console.log("Error in run function:", e);
            return interaction.reply({
                ephemeral: true, embeds: [new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle(`ERROR | An error occurred`)
                    .setDescription(`\`\`\`${e.message}\`\`\``)
                ]
            });
        }
    }
};
