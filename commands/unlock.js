
// =====================================================
// commands/unlock.js
// =====================================================

const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "unlock",
    aliases: ["kilitaç", "kilidiac", "aç"],

    async execute(message) {

        // Yetki kontrolü
        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageChannels
        )) {
            return message.reply(
                "❌ **Kanalları Yönet** yetkin yok."
            );
        }

        const channel = message.channel;
        const everyone = message.guild.roles.everyone;

        try {

            // @everyone'ın bu kanaldaki özel iznini al
            const overwrite =
                channel.permissionOverwrites.cache.get(
                    everyone.id
                );

            // Gerçekten kilitli mi?
            const isLocked =
                overwrite?.deny.has(
                    PermissionFlagsBits.SendMessages
                );

            // Zaten açıksa
            if (!isLocked) {
                return message.reply(
                    "🔓 Bu kanal zaten **açık**."
                );
            }

            // Kilidi kaldır
            await channel.permissionOverwrites.edit(
                everyone,
                {
                    SendMessages: null
                }
            );

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🔓 Kanalın Kilidi Açıldı")
                .setDescription(
                    `Bu kanalın kilidi **${message.author}** tarafından açıldı.\n\n` +
                    `🔓 Üyeler artık bu kanala mesaj gönderebilir.`
                )
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {

            console.error("❌ UNLOCK HATASI:", error);

            return message.reply(
                "❌ Kanalın kilidi açılırken bir hata oluştu."
            );
        }
    }
};

