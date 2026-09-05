
const { EmbedBuilder } = require("discord.js");

const API = "https://api.jikan.moe/v4";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// JIKAN İSTEK
// =====================================================

async function jikanRequest(endpoint, retries = 4) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(
                `${API}${endpoint}`,
                {
                    headers: {
                        "User-Agent": "Bankai-Discord-Bot/1.0",
                        "Accept": "application/json"
                    }
                }
            );

            // Rate limit
            if (response.status === 429) {
                const retryAfter =
                    response.headers.get("Retry-After");

                const waitTime = retryAfter
                    ? Math.max(
                        Number(retryAfter) * 1000,
                        2000
                    )
                    : 3000;

                console.log(
                    `⏳ Jikan 429 → ${waitTime}ms bekleniyor...`
                );

                await sleep(waitTime);
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

            console.log(
                `⚠️ Jikan isteği başarısız. ${attempt}/${retries} tekrar...`
            );

            await sleep(2000);
        }
    }

    throw new Error("Jikan isteği başarısız.");
}

// =====================================================
// YARDIMCI
// =====================================================

function safeText(value, fallback = "Bilinmiyor") {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    return String(value);
}

function getYear(manga) {
    if (!manga?.published?.from) {
        return "Bilinmiyor";
    }

    const date = new Date(
        manga.published.from
    );

    if (Number.isNaN(date.getTime())) {
        return "Bilinmiyor";
    }

    return String(
        date.getFullYear()
    );
}

function getAuthors(manga) {
    if (
        !Array.isArray(manga?.authors) ||
        manga.authors.length === 0
    ) {
        return "Bilinmiyor";
    }

    return manga.authors
        .map(author => author?.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ") || "Bilinmiyor";
}

function getGenres(manga) {
    if (
        !Array.isArray(manga?.genres) ||
        manga.genres.length === 0
    ) {
        return "Bilinmiyor";
    }

    return manga.genres
        .map(genre => genre?.name)
        .filter(Boolean)
        .slice(0, 5)
        .join(", ") || "Bilinmiyor";
}

function getTitle(manga) {
    return (
        manga?.title ||
        manga?.title_english ||
        manga?.title_japanese ||
        "Bilinmeyen Manga"
    );
}

// =====================================================
// KOMUT
// =====================================================

module.exports = {
    name: "mangaarama",

    aliases: [
        "mangaara",
        "mangasearch"
    ],

    description: "Jikan üzerinden manga arar.",

    async execute(message, args) {

        if (!args.length) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("🔎 Manga Arama")
                        .setDescription(
                            "Aramak istediğin mangayı yazmalısın.\n\n" +
                            "**Örnekler:**\n" +
                            "`B!mangaarama One Piece`\n" +
                            "`B!mangaara Naruto`\n" +
                            "`B!mangasearch Bleach`"
                        )
                        .setFooter({
                            text:
                                "Bankai Manga Sistemi"
                        })
                ]
            });
        }

        const query =
            args.join(" ").trim();

        if (!query) {
            return message.reply(
                "❌ Manga adını yazmalısın."
            );
        }

        // Çok uzun sorguları engelle
        if (query.length > 100) {
            return message.reply(
                "❌ Manga arama metni çok uzun."
            );
        }

        try {

            const result =
                await jikanRequest(
                    `/manga?q=${encodeURIComponent(query)}&limit=10`
                );

            const mangas =
                Array.isArray(result?.data)
                    ? result.data
                    : [];

            if (!mangas.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle(
                                "❌ Sonuç Bulunamadı"
                            )
                            .setDescription(
                                `**${query}** için manga bulunamadı.`
                            )
                            .setFooter({
                                text:
                                    "Bankai Manga Sistemi • Jikan"
                            })
                    ]
                });
            }

            // =================================================
            // SONUÇLAR
            // =================================================

            const results = mangas
                .slice(0, 10)
                .map((manga, index) => {

                    const title =
                        getTitle(manga);

                    const type =
                        safeText(
                            manga.type
                        );

                    const score =
                        typeof manga.score === "number"
                            ? `${manga.score}/10`
                            : "Puan yok";

                    const chapters =
                        safeText(
                            manga.chapters
                        );

                    const volumes =
                        safeText(
                            manga.volumes
                        );

                    const year =
                        getYear(manga);

                    const status =
                        safeText(
                            manga.status
                        );

                    return (
                        `**${index + 1}. ${title}**\n` +
                        `> 📚 Tür: **${type}**\n` +
                        `> ⭐ Puan: **${score}**\n` +
                        `> 📖 Bölüm: **${chapters}**\n` +
                        `> 📕 Cilt: **${volumes}**\n` +
                        `> 📅 Yıl: **${year}**\n` +
                        `> 📌 Durum: **${status}**`
                    );
                });

            let description =
                results.join("\n\n");

            // Discord 4096 karakter sınırı
            if (description.length > 4000) {
                description =
                    description.slice(0, 3997) +
                    "...";
            }

            const embed =
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle(
                        `🔎 Manga Arama: ${query}`
                    )
                    .setDescription(
                        description
                    )
                    .setFooter({
                        text:
                            "Bankai Manga Sistemi • Jikan • İlk 10 sonuç"
                    })
                    .setTimestamp();

            // İlk sonucun kapağını kullan
            const first =
                mangas[0];

            const image =
                first?.images?.jpg
                    ?.large_image_url ||
                first?.images?.jpg
                    ?.image_url;

            if (image) {
                embed.setThumbnail(
                    image
                );
            }

            // İlk sonuç için MAL linki
            if (first?.url) {
                embed.setURL(
                    first.url
                );
            }

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                "❌ Manga arama hatası:",
                error
            );

            let messageText =
                "Jikan manga servisine şu anda ulaşılamıyor.";

            if (
                String(error.message)
                    .includes("429")
            ) {
                messageText =
                    "Jikan şu anda çok fazla istek aldığı için yanıt vermiyor.\n\n" +
                    "⏳ Birkaç saniye bekleyip tekrar dene.";
            }

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle(
                            "❌ Manga Arama Hatası"
                        )
                        .setDescription(
                            messageText
                        )
                        .setFooter({
                            text:
                                "Bankai Manga Sistemi • Jikan"
                        })
                ]
            });
        }
    }
};

