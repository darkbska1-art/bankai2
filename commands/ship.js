
const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "ship",
    aliases: ["uyum"],

    async execute(message) {

        const mentioned = message.mentions.users.first();

        if (!mentioned) {
            return message.reply(
                "❌ Bir kullanıcı etiketlemelisin.\n\n" +
                "Örnek: `B!ship @Ali`"
            );
        }

        if (mentioned.bot) {
            return message.reply(
                "❌ Botlarla ship yapamazsın."
            );
        }

        if (mentioned.id === message.author.id) {
            return message.reply(
                "❌ Kendinle eşleşme yapamazsın."
            );
        }

        // =====================================================
        // SABİT SHIP SONUCU
        // Aynı iki kişi her seferinde aynı sonucu alır.
        // =====================================================

        const ids = [
            message.author.id,
            mentioned.id
        ].sort();

        let hash = 0;

        for (const char of ids.join("")) {
            hash =
                ((hash << 5) - hash) +
                char.charCodeAt(0);

            hash |= 0;
        }

        const percentage =
            Math.abs(hash) % 101;

        // =====================================================
        // UYUM MESAJI
        // =====================================================

        let text;
        let emoji;

        if (percentage >= 90) {
            emoji = "💖";
            text = "Mükemmel bir uyum!";
        } else if (percentage >= 75) {
            emoji = "💕";
            text = "Çok yüksek bir uyum var!";
        } else if (percentage >= 60) {
            emoji = "💗";
            text = "Gayet güzel bir uyum!";
        } else if (percentage >= 45) {
            emoji = "💛";
            text = "Fena değil, biraz daha tanışabilirsiniz.";
        } else if (percentage >= 25) {
            emoji = "🧡";
            text = "Biraz daha ortak nokta lazım.";
        } else {
            emoji = "💔";
            text = "Uyumunuz pek yüksek görünmüyor.";
        }

        // =====================================================
        // UYUM BARI
        // =====================================================

        const barSize = 10;

        const filled =
            Math.round((percentage / 100) * barSize);

        const empty =
            barSize - filled;

        const bar =
            "❤️".repeat(filled) +
            "🖤".repeat(empty);

        // =====================================================
        // EMBED
        // =====================================================

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("💕 Ship")
            .setDescription(
                `${message.author} 💞 ${mentioned}\n\n` +

                `## ${emoji} %${percentage}\n` +

                `${bar}\n\n` +

                `**${text}**`
            )

            .addFields(
                {
                    name: "👤 Kullanıcı 1",
                    value: `${message.author}`,
                    inline: true
                },
                {
                    name: "👤 Kullanıcı 2",
                    value: `${mentioned}`,
                    inline: true
                }
            )

            // Görsel
            .setImage(
                "https://cdn.discordapp.com/embed/avatars/5.png"
            )

            // Kullanıcının avatarı
            .setThumbnail(
                message.author.displayAvatarURL({
                    extension: "png",
                    size: 256
                })
            )

            .setFooter({
                text: `${message.guild.name} • Ship`
            })

            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};

