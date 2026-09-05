
const {
    EmbedBuilder
} = require("discord.js");

const API = "https://api.jikan.moe/v4";

async function jikan(path) {
    const response = await fetch(`${API}${path}`);

    if (!response.ok) {
        throw new Error(`Jikan API ${response.status}`);
    }

    return response.json();
}

module.exports = {
    name: "manga",
    aliases: ["mangaara", "mangabilgi"],

    async execute(message, args) {
        if (!args.length) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("📖 Manga Sistemi")
                        .setDescription(
                            `Manga aramak için:\n\n` +
                            `\`B!manga One Piece\`\n` +
                            `\`B!manga Naruto\`\n\n` +
                            `Birden fazla sonuç görmek için:\n` +
                            `\`B!mangaara One Piece\``
                        )
                ]
            });
        }

        const query = args.join(" ");

        try {
            const result = await jikan(
                `/manga?q=${encodeURIComponent(query)}&limit=1`
            );

            if (!result.data?.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("❌ Manga Bulunamadı")
                            .setDescription(
                                `"${query}" adına uygun bir manga bulunamadı.`
                            )
                    ]
                });
            }

            const manga = result.data[0];

            const title =
                manga.title ||
                manga.title_english ||
                query;

            const altTitles = manga.title_synonyms?.length
                ? manga.title_synonyms.slice(0, 3).join(", ")
                : "Yok";

            const genres = manga.genres?.length
                ? manga.genres.map(g => g.name).join(", ")
                : "Belirtilmemiş";

            const authors = manga.authors?.length
                ? manga.authors.map(a => a.name).join(", ")
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

            const description =
                manga.synopsis
                    ? manga.synopsis.length > 1000
                        ? manga.synopsis.slice(0, 997) + "..."
                        : manga.synopsis
                    : "Açıklama bulunamadı.";

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
                        value: manga.chapters
                            ? String(manga.chapters)
                            : "Bilinmiyor",
                        inline: true
                    },
                    {
                        name: "📕 Cilt",
                        value: manga.volumes
                            ? String(manga.volumes)
                            : "Bilinmiyor",
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
                        value: manga.score
                            ? `${manga.score}/10`
                            : "Bilinmiyor",
                        inline: true
                    },
                    {
                        name: "🔤 Alternatif İsimler",
                        value: altTitles
                    }
                )
                .setFooter({
                    text: "Bankai Manga Sistemi"
                });

            if (manga.images?.jpg?.large_image_url) {
                embed.setThumbnail(manga.images.jpg.large_image_url);
            }

            if (manga.url) {
                embed.setURL(manga.url);
            }

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("Manga API hatası:", error);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Manga Sistemi Hatası")
                        .setDescription(
                            "Manga bilgisi alınırken bir hata oluştu. Birkaç saniye sonra tekrar dene."
                        )
                ]
            });
        }
    }
};

