// =====================================================
// commands/unban.js
// =====================================================

const {
    PermissionFlagsBits: UnbanPermissions,
    EmbedBuilder: UnbanEmbed
} = require("discord.js");

module.exports = {
    name: "unban",
    aliases: ["yasağıaç", "unbanla"],

    async execute(message, args) {

        if (!message.member.permissions.has(UnbanPermissions.BanMembers)) {
            return message.reply("❌ **Üyeleri Yasakla** yetkin yok.");
        }

        const userId = args[0];

        if (!userId) {
            return message.reply(
                "❌ Bir kullanıcı ID'si belirtmelisin.\nÖrnek: `B!unban 123456789012345678`"
            );
        }

        try {

            const banInfo =
                await message.guild.bans.fetch(userId).catch(() => null);

            if (!banInfo) {
                return message.reply(
                    "❌ Bu kullanıcı sunucunun yasaklı listesinde bulunamadı."
                );
            }

            await message.guild.members.unban(
                userId,
                `Yetkili: ${message.author.tag}`
            );

            const embed = new UnbanEmbed()
                .setColor(0x000000)
                .setTitle("🔓 Yasak Kaldırıldı")
                .setDescription(
                    `**${banInfo.user.tag}** adlı kullanıcının yasağı kaldırıldı.`
                )
                .addFields({
                    name: "👮 Yetkili",
                    value: `${message.author}`,
                    inline: true
                })
                .setTimestamp();

            await message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("UNBAN HATASI:", error);
            return message.reply("❌ Kullanıcının yasağı kaldırılırken hata oluştu.");
        }
    }
};
