const { CommandInteractionOptionResolver, GuildMember } = require("discord.js");
const { formatMS_HHMMSS } = require("../../utils/time.js");

module.exports = {
    name: 'play',
    description: 'Play Music',
    usage: '<prefix>play <link or query>',
    examples: ['play https://www.youtube.com/watch?v=example', 'play some song'],
    dir: "basic",
    cooldown: 1,
    permissions: [],
    options: [
        {
            name: 'query',
            description: "Provide a link to play from YouTube, SoundCloud, Spotify, etc.",
            type: 3,
            required: true
        }
    ],

    run: async (client, interaction) => {
        if (!interaction.guildId) return;

        const vcId = interaction.member instanceof GuildMember ? interaction.member.voice.channelId : null;
        if (!vcId) {
            await interaction.reply({ ephemeral: true, content: `Join a voice Channel` });
            setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
            return;
        }

        const vc = interaction.member instanceof GuildMember ? interaction.member.voice.channel : null;
        if (!vc.joinable || !vc.speakable) {
            await interaction.reply({ ephemeral: true, content: "I am not able to join your channel / speak in there." });
            setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
            return;
        }

        const query = interaction.options instanceof CommandInteractionOptionResolver ? interaction.options.getString("query") : "";

        // Determine the source based on the link
        let src;
        if (query.includes("youtube.com") || query.includes("youtu.be")) {
            src = "ytsearch";
        } else if (query.includes("music.youtube.com")) {
            src = "ytmsearch";
        } else if (query.includes("soundcloud.com")) {
            src = "scsearch";
        } else if (query.includes("deezer.com")) {
            src = "dzsearch";
        } else if (query.includes("spotify.com")) {
            src = "spsearch";
        } else if (query.includes("music.apple.com")) {
            src = "amsearch";
        } else if (query.includes("bandcamp.com")) {
            src = "bcsearch";
        } else if (query.includes("cornhub.com")) {
            src = "phsearch";
        } else {
            src = "ytsearch"; // Default to YouTube search
        }

        const player = client.lavalink.getPlayer(interaction.guildId) || await client.lavalink.createPlayer({
            guildId: interaction.guildId,
            voiceChannelId: vcId,
            textChannelId: interaction.channelId,
            selfDeaf: true,
            selfMute: false,
            volume: client.defaultVolume,
            instaUpdateFiltersFix: true,
            applyVolumeAsFilter: false,
        });

        const connected = player.connected;

        if (!connected) await player.connect();

        if (player.voiceChannelId !== vcId) {
            await interaction.reply({ ephemeral: true, content: "You need to be in my Voice Channel" });
            setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
            return;
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            const response = await player.search({ query: query, source: src }, interaction.user);
            if (!response || !response.tracks?.length) {
                await interaction.editReply({ content: `No Tracks found` });
                setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
                return;
            }

            await player.queue.add(response.loadType === "playlist" ? response.tracks : response.tracks[0]);

            await interaction.editReply({
                content: response.loadType === "playlist"
                    ? `✅ Added [${response.tracks.length}] Tracks${response.playlist?.title ? ` - from the ${response.pluginInfo.type || "Playlist"} ${response.playlist.uri ? `[\`${response.playlist.title}\`](<${response.playlist.uri}>)` : `\`${response.playlist.title}\``}` : ""} at \`#${player.queue.tracks.length-response.tracks.length}\``
                    : `✅ Added [\`${response.tracks[0].info.title}\`](<${response.tracks[0].info.uri}>) by \`${response.tracks[0].info.author}\` at \`#${player.queue.tracks.length}\``
            });
        } catch (error) {
            console.error("Error playing track:", error);
            if (!interaction.replied) {
                await interaction.editReply({ content: `An error occurred while trying to play the track.` });
            }
        }

        if (!player.playing) await player.play(player.connected ? { volume: client.defaultVolume, paused: false } : undefined);
    }
};