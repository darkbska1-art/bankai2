
const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "ship",
    aliases: ["uyum"],

    async execute(message) {

        const mentioned =
            message.mentions.users.first();

        if (!mentioned) {
            return message.reply(
                "❌ Bir kullanıcı etiketlemelisin.\n\n" +
                "Örnek: `B!ship @Ali`"
            );
        }

        if (mentioned.id === message.author.id) {
            return message.reply(
                "❌ Kendinle eşleşme yapamazsın."
            );
        }

        // Kullanıcılara göre sabit sonuç
        // Aynı iki kişi her çalıştırmada
        // farklı sonuç almaz.
        const ids = [
            message.author.id,
            mentioned.id
        ].sort();

        let hash = 0;

        for (const id of ids.join("")) {
            hash =
                ((hash << 5) - hash) +
                id.charCodeAt(0);

            hash |= 0;
        }

        const percentage =
            Math.abs(hash) % 101;

        let text;

        if (percentage >= 90) {
            text = "💖 Mükemmel uyum!";
        } else if (percentage >= 70) {
            text = "💕 Çok iyi anlaşıyorsunuz!";
        } else if (percentage >= 50) {
            text = "💗 Güzel bir uyum var!";
        } else if (percentage >= 30) {
            text = "💛 Biraz daha tanışmanız gerekebilir.";
        } else {
            text = "💔 Pek uyumlu görünmüyor.";
        }

        const embed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("💕 Ship Sistemi")
                .setDescription(
                    `${message.author} 💞 ${mentioned}\n\n` +
                    `## 💗 %${percentage}\n\n` +
                    text
                )
                .setFooter({
                    text:
                        `${message.guild.name} • Ship`
                })
                .setTimestamp();

        await message.reply({
            embeds: [embed]
        });
    }
};

