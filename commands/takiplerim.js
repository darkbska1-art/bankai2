
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const FILE = path.join(process.cwd(), "takipler.json");

function loadData() {
    if (!fs.existsSync(FILE)) {
        fs.writeFileSync(FILE, "{}", "utf8");
    }

    try {
        return JSON.parse(
            fs.readFileSync(FILE, "utf8")
        );
    } catch {
        return {};
    }
}

module.exports = {
    name: "takiplerim",
    aliases: ["takiplistem", "takipler"],

    description: "Takip ettiğin anime ve mangaları gösterir.",

    async execute(message) {
        if (!message.guild) {
            return message.reply(
                "❌ Bu komut sunucuda kullanılabilir."
            );
        }

        const data = loadData();

        const follows =
            data[message.guild.id]?.[message.author.id] || [];

        const anime = follows.filter(
            x => x.type === "anime"
        );

        const manga = follows.filter(
            x => x.type === "manga"
        );

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("📋 Takip Listem")
            .setFooter({
                text: "Bankai Takip Sistemi"
            })
            .setTimestamp();

        embed.addFields({
            name: `🎬 Anime (${anime.length})`,
            value: anime.length
                ? anime
                    .map(x => `• **${x.title}**`)
                    .join("\n")
                    .slice(0, 1024)
                : "Anime takip etmiyorsun."
        });

        embed.addFields({
            name: `📖 Manga (${manga.length})`,
            value: manga.length
                ? manga
                    .map(x => `• **${x.title}**`)
                    .join("\n")
                    .slice(0, 1024)
                : "Manga takip etmiyorsun."
        });

        return message.reply({
            embeds: [embed]
        });
    }
};

