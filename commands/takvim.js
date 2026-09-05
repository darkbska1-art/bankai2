
const { EmbedBuilder } = require("discord.js");

const API = "https://api.jikan.moe/v4";

const DAYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
];

const DAY_NAMES = {
    sunday: "Pazar",
    monday: "Pazartesi",
    tuesday: "Salı",
    wednesday: "Çarşamba",
    thursday: "Perşembe",
    friday: "Cuma",
    saturday: "Cumartesi"
};

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

            // Rate limit veya 5xx ise bekle
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
    name: "takvim",

    aliases: [
        "animetakvim",
        "animeprogram"
    ],

    description: "Bugün yayınlanacak animeleri gösterir.",

    async execute(message) {
        try {
            const today =
                DAYS[new Date().getDay()];

            const dayName =
                DAY_NAMES[today];

            const url =
                `${API}/schedules/${today}?limit=25`;

            const result =
                await fetchJikan(url);

            const animeList =
                Array.isArray(result.data)
                    ? result.data
                    : [];

            // Aynı anime birden fazla gelirse temizle
            const uniqueAnime = [];
            const seen = new Set();

            for (const anime of animeList) {
                if (!anime.mal_id) continue;

                if (seen.has(anime.mal_id)) {
                    continue;
                }

                seen.add(anime.mal_id);
                uniqueAnime.push(anime);
            }

            if (!uniqueAnime.length) {
                const embed = new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("📅 Anime Yayın Takvimi")
                    .setDescription(
                        `**${dayName}** günü için yayın takviminde anime bulunamadı.`
                    )
                    .setFooter({
                        text: "Bankai • Anime Takvimi"
                    })
                    .setTimestamp();

                return message.reply({
                    embeds: [embed]
                });
            }

            const list = uniqueAnime
                .slice(0, 15)
                .map((anime, index) => {
                    const title =
                        anime.title ||
                        anime.title_english ||
                        "Bilinmeyen Anime";

                    let time = "";

                    if (anime.broadcast?.time) {
                        time =
                            ` • 🕐 ${anime.broadcast.time} ${anime.broadcast.timezone || "JST"}`;
                    }

                    return (
                        `**${index + 1}.** ` +
                        `[${title}](https://myanimelist.net/anime/${anime.mal_id})` +
                        `${time}`
                    );
                })
                .join("\n");

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("📅 Anime Yayın Takvimi")
                .setDescription(
                    `**${dayName}** günü yayınlanacak animeler:\n\n${list}`
                )
                .addFields({
                    name: "📊 Toplam",
                    value: `${uniqueAnime.length} anime`,
                    inline: true
                })
                .setFooter({
                    text: "Bankai • Anime Takvimi"
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error(
                "❌ Anime takvimi hatası:",
                error
            );

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("❌ Anime Takvimi")
                .setDescription(
                    "Anime yayın takvimi şu anda alınamıyor.\n\n" +
                    "Jikan API geçici olarak yoğun olabilir. Birkaç saniye sonra tekrar dene."
                )
                .setFooter({
                    text: "Bankai • Anime Takvimi"
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }
    }
};

