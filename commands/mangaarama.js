
const { EmbedBuilder } = require("discord.js");

const API = "https://api.jikan.moe/v4";

module.exports = {
    name: "mangaarama",
    aliases: ["mangaara", "mangasearch"],

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
                            "**Örnek:**\n" +
                            "`B!mangaarama One Piece`"
                        )
                ]
            });
        }

        const query = args.join(" ").trim();

        try {

            const url =
                `${API}/manga?q=${encodeURIComponent(query)}&limit=10`;

            const response = await fetch(url);

            // Jikan rate limit
            if (response.status === 429) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("⏳ Jikan API Meşgul")
                            .setDescription(
                                "Çok kısa sürede fazla arama yapıldı.\n\n" +
                                "Birkaç saniye bekleyip tekrar dene."
                            )
                    ]
                });
            }

            if (!response.ok) {
                console.error(
                    `❌ Jikan manga API hatası: ${response.status}`
                );

                throw new Error(
                    `Jikan API ${response.status}`
                );
            }

            const result = await response.json();

            if (!result || !Array.isArray(result.data)) {
                throw new Error(
                    "Jikan geçersiz veri döndürdü."
                );
            }

            if (result.data.length === 0) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("❌ Sonuç Bulunamadı")
                            .setDescription(
                                `**${query}** için manga bulunamadı.`
                            )
                    ]
                });
            }

            const list = result.data
                .slice(0, 10)
                .map((manga, index) => {

                    const title =
                        manga.title ||
                        manga.title_english ||
                        manga.title_japanese ||
                        "Bilinmeyen";

                    const type =
                        manga.type ||
                        "Bilinmiyor";

                    const score =
                        typeof manga.score === "number"
                            ? `${manga.score}/10`
                            : "Puan yok";

                    const year =
                        manga.published?.from
                            ? new Date(
                                manga.published.from
                            ).getFullYear()
                            : "Bilinmiyor";

                    const chapters =
                        manga.chapters ??
                        "Bilinmiyor";

                    const volumes =
                        manga.volumes ??
                        "Bilinmiyor";

                    return (
                        `**${index + 1}. ${title}**\n` +
                        `> 📚 Tür: **${type}**\n` +
                        `> ⭐ Puan: **${score}**\n` +
                        `> 📖 Bölüm: **${chapters}**\n` +
                        `> 📕 Cilt: **${volumes}**\n` +
                        `> 📅 Yıl: **${year}**`
                    );
                })
                .join("\n\n");

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle(`🔎 Manga Arama: ${query}`)
                .setDescription(list)
                .setFooter({
                    text: "Bankai Manga Sistemi • Jikan • İlk 10 sonuç"
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                "❌ Manga arama hatası:",
                error
            );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Manga Arama Hatası")
                        .setDescription(
                            "Jikan manga servisine şu anda ulaşılamıyor.\n\n" +
                            "Birkaç saniye sonra tekrar dene."
                        )
                ]
            });
        }
    }
};

