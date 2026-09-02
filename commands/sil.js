// =====================================================
// commands/sil.js
// =====================================================

const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "sil",
    aliases: ["clear", "temizle"],

    async execute(message, args) {

        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply("❌ Bu komutu kullanmak için **Mesajları Yönet** yetkisine sahip olmalısın.");
        }

        const miktar = Number(args[0]);

        if (!Number.isInteger(miktar) || miktar < 1 || miktar > 100) {
            return message.reply(
                "❌ **1-100** arasında bir sayı belirtmelisin.\nÖrnek: `B!sil 10`"
            );
        }

        try {
            const deleted = await message.channel.bulkDelete(miktar, true);

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🧹 Mesajlar Temizlendi")
                .setDescription(
                    `**${deleted.size}** mesaj başarıyla silindi.\n\n` +
                    `👮 Yetkili: ${message.author}`
                )
                .setTimestamp();

            const msg = await message.channel.send({
                embeds: [embed]
            });

            setTimeout(() => msg.delete().catch(() => {}), 5000);

        } catch (error) {
            console.error("SİL HATASI:", error);
            return message.reply(
                "❌ Mesajlar silinirken bir hata oluştu."
            );
        }
    }
};