const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "emoji",
    aliases: ["emojiinfo", "emojibilgi"],

    async execute(message, args) {
        if (!args[0]) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("😀 Emoji Bilgisi")
                        .setDescription(
                            "**Kullanım:**\n" +
                            "`B!emoji :emoji:`\n" +
                            "`B!emoji emojiID`\n\n" +
                            "**Örnek:**\n" +
                            "`B!emoji :anime:`"
                        )
                ]
            });
        }

        let emoji = null;

        // Emoji ID'si ile arama
        if (/^\d+$/.test(args[0])) {
            emoji = message.guild.emojis.cache.get(args[0]);
        }

        // <:isim:id> veya <a:isim:id> formatı
        if (!emoji) {
            const match = args[0].match(
                /^<a?:([^:]+):(\d+)>$/
            );

            if (match) {
                emoji = message.guild.emojis.cache.get(match[2]);
            }
        }

        if (!emoji) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bu sunucuda böyle bir emoji bulunamadı."
                        )
                ]
            });
        }

        const emojiUrl = emoji.imageURL({
            size: 1024
        });

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("😀 Emoji Bilgisi")
            .setThumbnail(emojiUrl)
            .addFields(
                {
                    name: "😀 Emoji",
                    value: `${emoji}`,
                    inline: true
                },
                {
                    name: "📝 İsim",
                    value: `\`${emoji.name}\``,
                    inline: true
                },
                {
                    name: "🆔 ID",
                    value: `\`${emoji.id}\``,
                    inline: true
                },
                {
                    name: "✨ Tür",
                    value: emoji.animated
                        ? "Animasyonlu"
                        : "Normal",
                    inline: true
                },
                {
                    name: "👤 Oluşturan",
                    value: emoji.author
                        ? `${emoji.author}`
                        : "Bilinmiyor",
                    inline: true
                },
                {
                    name: "🔗 Link",
                    value: `[Emoji URL'si](${emojiUrl})`,
                    inline: true
                }
            )
            .setFooter({
                text: `Bankai • ${message.guild.name}`
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};