const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "kanalsil",
    aliases: ["kanalsil", "kanalkaldır", "kanalkaldir"],

    async execute(message) {
        if (!message.guild) return;

        // Yetki kontrolü
        if (
            !message.member.permissions.has(
                PermissionFlagsBits.ManageChannels
            )
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın."
                        )
                ]
            });
        }

        const channel = message.channel;

        // Bot yetki kontrolü
        const botMember = message.guild.members.me;

        if (
            !botMember.permissions.has(
                PermissionFlagsBits.ManageChannels
            )
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Benim **Kanalları Yönet** yetkim yok."
                        )
                ]
            });
        }

        try {
            const channelName = channel.name;

            await channel.delete(
                `${message.author.tag} tarafından kanal silindi`
            );

            // Kanal silindiği için mesaj gönderemeyiz.
            // Log için konsola yazıyoruz.
            console.log(
                `🗑️ Kanal silindi: #${channelName} | ${message.author.tag}`
            );

        } catch (error) {
            console.error(
                "❌ Kanal silme hatası:",
                error
            );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Kanal silinirken bir hata oluştu."
                        )
                ]
            });
        }
    }
};