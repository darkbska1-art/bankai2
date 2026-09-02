
const {
    PermissionFlagsBits: LockPermissions,
    EmbedBuilder: LockEmbed
} = require("discord.js");

module.exports = {
    name: "lock",
    aliases: ["kilit", "kilitle"],

    async execute(message) {

        if (!message.member.permissions.has(
            LockPermissions.ManageChannels
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
                    SendMessages: false
                }
            );

            const embed = new LockEmbed()
                .setColor(0x000000)
                .setTitle("🔒 Kanal Kilitlendi")
                .setDescription(
                    `Bu kanal **${message.author}** tarafından kilitlendi.`
                )
                .setTimestamp();

            await message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("LOCK HATASI:", error);
            return message.reply(
                "❌ Kanal kilitlenirken bir hata oluştu."
            );
        }
    }
};