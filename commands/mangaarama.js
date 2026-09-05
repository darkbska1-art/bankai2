
const {
    EmbedBuilder
} = require("discord.js");

const API = "https://api.jikan.moe/v4";

module.exports = {
    name: "mangaarama",
    aliases: ["mangaara", "mangasearch"],

    async execute(message, args) {
        if (!args.length) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("🔎 Manga Arama")
                        .setDescription(
                            "Örnek:\n`B!mangaarama One Piece`"
                        )
                ]
            });
        }

        const query = args.join(" ");

        try {
            const response = await fetch(
                `${API}/manga?q=${encodeURIComponent(query)}&limit=10`
            );

            if (!response.ok) {
                throw new Error(`Jikan API ${response.status}`);
            }

            const result = await response.json();

            if (!result.data?.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("❌ Sonuç Bulunamadı")
                            .setDescription(
                                `"${query}" için manga bulunamadı.`
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
                        "Bilinmeyen";

                    const type = manga.type || "Bilinmiyor";

                    const score = manga.score
                        ? `${manga.score}/10`
                        : "Puan yok";

                    const year = manga.published?.from
                        ? new Date(manga.published.from).getFullYear()
                        : "Bilinmiyor";

                    return (
                        `**${index + 1}. ${title}**\n` +
                        `> 📚 ${type} • ⭐ ${score} • 📅 ${year}`
                    );
                })
                .join("\n\n");

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle(`🔎 Manga Arama: ${query}`)
                        .setDescription(list)
                        .setFooter({
                            text: "Bankai Manga Sistemi • İlk 10 sonuç"
                        })
                ]
            });

        } catch (error) {
            console.error("Manga arama hatası:", error);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Manga Arama Hatası")
                        .setDescription(
                            "Manga aranırken bir hata oluştu. Daha sonra tekrar dene."
                        )
                ]
            });
        }
    }
};

