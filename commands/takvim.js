
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

// Jikan API'den veri çek
async function fetchJikan(url, attempts = 3) {
    let lastError;

    for (let i = 1; i <= attempts; i++) {
        try {
            console.log(`📡 Jikan isteği: ${url}`);

            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Bankai Discord Bot"
                }
            });

            console.log(`📡 Jikan cevap: ${response.status}`);

            if (response.ok) {
                return await response.json();
            }

            lastError = new Error(
                `Jikan HTTP ${response.status}`
            );

            if (response.status === 429 || response.status >= 500) {
                console.log(
                    `⚠️ Jikan ${response.status} - ${i}/${attempts}`
                );

                if (i < attempts) {
                    await new Promise(resolve =>
                        setTimeout(resolve, 3000 * i)
                    );
                    continue;
                }
            }

            throw lastError;

        } catch (error) {
            lastError = error;

            console.error(
                `❌ Jikan hatası ${i}/${attempts}:`,
                error.message
            );

            if (i < attempts) {
                await new Promise(resolve =>
                    setTimeout(resolve, 3000 * i)
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
            const today = DAYS[new Date().getDay()];
            const dayName = DAY_NAMES[today];

            /*
             * Önce normal endpoint deneniyor.
             */
            let result;

            try {
                result = await fetchJikan(
                    `${API}/schedules/${today}?limit=25&sfw=true`
                );
            } catch (firstError) {
                console.log(
                    "⚠️ İlk takvim endpointi çalışmadı, alternatif deneniyor..."
                );

                /*
                 * Alternatif Jikan endpointi
                 */
                result = await fetchJikan(
                    `${API}/schedules?filter=${today}&limit=25&sfw=true`
                );
            }

            const animeList =
                Array.isArray(result?.data)
                    ? result.data
                    : [];

            // Aynı animeyi tekrar gösterme
            const uniqueAnime = [];
            const seen = new Set();

            for (const anime of animeList) {
                if (!anime?.mal_id) continue;

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
                        anime.title_english ||
                        anime.title ||
                        anime.title_japanese ||
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
                    "Jikan API geçici olarak cevap vermiyor. Birkaç saniye sonra tekrar dene."
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

