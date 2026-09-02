
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
    aliases: ["levelayar", "level"],

    async execute(message, args) {

        // Yetki kontrolü
        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply(
                "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekli."
            );
        }

        const durum = args[0]?.toLowerCase();

        // Kullanım kontrolü
        if (
            durum !== "aç" &&
            durum !== "kapat"
        ) {
            return message.reply(
                "❌ Kullanım:\n\n" +
                "`B!seviyesistem aç #kanal`\n" +
                "`B!seviyesistem kapat`"
            );
        }

        const data = loadData();

        // Sunucu verisi yoksa oluştur
        if (!data[message.guild.id]) {
            data[message.guild.id] = {
                enabled: false,
                channelId: null,
                users: {}
            };
        }

        // KAPAT
        if (durum === "kapat") {

            data[message.guild.id].enabled = false;

            saveData(data);

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("⭐ Level Sistemi")
                .setDescription(
                    "🔴 Level sistemi **kapatıldı**."
                )
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // AÇ
        const kanal =
            message.mentions.channels.first();

        if (!kanal) {
            return message.reply(
                "❌ Level mesajlarının gönderileceği kanalı belirtmelisin.\n\n" +
                "Örnek: `B!seviyesistem aç #level`"
            );
        }

        // Kanalı kaydet
        data[message.guild.id].enabled = true;
        data[message.guild.id].channelId = kanal.id;

        saveData(data);

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("⭐ Level Sistemi")
            .setDescription(
                `🟢 Level sistemi **açıldı**.\n\n` +
                `📢 Level mesajları ${kanal} kanalına gönderilecek.`
            )
            .setTimestamp();

        await message.reply({
            embeds: [embed]
        });
    }
};

