
// =====================================================
// commands/lock.js
// =====================================================

const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "lock",
    aliases: ["kilit", "kilitle"],

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

            // Zaten kilitli mi?
            const isLocked =
                overwrite?.deny.has(
                    PermissionFlagsBits.SendMessages
                );

            if (isLocked) {
                return message.reply(
                    "🔒 Bu kanal zaten **kilitli**."
                );
            }

            // Kanalı kilitle
            await channel.permissionOverwrites.edit(
                everyone,
                {
                    SendMessages: false
                }
            );

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🔒 Kanal Kilitlendi")
                .setDescription(
                    `Bu kanal **${message.author}** tarafından kilitlendi.\n\n` +
                    `🔒 Üyeler artık bu kanala mesaj gönderemez.`
                )
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {

            console.error("❌ LOCK HATASI:", error);

            return message.reply(
                "❌ Kanal kilitlenirken bir hata oluştu."
            );
        }
    }
};

