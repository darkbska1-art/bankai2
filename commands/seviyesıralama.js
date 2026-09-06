const {
    EmbedBuilder
} = require("discord.js");

const {
    loadData
} = require("../events/levelSystem");

module.exports = {

    name: "seviyesiralama",
    aliases: [
        "levelsiralama",
        "levelboard",
        "leaderboard",
        "top"
    ],

    async execute(message) {

        if (!message.guild) return;

        const data = loadData();

        const guildData = data[message.guild.id];

        // Sunucuda level sistemi yoksa
        if (!guildData || !guildData.users) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🏆 Seviye Sıralaması")
                        .setDescription(
                            "❌ Bu sunucuda henüz seviye verisi bulunmuyor."
                        )
                ]
            });
        }

        // Kullanıcıları XP'ye göre sırala
        const users = Object.entries(guildData.users)
            .map(([userId, userData]) => ({
                userId,
                level: Number(userData.level) || 0,
                xp: Number(userData.xp) || 0
            }))
            .sort((a, b) => {

                // Önce level
                if (b.level !== a.level) {
                    return b.level - a.level;
                }

                // Level eşitse XP
                return b.xp - a.xp;
            })
            .slice(0, 10);

        // Hiç kullanıcı yoksa
        if (users.length === 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🏆 Seviye Sıralaması")
                        .setDescription(
                            "📭 Henüz sıralamada kullanıcı bulunmuyor."
                        )
                ]
            });
        }

        // =====================================================
        // SIRALAMA
        // =====================================================

        let description = "";

        for (let i = 0; i < users.length; i++) {

            const user = users[i];

            let member;

            try {
                member = await message.guild.members
                    .fetch(user.userId);
            } catch {
                member = null;
            }

            const username =
                member
                    ? member.user.username
                    : `Bilinmeyen Kullanıcı`;

            let medal;

            if (i === 0) medal = "🥇";
            else if (i === 1) medal = "🥈";
            else if (i === 2) medal = "🥉";
            else medal = `**${i + 1}.**`;

            description +=
                `${medal} ${member ? `<@${user.userId}>` : username}\n` +
                `> ⭐ Seviye: **${user.level}** • XP: **${user.xp}**\n\n`;
        }

        // Kullanıcının kendi sırasını bul
        const ownIndex = users.findIndex(
            user => user.userId === message.author.id
        );

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("🏆 Seviye Sıralaması")
            .setDescription(description)
            .setFooter({
                text: `Bankai • İlk ${users.length} kullanıcı`
            })
            .setTimestamp();

        if (ownIndex !== -1) {
            embed.addFields({
                name: "📊 Senin Sıran",
                value:
                    `**#${ownIndex + 1}** • ` +
                    `Seviye **${users[ownIndex].level}** • ` +
                    `${users[ownIndex].xp} XP`
            });
        }

        return message.reply({
            embeds: [embed]
        });
    }
};