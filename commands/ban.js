// =====================================================
// commands/ban.js
// =====================================================

const {
    PermissionFlagsBits: BanPermissions,
    EmbedBuilder: BanEmbed
} = require("discord.js");

module.exports = {
    name: "ban",
    aliases: ["yasakla"],

    async execute(message, args) {

        if (!message.member.permissions.has(BanPermissions.BanMembers)) {
            return message.reply("❌ **Üyeleri Yasakla** yetkin yok.");
        }

        const member =
            message.mentions.members.first() ||
            await message.guild.members.fetch(args[0]).catch(() => null);

        if (!member) {
            return message.reply(
                "❌ Bir üye belirtmelisin.\nÖrnek: `B!ban @Ali spam`"
            );
        }

        if (member.id === message.author.id) {
            return message.reply("❌ Kendini yasaklayamazsın.");
        }

        if (!member.bannable) {
            return message.reply(
                "❌ Bu üyeyi yasaklayamıyorum. Rol hiyerarşisini veya bot yetkilerini kontrol et."
            );
        }

        const sebep =
            args.slice(1).join(" ") ||
            "Sebep belirtilmedi.";

        try {

            await member.ban({
                deleteMessageSeconds: 0,
                reason: `${sebep} | Yetkili: ${message.author.tag}`
            });

            const embed = new BanEmbed()
                .setColor(0x000000)
                .setTitle("🔨 Üye Yasaklandı")
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    {
                        name: "👤 Üye",
                        value: `${member.user.tag}`,
                        inline: true
                    },
                    {
                        name: "🆔 ID",
                        value: member.id,
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
            console.error("BAN HATASI:", error);
            return message.reply("❌ Üye yasaklanırken bir hata oluştu.");
        }
    }
};

