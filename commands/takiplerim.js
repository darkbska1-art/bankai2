
const {
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(
    process.cwd(),
    "takipler.json"
);

// =====================================================
// JSON
// =====================================================

function loadData() {

    try {

        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(
                DATA_FILE,
                "{}",
                "utf8"
            );
        }

        return JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "❌ takipler.json okunamadı:",
            error
        );

        return {};
    }
}

// =====================================================
// KOMUT
// =====================================================

module.exports = {

    name: "takiplerim",

    aliases: [
        "takiplistem",
        "takiplistesi"
    ],

    description:
        "Takip ettiğin anime ve mangaları gösterir.",

    async execute(message) {

        const data =
            loadData();

        const follows =
            data?.[
                message.guild.id
            ]?.[
                message.author.id
            ] || [];

        const embed =
            new EmbedBuilder()
                .setColor("#000000")
                .setTitle("📚 Takip Listem")
                .setFooter({
                    text:
                        `${message.guild.name} • Takip Sistemi`
                })
                .setTimestamp();

        // =================================================
        // BOŞ
        // =================================================

        if (follows.length === 0) {

            embed.setDescription(
                "📭 Henüz hiçbir anime veya manga takip etmiyorsun.\n\n" +
                "`B!takip One Piece`"
            );

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // ANİME
        // =================================================

        const anime =
            follows.filter(
                x => x.type === "anime"
            );

        // =================================================
        // MANGA
        // =================================================

        const manga =
            follows.filter(
                x => x.type === "manga"
            );

        // =================================================
        // ANİME LİSTESİ
        // =================================================

        if (anime.length > 0) {

            embed.addFields({
                name: "🎬 Anime",
                value:
                    anime
                        .map(
                            (x, i) =>
                                `**${i + 1}.** ${x.title}`
                        )
                        .join("\n")
            });
        }

        // =================================================
        // MANGA LİSTESİ
        // =================================================

        if (manga.length > 0) {

            embed.addFields({
                name: "📖 Manga",
                value:
                    manga
                        .map(
                            (x, i) =>
                                `**${i + 1}.** ${x.title}`
                        )
                        .join("\n")
            });
        }

        embed.setDescription(
            `Toplam **${follows.length}** içerik takip ediyorsun.`
        );

        return message.reply({
            embeds: [embed]
        });
    }
};

