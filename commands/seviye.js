const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const {
    loadData,
    saveData
} = require("../events/levelSystem");

module.exports = {

    name: "seviyesistem",

    aliases: [
        "level"
    ],

    async execute(message, args) {

        if (!message.guild) return;

        // =====================================================
        // YETKİ KONTROLÜ
        // =====================================================

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("❌ Yetkin Yok")
                        .setDescription(
                            "Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                        )
                ]
            });
        }

        const data = loadData();
        const guildId = message.guild.id;

        // =====================================================
        // SUNUCU VERİSİ YOKSA OLUŞTUR
        // =====================================================

        if (!data[guildId]) {
            data[guildId] = {
                enabled: false,
                channelId: null,
                users: {}
            };
        }

        const guildData = data[guildId];

        if (!guildData.users) {
            guildData.users = {};
        }

        // =====================================================
        // B!seviye kapat
        // =====================================================

        if (
            args[0] &&
            args[0].toLowerCase() === "kapat"
        ) {

            guildData.enabled = false;

            saveData(data);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🔴 Seviye Sistemi Kapatıldı")
                        .setDescription(
                            "Bu sunucuda seviye sistemi **kapatıldı**.\n\n" +
                            "Kullanıcıların mevcut XP ve seviyeleri **silinmedi**."
                        )
                        .setFooter({
                            text: `${message.guild.name} • Level Sistemi`
                        })
                        .setTimestamp()
                ]
            });
        }

        // =====================================================
        // B!seviye #kanal
        // =====================================================

        const channel =
            message.mentions.channels.first();

        if (channel) {

            if (!channel.isTextBased()) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x000000)
                            .setTitle("❌ Geçersiz Kanal")
                            .setDescription(
                                "Lütfen mesaj gönderilebilen bir kanal seç."
                            )
                    ]
                });
            }

            guildData.enabled = true;
            guildData.channelId = channel.id;

            saveData(data);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🟢 Seviye Sistemi Aktif")
                        .setDescription(
                            `Seviye sistemi bu sunucuda aktif edildi.\n\n` +
                            `📢 Level mesajları: ${channel}\n\n` +
                            `⭐ Kullanıcılar mesaj yazarak XP kazanacak.`
                        )
                        .setFooter({
                            text: `${message.guild.name} • Level Sistemi`
                        })
                        .setTimestamp()
                ]
            });
        }

        // =====================================================
        // B!seviye → DURUM
        // =====================================================

        const durum =
            guildData.enabled
                ? "🟢 **Aktif**"
                : "🔴 **Kapalı**";

        const kanal =
            guildData.channelId
                ? `<#${guildData.channelId}>`
                : "❌ Ayarlanmamış";

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("⭐ Seviye Sistemi")
                    .setDescription(
                        `**Durum:** ${durum}\n` +
                        `**Level Kanalı:** ${kanal}\n\n` +
                        `⚙️ Sistemi açmak için:\n` +
                        `\`B!seviye #kanal\`\n\n` +
                        `🔴 Kapatmak için:\n` +
                        `\`B!seviye kapat\``
                    )
                    .setFooter({
                        text: `${message.guild.name} • Level Sistemi`
                    })
                    .setTimestamp()
            ]
        });
    }
};