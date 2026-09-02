const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const {
    loadData,
    saveData
} = require("../events/levelSystem");

module.exports = {

    name: "seviyesistem",
    aliases: ["levelayar", "level"] ,

    async execute(message, args) {

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply(
                "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekli."
            );
        }

        const durum =
            args[0]?.toLowerCase();

        if (
            durum !== "aç" &&
            durum !== "kapat"
        ) {
            return message.reply(
                "❌ Kullanım:\n\n" +
                "`B!seviyesistem aç`\n" +
                "`B!seviyesistem kapat`"
            );
        }

        const data =
            loadData();

        if (!data[message.guild.id]) {
            data[message.guild.id] = {
                enabled: true,
                users: {}
            };
        }

        data[message.guild.id].enabled =
            durum === "aç";

        saveData(data);

        const embed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("⭐ Level Sistemi")
                .setDescription(
                    durum === "aç"
                        ? "🟢 Level sistemi **açıldı**."
                        : "🔴 Level sistemi **kapatıldı**."
                )
                .setTimestamp();

        await message.reply({
            embeds: [embed]
        });
    }
};