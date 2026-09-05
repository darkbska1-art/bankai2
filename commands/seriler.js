const {
    EmbedBuilder
} = require("discord.js");

const {
    getStreakLeaderboard
} = require("../database/database");

module.exports = {
    name: "seriler",

    aliases: [
        "serisiralama",
        "streaks"
    ],

    description: "Global seri sıralamasını gösterir.",

    async execute(message) {

        const users = getStreakLeaderboard(10);

        if (!users.length) {

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("🔥 Global Seri Sıralaması")
                .setDescription(
                    "Henüz seri oluşturan kimse yok."
                )
                .setFooter({
                    text: "Bankai • Global Seri"
                });

            return message.reply({
                embeds: [embed]
            });
        }


        let description = "";

        for (let i = 0; i < users.length; i++) {

            const user = users[i];

            let member;

            try {
                member = await message.client.users.fetch(
                    user.user_id
                );
            } catch {
                member = null;
            }

            const username =
                member?.username ||
                `Bilinmeyen Kullanıcı`;

            const medal =
                i === 0 ? "🥇" :
                i === 1 ? "🥈" :
                i === 2 ? "🥉" :
                `**${i + 1}.**`;

            description +=
                `${medal} ${username} — 🔥 **${user.best_streak}**\n`;
        }


        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🔥 Global Seri Sıralaması")
            .setDescription(description)
            .addFields({
                name: "🌍 Sistem",
                value: "Seriler tüm sunucular arasında ortaktır."
            })
            .setFooter({
                text: "Bankai • Global Seri"
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};