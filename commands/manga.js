
const { EmbedBuilder } = require("discord.js");

const API = "https://api.jikan.moe/v4";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function jikan(path, retries = 3) {

    for (let attempt = 1; attempt <= retries; attempt++) {

        try {

            const response = await fetch(
                `${API}${path}`,
                {
                    headers: {
                        "User-Agent": "Bankai-Discord-Bot/1.0"
                    }
                }
            );

            // Jikan rate limit
            if (response.status === 429) {

                if (attempt < retries) {
                    console.log(
                        `⏳ Jikan 429. ${attempt}. deneme, 2 saniye bekleniyor...`
                    );

                    await sleep(2000);
                    continue;
                }

                throw new Error(
                    "Jikan API rate limit (429)"
                );
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

            console.log(
                `⚠️ Jikan bağlantı hatası. ${attempt}. tekrar denenecek...`
            );

            await sleep(1500);
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
        "Jikan üzerinden manga bilgisi gösterir.",

    async execute(message, args) {

        if (!args.length) {

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("📖 Manga Sistemi")
                        .setDescription(
                            "Manga aramak için:\n\n" +
                            "`B!manga One Piece`\n" +
                            "`B!manga Naruto`\n\n" +
                            "Birden fazla sonuç için:\n" +
                            "`B!mangaara One Piece`"
                        )
                        .setFooter({
                            text: "Bankai Manga Sistemi"
                        })
                ]
            });
        }

        const query = args
            .join(" ")
            .trim();

        try {

            const result = await jikan(
                `/manga?q=${encodeURIComponent(query)}&limit=1`
            );

            if (
                !result ||
                !Array.isArray(result.data) ||
                result.data.length === 0
            ) {

                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("❌ Manga Bulunamadı")
                            .setDescription(
                                `**${query}** adına uygun bir manga bulunamadı.`
                            )
                    ]
                });
            }

            const manga = result.data[0];

            const title =
                manga.title ||
                manga.title_english ||
                manga.title_japanese ||
                query;

            const altTitles =
                Array.isArray(manga.title_synonyms) &&
                manga.title_synonyms.length > 0
                    ? manga.title_synonyms
                        .slice(0, 3)
                        .join(", ")
                    : "Yok";

            const genres =
                Array.isArray(manga.genres) &&
                manga.genres.length > 0
                    ? manga.genres
                        .map(g => g.name)
                        .join(", ")
                    : "Belirtilmemiş";

            const authors =
                Array.isArray(manga.authors) &&
                manga.authors.length > 0
                    ? manga.authors
                        .map(a => a.name)
                        .join(", ")
                    : "Bilinmiyor";

            const statusMap = {
                "Finished": "Tamamlandı",
                "Publishing": "Devam ediyor",
                "On Hiatus": "Ara verdi",
                "Discontinued": "Yayın durdu",
                "Currently publishing": "Devam ediyor"
            };

            const status =
                statusMap[manga.status] ||
                manga.status ||
                "Bilinmiyor";

            let description =
                manga.synopsis ||
                "Açıklama bulunamadı.";

            if (description.length > 1000) {
                description =
                    description.slice(0, 997) + "...";
            }

            const chapters =
                manga.chapters !== null &&
                manga.chapters !== undefined
                    ? String(manga.chapters)
                    : "Bilinmiyor";

            const volumes =
                manga.volumes !== null &&
                manga.volumes !== undefined
                    ? String(manga.volumes)
                    : "Bilinmiyor";

            const score =
                typeof manga.score === "number"
                    ? `${manga.score}/10`
                    : "Bilinmiyor";

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle(`📖 ${title}`)
                .setDescription(description)
                .addFields(
                    {
                        name: "📌 Durum",
                        value: status,
                        inline: true
                    },
                    {
                        name: "📚 Bölüm",
                        value: chapters,
                        inline: true
                    },
                    {
                        name: "📕 Cilt",
                        value: volumes,
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
                    },
                    {
                        name: "🔤 Alternatif İsimler",
                        value: altTitles
                    }
                )
                .setFooter({
                    text: "Bankai Manga Sistemi • Jikan"
                })
                .setTimestamp();

            if (
                manga.images &&
                manga.images.jpg &&
                manga.images.jpg.large_image_url
            ) {
                embed.setThumbnail(
                    manga.images.jpg.large_image_url
                );
            }

            if (manga.url) {
                embed.setURL(manga.url);
            }

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                "❌ Manga API hatası:",
                error
            );

            let errorText =
                "Manga bilgisi alınırken bir hata oluştu.";

            if (
                String(error.message)
                    .includes("429")
            ) {
                errorText =
                    "Jikan şu anda çok fazla istek aldığı için aramayı kabul etmedi.\n\n" +
                    "⏳ Birkaç saniye bekleyip tekrar dene.";
            }

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Manga Sistemi Hatası")
                        .setDescription(errorText)
                        .setFooter({
                            text: "Bankai Manga Sistemi"
                        })
                ]
            });
        }
    }
};

