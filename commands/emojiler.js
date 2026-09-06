const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const emojisPerPage = 20;

function createEmbed(guild, emojis, page) {
    const totalPages = Math.max(1, Math.ceil(emojis.length / emojisPerPage));
    const start = page * emojisPerPage;
    const current = emojis.slice(start, start + emojisPerPage);

    const description = current.length
        ? current.map((emoji, index) => {
            return `${start + index + 1}. ${emoji} \`:${emoji.name}:\` — \`${emoji.id}\``;
        }).join("\n")
        : "Bu sunucuda özel emoji bulunmuyor.";

    return new EmbedBuilder()
        .setColor("#000000")
        .setTitle("😀 Sunucu Emojileri")
        .setDescription(description)
        .addFields({
            name: "📊 Bilgi",
            value: `Toplam **${emojis.length}** emoji\nSayfa **${page + 1}/${totalPages}**`
        })
        .setFooter({
            text: `Bankai • ${guild.name}`
        })
        .setTimestamp();
}

function createButtons(page, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`emojiler_prev_${page}`)
            .setLabel("◀️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 0),

        new ButtonBuilder()
            .setCustomId(`emojiler_next_${page}`)
            .setLabel("▶️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
    );
}

module.exports = {
    name: "emojiler",
    aliases: ["emojilerim", "sunucuemojileri"],

    async execute(message) {
        const emojis = [...message.guild.emojis.cache.values()]
            .sort((a, b) => a.name.localeCompare(b.name));

        const totalPages = Math.max(
            1,
            Math.ceil(emojis.length / emojisPerPage)
        );

        const embed = createEmbed(message.guild, emojis, 0);

        return message.reply({
            embeds: [embed],
            components: totalPages > 1
                ? [createButtons(0, totalPages)]
                : []
        });
    },

    createEmbed,
    createButtons
};