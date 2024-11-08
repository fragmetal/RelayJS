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
            return;
        }

        const vc = interaction.member instanceof GuildMember ? interaction.member.voice.channel : null;
        if (!vc.joinable || !vc.speakable) {
            await interaction.reply({ ephemeral: true, content: "I am not able to join your channel / speak in there." });
            return;
        }

        const query = interaction.options instanceof CommandInteractionOptionResolver ? interaction.options.getString("query") : "";

        // Determine the source based on the link
        const sourceMap = {
            "youtube.com": "ytsearch",
            "youtu.be": "ytsearch",
            "music.youtube.com": "ytmsearch",
            "soundcloud.com": "scsearch",
            "deezer.com": "dzsearch",
            "spotify.com": "spsearch",
            "music.apple.com": "amsearch",
            "bandcamp.com": "bcsearch",
            "cornhub.com": "phsearch"
        };

        const src = Object.keys(sourceMap).find(key => query.includes(key)) || "ytsearch";

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
            return;
        }

        const response = await player.search({ query: query, source: src }, interaction.user);
        if (!response || !response.tracks?.length) {
            await interaction.reply({ content: `No Tracks found`, ephemeral: true });
            return;
        }

        await player.queue.add(response.loadType === "playlist" ? response.tracks : response.tracks[0]);

        await interaction.reply({
            content: response.loadType === "playlist"
                ? `✅ Added [${response.tracks.length}] Tracks${response.playlist?.title ? ` - from the ${response.pluginInfo.type || "Playlist"} ${response.playlist.uri ? `[\`${response.playlist.title}\`](<${response.playlist.uri}>)` : `\`${response.playlist.title}\``}` : ""} at \`#${player.queue.tracks.length-response.tracks.length}\``
                : `✅ Added [\`${response.tracks[0].info.title}\`](<${response.tracks[0].info.uri}>) by \`${response.tracks[0].info.author}\` at \`#${player.queue.tracks.length}\``,
            ephemeral: true
        });
        setTimeout(() => {
            interaction.deleteReply().catch(console.error);
        }, 6000);

        if (!player.playing) await player.play(player.connected ? { volume: client.defaultVolume, paused: false } : undefined);
    }
};