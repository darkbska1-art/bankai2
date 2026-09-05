
const { EmbedBuilder } = require("discord.js");

const API = "https://api.jikan.moe/v4";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function jikanRequest(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Bankai-Discord-Bot/1.0"
                }
            });

            if (response.status === 429) {
                await sleep(3000);
                continue;
            }

            if (!response.ok) {
                throw new Error(
                    `Jikan API ${response.status}`
                );
            }

            return await response.json();

        } catch (error) {
            if (attempt >= retries) {
                throw error;
            }

            await sleep(2000);
        }
    }
}

module.exports = {
    name: "manga",

    aliases: [
        "mangaara",
        "mangabilgi"
    ],

    description:
        "Jikan üzerinden manga arar.",

    async execute(message, args) {
        if (!args.length) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("📖 Manga Arama")
                        .setDescription(
                            "Manga aramak için:\n\n" +
                            "`B!manga One Piece`\n" +
                            "`B!manga Naruto`\n" +
                            "`B!manga Berserk`"
                        )
                        .setFooter({
                            text: "Bankai Manga Sistemi • Jikan"
                        })
                ]
            });
        }

        const query =
            args.join(" ").trim();

        try {
            const result =
                await jikanRequest(
                    `${API}/manga?q=${encodeURIComponent(query)}&limit=5`
                );

            if (
                !result?.data ||
                !result.data.length
            ) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("❌ Manga Bulunamadı")
                            .setDescription(
                                `**${query}** için manga bulunamadı.`
                            )
                    ]
                });
            }

            const manga =
                result.data[0];

            const title =
                manga.title ||
                manga.title_english ||
                manga.title_japanese ||
                query;

            const statusMap = {
                Finished: "Tamamlandı",
                Publishing: "Devam ediyor",
                "On Hiatus": "Ara verdi",
                Discontinued: "Yayın durdu",
                "Currently publishing": "Devam ediyor"
            };

            const status =
                statusMap[manga.status] ||
                manga.status ||
                "Bilinmiyor";

            const authors =
                manga.authors?.length
                    ? manga.authors
                        .map(x => x.name)
                        .join(", ")
                    : "Bilinmiyor";

            const genres =
                manga.genres?.length
                    ? manga.genres
                        .map(x => x.name)
                        .join(", ")
                    : "Bilinmiyor";

            const synopsis =
                manga.synopsis ||
                "Açıklama bulunamadı.";

            const description =
                synopsis.length > 900
                    ? synopsis.slice(0, 897) + "..."
                    : synopsis;

            const chapters =
                manga.chapters ??
                "Bilinmiyor";

            const volumes =
                manga.volumes ??
                "Bilinmiyor";

            const score =
                typeof manga.score === "number"
                    ? `${manga.score}/10`
                    : "Bilinmiyor";

            const embed =
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle(`📖 ${title}`)
                    .setDescription(description)
                    .addFields(
                        {
                            name: "📌 Durum",
                            value: String(status),
                            inline: true
                        },
                        {
                            name: "📚 Bölüm",
                            value: String(chapters),
                            inline: true
                        },
                        {
                            name: "📕 Cilt",
                            value: String(volumes),
                            inline: true
                        },
                        {
                            name: "✍️ Yazar",
                            value: authors,
                            inline: true
                        },
                        {
                            name: "🏷️ Türler",
                            value: genres,
                            inline: true
                        },
                        {
                            name: "⭐ Puan",
                            value: score,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Bankai Manga Sistemi • Jikan"
                    })
                    .setTimestamp();

            const image =
                manga.images?.jpg?.large_image_url ||
                manga.images?.jpg?.image_url;

            if (image) {
                embed.setThumbnail(image);
            }

            if (manga.url) {
                embed.setURL(manga.url);
            }

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error(
                "❌ Manga/Jikan hatası:",
                error
            );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Manga Arama Hatası")
                        .setDescription(
                            "Jikan'a bağlanırken bir hata oluştu.\n\n" +
                            "Birkaç saniye sonra tekrar dene."
                        )
                ]
            });
        }
    }
};

