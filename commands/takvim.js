
const {
    EmbedBuilder
} = require("discord.js");

const DAYS = {
    monday: "Pazartesi",
    tuesday: "Salı",
    wednesday: "Çarşamba",
    thursday: "Perşembe",
    friday: "Cuma",
    saturday: "Cumartesi",
    sunday: "Pazar"
};

function getToday() {
    const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
    ];

    return days[new Date().getDay()];
}

function getDayName(day) {
    return DAYS[day] || day;
}

module.exports = {
    name: "takvim",
    aliases: ["animetakvim", "animeprogram"],

    description: "Bugün yayınlanacak animeleri gösterir.",

    async execute(message) {
        try {
            const today = getToday();

            const url =
                `https://api.jikan.moe/v4/schedules/${today}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Jikan API Hatası: ${response.status}`
                );
            }

            const result = await response.json();

            const animeList = result.data || [];

            if (!animeList.length) {
                const embed = new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("📅 Anime Takvimi")
                    .setDescription(
                        `**${getDayName(today)}** günü için yayın takviminde anime bulunamadı.`
                    )
                    .setFooter({
                        text: "Bankai • Anime Takvimi"
                    })
                    .setTimestamp();

                return message.reply({
                    embeds: [embed]
                });
            }

            // Aynı animeleri temizle
            const uniqueAnime = [];
            const seen = new Set();

            for (const anime of animeList) {
                if (!anime.mal_id || seen.has(anime.mal_id)) {
                    continue;
                }

                seen.add(anime.mal_id);
                uniqueAnime.push(anime);
            }

            // En fazla 15 anime göster
            const list = uniqueAnime
                .slice(0, 15)
                .map((anime, index) => {
                    const title =
                        anime.title ||
                        anime.title_english ||
                        "Bilinmeyen Anime";

                    const episodes =
                        anime.episodes
                            ? `Bölüm ${anime.episodes}`
                            : "Bölüm bilgisi yok";

                    return `**${index + 1}.** [${title}](https://myanimelist.net/anime/${anime.mal_id})\n> 🎬 ${episodes}`;
                })
                .join("\n\n");

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("📅 Anime Yayın Takvimi")
                .setDescription(
                    `**${getDayName(today)}** günü yayınlanacak animeler:\n\n${list}`
                )
                .setFooter({
                    text: `Bankai • ${uniqueAnime.length} anime bulundu`
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ Anime takvimi hatası:", error);

            return message.reply(
                "❌ Anime yayın takvimi alınırken bir hata oluştu. Birkaç saniye sonra tekrar dene."
            );
        }
    }
};

