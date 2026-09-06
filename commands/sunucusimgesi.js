const emojiler = require("./commands/emojiler.js");

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    try {
        if (interaction.customId.startsWith("emojiler_prev_")) {
            const page = Number(
                interaction.customId.split("_")[2]
            );

            const emojis = [...interaction.guild.emojis.cache.values()]
                .sort((a, b) => a.name.localeCompare(b.name));

            const totalPages = Math.max(
                1,
                Math.ceil(emojis.length / 20)
            );

            const newPage = Math.max(0, page - 1);

            await interaction.update({
                embeds: [
                    emojiler.createEmbed(
                        interaction.guild,
                        emojis,
                        newPage
                    )
                ],
                components: totalPages > 1
                    ? [emojiler.createButtons(newPage, totalPages)]
                    : []
            });

            return;
        }

        if (interaction.customId.startsWith("emojiler_next_")) {
            const page = Number(
                interaction.customId.split("_")[2]
            );

            const emojis = [...interaction.guild.emojis.cache.values()]
                .sort((a, b) => a.name.localeCompare(b.name));

            const totalPages = Math.max(
                1,
                Math.ceil(emojis.length / 20)
            );

            const newPage = Math.min(
                totalPages - 1,
                page + 1
            );

            await interaction.update({
                embeds: [
                    emojiler.createEmbed(
                        interaction.guild,
                        emojis,
                        newPage
                    )
                ],
                components: totalPages > 1
                    ? [emojiler.createButtons(newPage, totalPages)]
                    : []
            });

            return;
        }

    } catch (error) {
        console.error("❌ Emoji buton hatası:", error);
    }
});