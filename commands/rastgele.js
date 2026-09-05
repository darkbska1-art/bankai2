
const { EmbedBuilder } = require("discord.js");

const API = "https://api.jikan.moe/v4";

// Jikan'a istek at, hata/504 olursa tekrar dene
async function fetchJikan(url, attempts = 3) {
    let lastError;

    for (let i = 1; i <= attempts; i++) {
        try {
            const response = await fetch(url);

            if (response.ok) {
                return await response.json();
            }

            lastError = new Error(
                `Jikan HTTP ${response.status}`
            );

            console.log(
                `⚠️ Jikan ${response.status} - Deneme ${i}/${attempts}`
            );

            if (
                response.status === 429 ||
                response.status >= 500
            ) {
                await new Promise(resolve =>
                    setTimeout(resolve, 2500 * i)
                );

                continue;
            }

            throw lastError;

        } catch (error) {
            lastError = error;

            console.log(
                `⚠️ Jikan bağlantı hatası - Deneme ${i}/${attempts}`
            );

            if (i < attempts) {
                await new Promise(resolve =>
                    setTimeout(resolve, 2500 * i)
                );
            }
        }
    }

    throw lastError;
}

module.exports = {
    name: "rastgele",

    aliases: [
        "randomanime",
        "random"
    ],

    description: "Rastgele bir anime önerir.",

    async execute(message) {
        try {
            /*
             * Random endpoint yerine
             * top anime listesini kullanıyoruz.
             */
            const result = await fetchJikan(
                `${API}/top/anime?limit=25`
            );

            const animeList =
                Array.isArray(result.data)
                    ? result.data
                    : [];

            if (!animeList.length) {
                throw new Error(
                    "Anime listesi boş geldi."
                );
            }

            // Rastgele anime seç
            const anime =
                animeList[
                    Math.floor(
                        Math.random() * animeList.length
                    )
                ];

            if (!anime) {
                throw new Error(
                    "Rastgele anime seçilemedi."
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
                anime.episodes ?? "Bilinmiyor";

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
                Array.isArray(anime.genres) &&
                anime.genres.length
                    ? anime.genres
                        .map(g => g.name)
                        .join(", ")
                    : "Belirtilmemiş";

            let synopsis =
                anime.synopsis ||
                "Bu anime hakkında açıklama bulunamadı.";

            if (synopsis.length > 1000) {
                synopsis =
                    synopsis.slice(0, 997) + "...";
            }

            const embed =
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle(`🎲 ${title}`)
                    .setURL(
                        `https://myanimelist.net/anime/${anime.mal_id}`
                    )
                    .setDescription(
                        synopsis
                    )
                    .addFields(
                        {
                            name: "🎬 Tür",
                            value: String(type),
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
                            value: String(status),
                            inline: true
                        },
                        {
                            name: "🏷️ Türler",
                            value: genres,
                            inline: false
                        }
                    )
                    .setThumbnail(
                        anime.images?.jpg?.large_image_url ||
                        anime.images?.jpg?.image_url ||
                        null
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

            const embed =
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("❌ Rastgele Anime")
                    .setDescription(
                        "Rastgele anime şu anda alınamıyor.\n\n" +
                        "Jikan API geçici olarak yoğun olabilir. Birkaç saniye sonra tekrar dene."
                    )
                    .setFooter({
                        text: "Bankai • Rastgele Anime"
                    })
                    .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }
    }
};

