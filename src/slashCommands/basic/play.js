const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'play',
    description: 'Play music using a URL or song name',
    options: [
        {
            name: 'query',
            description: 'The URL or name of the song to play',
            type: 3, // STRING type
            required: true
        }
    ],

    run: async (client, interaction) => {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true })
                .then(msg => {
                    setTimeout(() => msg.delete(), 5000);
                });
        }
        const existingPlayer = client.manager.players.get(interaction.guild.id);
        if (existingPlayer && existingPlayer.playing) {
            return interaction.reply({ content: 'The bot is already playing music in another voice channel!', ephemeral: true })
                .then(msg => {
                    setTimeout(() => msg.delete(), 5000);
                });
        }

        const query = interaction.options.getString('query');
        const player = client.manager.create({
            guild: interaction.guild.id,
            voiceChannel: voiceChannel.id,
            textChannel: interaction.channel.id,
            selfDeafen: true,
        });

        if (player.state !== "CONNECTED") player.connect();

        let res;
        try {
            res = await player.search(query, interaction.user);
            if (res.loadType === 'LOAD_FAILED') {
                if (!player.queue.current) player.destroy();
                throw res.exception;
            }
        } catch (err) {
            return interaction.reply({ content: `There was an error while searching: ${err.message}`, ephemeral: true })
                .then(msg => {
                    setTimeout(() => msg.delete(), 5000);
                });
        }

        switch (res.loadType) {
            case 'NO_MATCHES':
                if (!player.queue.current) player.destroy();
                return interaction.reply({ content: 'There were no results found.', ephemeral: true })
                    .then(msg => {
                        setTimeout(() => msg.delete(), 5000);
                    });
            case 'TRACK_LOADED':
                player.queue.add(res.tracks[0]);

                if (!player.playing && !player.paused && !player.queue.size) player.play();
                break;
            case 'PLAYLIST_LOADED':
                player.queue.add(res.tracks);

                if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play();
                break;
            case 'SEARCH_RESULT':
                let max = 5;
                if (res.tracks.length < max) max = res.tracks.length;

                const results = res.tracks
                    .slice(0, max)
                    .map((track, index) => `${++index} - \`${track.title}\``)
                    .join('\n');

                const searchResult = new EmbedBuilder()
                    .setColor('#00f70c')
                    .setTitle('Search Results:')
                    .setDescription(results)
                    .addFields({ name: 'Cancel Search:', value: 'Type end or any other number to cancel the search', inline: true })
                    .setTimestamp();

                await interaction.reply({ embeds: [searchResult] });

                // Note: Interaction-based commands don't support message collection like message-based commands.
                // You would need to implement a different method to handle user selection, such as buttons or select menus.
                break;
        }
    }
};