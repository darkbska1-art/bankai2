// =====================================================
// commands/unlock.js
// =====================================================

const {
    PermissionFlagsBits: UnlockPermissions,
    EmbedBuilder: UnlockEmbed
} = require("discord.js");

module.exports = {
    name: "unlock",
    aliases: ["kilitaç", "kilidiac", "aç"],

    async execute(message) {

        if (!message.member.permissions.has(
            UnlockPermissions.ManageChannels
        )) {
            return message.reply(
                "❌ **Kanalları Yönet** yetkin yok."
            );
        }

        const everyone =
            message.guild.roles.everyone;

        try {

            await message.channel.permissionOverwrites.edit(
                everyone,
                {
                    SendMessages: null
                }
            );

            const embed = new UnlockEmbed()
                .setColor(0x000000)
                .setTitle("🔓 Kanalın Kilidi Açıldı")
                .setDescription(
                    `Bu kanalın kilidi **${message.author}** tarafından açıldı.`
                )
                .setTimestamp();

            await message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("UNLOCK HATASI:", error);
            return message.reply(
                "❌ Kanalın kilidi açılırken bir hata oluştu."
            );
        }
    }
};