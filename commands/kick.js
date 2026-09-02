// =====================================================
// commands/kick.js
// =====================================================

const {
    PermissionFlagsBits: KickPermissions,
    EmbedBuilder: KickEmbed
} = require("discord.js");

module.exports = {
    name: "kick",
    aliases: ["at"],

    async execute(message, args) {

        if (!message.member.permissions.has(KickPermissions.KickMembers)) {
            return message.reply("❌ **Üyeleri At** yetkin yok.");
        }

        const member =
            message.mentions.members.first() ||
            await message.guild.members.fetch(args[0]).catch(() => null);

        if (!member) {
            return message.reply(
                "❌ Bir üye belirtmelisin.\nÖrnek: `B!kick @Ali spam`"
            );
        }

        if (member.id === message.author.id) {
            return message.reply("❌ Kendini atamazsın.");
        }

        if (!member.kickable) {
            return message.reply(
                "❌ Bu üyeyi atamıyorum. Rol hiyerarşisini veya bot yetkilerini kontrol et."
            );
        }

        const sebep =
            args.slice(1).join(" ") ||
            "Sebep belirtilmedi.";

        try {

            await member.kick(
                `${sebep} | Yetkili: ${message.author.tag}`
            );

            const embed = new KickEmbed()
                .setColor(0x000000)
                .setTitle("👢 Üye Atıldı")
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    {
                        name: "👤 Üye",
                        value: `${member.user.tag}`,
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
            console.error("KICK HATASI:", error);
            return message.reply("❌ Üye atılırken bir hata oluştu.");
        }
    }
};