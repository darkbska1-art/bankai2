
const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "slowmode",
    aliases: ["yavaşmod", "yavasmod"],

    async execute(message, args) {

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageChannels
        )) {
            return message.reply(
                "❌ **Kanalları Yönet** yetkin yok."
            );
        }

        const seconds = Number(args[0]);

        if (
            args.length === 0 ||
            isNaN(seconds) ||
            seconds < 0 ||
            seconds > 21600
        ) {
            return message.reply(
                "❌ Geçerli bir süre belirtmelisin.\n\n" +
                "**Kullanım:**\n" +
                "`B!slowmode 10` → 10 saniye\n" +
                "`B!slowmode 60` → 1 dakika\n" +
                "`B!slowmode 0` → Kapatır\n\n" +
                "⏱️ Maksimum süre: **21600 saniye (6 saat)**"
            );
        }

        try {

            await message.channel.setRateLimitPerUser(seconds);

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🐌 Slowmode")
                .setDescription(
                    seconds === 0
                        ? `🔓 Slowmode **${message.author}** tarafından kapatıldı.`
                        : `🐌 Slowmode **${message.author}** tarafından ayarlandı.`
                )
                .addFields({
                    name: "⏱️ Süre",
                    value: seconds === 0
                        ? "**Kapalı**"
                        : `**${seconds} saniye**`,
                    inline: true
                })
                .setFooter({
                    text: `${message.guild.name} • Moderasyon`
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ SLOWMODE HATASI:", error);

            return message.reply(
                "❌ Slowmode ayarlanırken bir hata oluştu."
            );
        }
    }
};

