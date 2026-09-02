// =====================================================
// commands/timeout.js
// =====================================================

const {
    PermissionFlagsBits: TimeoutPermissions,
    EmbedBuilder: TimeoutEmbed
} = require("discord.js");

module.exports = {
    name: "timeout",
    aliases: ["mute", "sustur"],

    async execute(message, args) {

        if (!message.member.permissions.has(TimeoutPermissions.ModerateMembers)) {
            return message.reply("❌ **Üyelere Zaman Aşımı Uygula** yetkin yok.");
        }

        const member =
            message.mentions.members.first() ||
            await message.guild.members.fetch(args[0]).catch(() => null);

        if (!member) {
            return message.reply(
                "❌ Bir üye belirtmelisin.\nÖrnek: `B!timeout @Ali 10m spam`"
            );
        }

        if (member.id === message.author.id) {
            return message.reply("❌ Kendine timeout veremezsin.");
        }

        if (!member.moderatable) {
            return message.reply(
                "❌ Bu üyeye timeout uygulayamıyorum. Rol hiyerarşisini veya bot yetkilerini kontrol et."
            );
        }

        const sure = args[1];

        if (!sure) {
            return message.reply(
                "❌ Bir süre belirtmelisin.\nÖrnek: `B!timeout @Ali 10m spam`"
            );
        }

        const match = sure.match(/^(\d+)(s|m|h|d)$/i);

        if (!match) {
            return message.reply(
                "❌ Geçerli süre kullan.\n\n" +
                "`10s` = 10 saniye\n" +
                "`10m` = 10 dakika\n" +
                "`2h` = 2 saat\n" +
                "`1d` = 1 gün"
            );
        }

        const miktar = Number(match[1]);
        const birim = match[2].toLowerCase();

        const carpan = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000
        };

        const duration = miktar * carpan[birim];

        // Discord maksimum timeout: 28 gün
        if (duration > 28 * 24 * 60 * 60 * 1000) {
            return message.reply(
                "❌ Timeout süresi en fazla **28 gün** olabilir."
            );
        }

        const sebep =
            args.slice(2).join(" ") ||
            "Sebep belirtilmedi.";

        try {

            await member.timeout(
                duration,
                `${sebep} | Yetkili: ${message.author.tag}`
            );

            const embed = new TimeoutEmbed()
                .setColor(0x000000)
                .setTitle("⏱️ Timeout Uygulandı")
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    {
                        name: "👤 Üye",
                        value: `${member.user.tag}`,
                        inline: true
                    },
                    {
                        name: "⏱️ Süre",
                        value: `\`${sure}\``,
                        inline: true
                    },
                    {
                        name: "👮 Yetkili",
                        value: `${message.author}`,
                        inline: true
                    },
                    {
                        name: "📝 Sebep",
                        value: sebep,
                        inline: false
                    }
                )
                .setTimestamp();

            await message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("TIMEOUT HATASI:", error);
            return message.reply("❌ Timeout uygulanırken bir hata oluştu.");
        }
    }
};