const { CommandInteractionOptionResolver, GuildMember } = require("discord.js");
const { formatMS_HHMMSS } = require("../../utils/time.js");

const autocompleteMap = new Map();

const isUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

const getSourceFromUrl = (url) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return "ytsearch";
    } else if (url.includes("soundcloud.com")) {
        return "scsearch";
    }
    // Add more conditions for other sources if needed
    return null;
};

module.exports = {
    name: 'play',
    description: 'Play Music',
    usage: '<prefix>play <source> <query>', // Adjust as needed
    examples: ['play ytsearch some song', 'play spsearch another song'], // Adjust as needed
    dir: "basic",
    cooldown: 1, // Cooldown in seconds
    permissions: [], // OPTIONAL
    options: [
        {
            name: 'source',
            description: "From which Source you want to play?",
            type: 3, // String type
            required: true,
            choices: [
                { name: "Youtube", value: "ytsearch" },
                { name: "Youtube Music", value: "ytmsearch" },
                { name: "Soundcloud", value: "scsearch" },
                { name: "Deezer", value: "dzsearch" },
                { name: "Spotify", value: "spsearch" },
                { name: "Apple Music", value: "amsearch" },
                { name: "Bandcamp", value: "bcsearch" },
                { name: "Cornhub", value: "phsearch" },
            ]
        },
        {
            name: 'query',
            description: "What to play?",
            type: 3, // String type
            required: true,
            autocomplete: true
        }
    ],

    run: async (client, interaction) => {
        if (!interaction.guildId) return;

        const vcId = (interaction.member instanceof GuildMember) ? interaction.member.voice.channelId : null;
        if (!vcId) return interaction.reply({ ephemeral: true, content: `Join a voice Channel` });

        const vc = (interaction.member instanceof GuildMember) ? interaction.member.voice.channel : null;
        if (!vc || !vc.joinable || !vc.speakable) return interaction.reply({ ephemeral: true, content: "I am not able to join your channel / speak in there." });

        const src = (interaction.options instanceof CommandInteractionOptionResolver) ? interaction.options.getString("source") : undefined;
        const query = (interaction.options instanceof CommandInteractionOptionResolver) ? interaction.options.getString("query") : "";

        if (!src || !query) return interaction.reply({ content: `Invalid source or query`, ephemeral: true });

        const fromAutoComplete = (Number(query.replace("autocomplete_", "")) >= 0 && autocompleteMap.has(`${interaction.user.id}_res`)) && autocompleteMap.get(`${interaction.user.id}_res`);
        if (autocompleteMap.has(`${interaction.user.id}_res`)) {
            if (autocompleteMap.has(`${interaction.user.id}_timeout`)) clearTimeout(autocompleteMap.get(`${interaction.user.id}_timeout`));
            autocompleteMap.delete(`${interaction.user.id}_res`);
            autocompleteMap.delete(`${interaction.user.id}_timeout`);
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

        if (!player.connected) await player.connect();

        if (player.voiceChannelId !== vcId) return interaction.reply({ ephemeral: true, content: "You need to be in my Voice Channel" });

        const response = isUrl(query)
            ? await player.search({ query: query, source: getSourceFromUrl(query) }, interaction.user)
            : (fromAutoComplete || await player.search({ query: query, source: src }, interaction.user));

        if (!response || !response.tracks?.length) return interaction.followUp({ content: `No Tracks found`, ephemeral: true });

        await player.queue.add(response.loadType === "playlist" ? response.tracks : response.tracks[fromAutoComplete ? Number(query.replace("autocomplete_", "")) : 0]);

        await interaction.reply({
            content: response.loadType === "playlist"
                ? `✅ Added [${response.tracks.length}] Tracks${response.playlist?.title ? ` - from the ${response.pluginInfo.type || "Playlist"} ${response.playlist.uri ? `[\`${response.playlist.title}\`](<${response.playlist.uri}>)` : `\`${response.playlist.title}\``}` : ""} at \`#${player.queue.tracks.length-response.tracks.length}\``
                : `✅ Added [\`${response.tracks[0].info.title}\`](<${response.tracks[0].info.uri}>) by \`${response.tracks[0].info.author}\` at \`#${player.queue.tracks.length}\``
        });

        if (!player.playing) await player.play(player.connected ? { volume: client.defaultVolume, paused: false } : undefined);
    },

    autocomplete: async (client, interaction) => {
        if (!interaction.guildId) return;
        const vcId = (interaction.member instanceof GuildMember) ? interaction.member.voice.channelId : null;
        if (!vcId) return interaction.respond([{ name: `Join a voice Channel`, value: "join_vc" }]);

        const focussedQuery = interaction.options.getFocused();
        const player = client.lavalink.getPlayer(interaction.guildId) || await client.lavalink.createPlayer({
            guildId: interaction.guildId, voiceChannelId: vcId, textChannelId: interaction.channelId,
            selfDeaf: true, selfMute: false, volume: client.defaultVolume, instaUpdateFiltersFix: true
        });

        if (!player.connected) await player.connect();

        if (player.voiceChannelId !== vcId) return interaction.respond([{ name: `You need to be in my Voice Channel`, value: "join_vc" }]);

        if (!focussedQuery.trim().length) return await interaction.respond([{ name: `No Tracks found (enter a query)`, value: "nothing_found" }]);

        const res = await player.search({ query: focussedQuery, source: interaction.options.getString("source") }, interaction.user);

        if (!res.tracks.length) return await interaction.respond([{ name: `No Tracks found`, value: "nothing_found" }]);

        if (autocompleteMap.has(`${interaction.user.id}_timeout`)) clearTimeout(autocompleteMap.get(`${interaction.user.id}_timeout`));
        autocompleteMap.set(`${interaction.user.id}_res`, res);
        autocompleteMap.set(`${interaction.user.id}_timeout`, setTimeout(() => {
            autocompleteMap.delete(`${interaction.user.id}_res`);
            autocompleteMap.delete(`${interaction.user.id}_timeout`);
        }, 25000));
        await interaction.respond(
            res.loadType === "playlist" ?
            [{ name: `Playlist [${res.tracks.length} Tracks] - ${res.playlist?.title}`, value: `autocomplete_0`}]
            : res.tracks.map((t, i) => ({ name: `[${formatMS_HHMMSS(t.info.duration)}] ${t.info.title} (by ${t.info.author || "Unknown-Author"})`.substring(0, 100), value: `autocomplete_${i}` })).slice(0, 25)
        );
    }
};