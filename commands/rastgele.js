
const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "rastgele",

    aliases: [
        "randomanime",
        "random"
    ],

    description: "Rastgele bir anime önerir.",

    async execute(message) {
        try {
            // Jikan'dan rastgele anime al
            const response = await fetch(
                "https://api.jikan.moe/v4/random/anime"
            );

            if (!response.ok) {
                throw new Error(
                    `Jikan API Hatası: ${response.status}`
                );
            }

            const result = await response.json();
            const anime = result.data;

            if (!anime) {
                return message.reply(
                    "❌ Rastgele anime bulunamadı."
                );
            }

            const title =
                anime.title ||
                anime.title_english ||
                "Bilinmeyen Anime";

            const englishTitle =
                anime.title_english &&
                anime.title_english !== title
                    ? anime.title_english
                    : null;

            const type =
                anime.type || "Bilinmiyor";

            const episodes =
                anime.episodes || "Bilinmiyor";

            const score =
                anime.score
                    ? `${anime.score}/10`
                    : "Bilinmiyor";

            const status =
                anime.status || "Bilinmiyor";

            const year =
                anime.year ||
                anime.aired?.prop?.from?.year ||
                "Bilinmiyor";

            const genres =
                anime.genres?.length
                    ? anime.genres
                        .map(g => g.name)
                        .join(", ")
                    : "Belirtilmemiş";

            const synopsis =
                anime.synopsis ||
                "Bu anime hakkında açıklama bulunamadı.";

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle(`🎲 ${title}`)
                .setURL(
                    `https://myanimelist.net/anime/${anime.mal_id}`
                )
                .setDescription(
                    synopsis.length > 1000
                        ? synopsis.slice(0, 997) + "..."
                        : synopsis
                )
                .addFields(
                    {
                        name: "🎬 Tür",
                        value: type,
                        inline: true
                    },
                    {
                        name: "📺 Bölüm",
                        value: String(episodes),
                        inline: true
                    },
                    {
                        name: "⭐ Puan",
                        value: score,
                        inline: true
                    },
                    {
                        name: "📅 Yıl",
                        value: String(year),
                        inline: true
                    },
                    {
                        name: "📌 Durum",
                        value: status,
                        inline: true
                    },
                    {
                        name: "🏷️ Türler",
                        value: genres,
                        inline: false
                    }
                )
                .setThumbnail(
                    anime.images?.jpg?.image_url || null
                )
                .setFooter({
                    text: "Bankai • Rastgele Anime"
                })
                .setTimestamp();

            if (englishTitle) {
                embed.addFields({
                    name: "🇬🇧 İngilizce Adı",
                    value: englishTitle,
                    inline: false
                });
            }

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error(
                "❌ Rastgele anime hatası:",
                error
            );

            return message.reply(
                "❌ Rastgele anime alınırken bir hata oluştu. Birkaç saniye sonra tekrar dene."
            );
        }
    }
};

