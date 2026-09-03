
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const {
    getModLog,
    setModLog,
    disableModLog
} = require("../events/modlog");

module.exports = {
    name: "modlog",
    aliases: ["modlogs", "mod-log"],
    description: "ModLog kanalını ayarlar.",
    usage: "B!modlog #kanal | durum | kapat",

    async execute(message, args) {

        // Yetki kontrolü
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply({
                content: "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
            });
        }

        // Argüman yok
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("🛡️ ModLog Ayarları")
                .setDescription(
                    "ModLog sistemini ayarlamak için aşağıdaki komutları kullanabilirsin."
                )
                .addFields(
                    {
                        name: "📌 Kanal Ayarla",
                        value: "`B!modlog #kanal`",
                        inline: false
                    },
                    {
                        name: "📊 Durum",
                        value: "`B!modlog durum`",
                        inline: true
                    },
                    {
                        name: "🔴 Kapat",
                        value: "`B!modlog kapat`",
                        inline: true
                    }
                )
                .setFooter({
                    text: "DRAYS • ModLog"
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        const action = args[0].toLowerCase();

        // =========================
        // DURUM
        // =========================

        if (
            action === "durum" ||
            action === "status"
        ) {
            const settings = getModLog(message.guild.id);

            const channelId =
                settings.channels?.moderation ||
                settings.channels?.messages ||
                settings.channels?.members ||
                settings.channels?.server;

            const channel = channelId
                ? message.guild.channels.cache.get(channelId)
                : null;

            const embed = new EmbedBuilder()
                .setColor(settings.enabled ? 0x57F287 : 0xED4245)
                .setTitle("🛡️ ModLog Durumu")
                .addFields(
                    {
                        name: "Durum",
                        value: settings.enabled
                            ? "🟢 Aktif"
                            : "🔴 Kapalı",
                        inline: true
                    },
                    {
                        name: "Kanal",
                        value: channel
                            ? `${channel}`
                            : "Ayarlanmamış",
                        inline: true
                    }
                )
                .setFooter({
                    text: "Bankai • ModLog"
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // =========================
        // KAPAT
        // =========================

        if (
            action === "kapat" ||
            action === "kapatma" ||
            action === "disable"
        ) {
            disableModLog(message.guild.id);

            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle("🔴 ModLog Kapatıldı")
                .setDescription(
                    "ModLog sistemi başarıyla kapatıldı."
                )
                .setFooter({
                    text: "Bankai • ModLog"
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // =========================
        // KANAL AYARLA
        // =========================

        const channel =
            message.mentions.channels.first();

        if (!channel) {
            return message.reply({
                content:
                    "❌ Geçerli bir kanal belirtmelisin.\n\nÖrnek: `B!modlog #mod-log`"
            });
        }

        // Text kanalı kontrolü
        if (!channel.isTextBased()) {
            return message.reply({
                content: "❌ Bu kanal mesaj gönderilebilen bir kanal değil."
            });
        }

        // Bot izinleri
        const permissions =
            channel.permissionsFor(message.guild.members.me);

        if (
            !permissions?.has(PermissionFlagsBits.SendMessages) ||
            !permissions?.has(PermissionFlagsBits.EmbedLinks)
        ) {
            return message.reply({
                content:
                    `❌ ${channel} kanalında **Mesaj Gönder** ve **Bağlantı Yerleştir** izinlerine sahip değilim.`
            });
        }

        // TÜM LOGLARI AYNI KANALA AYARLA
        setModLog(
            message.guild.id,
            "moderation",
            channel.id
        );

        setModLog(
            message.guild.id,
            "messages",
            channel.id
        );

        setModLog(
            message.guild.id,
            "members",
            channel.id
        );

        setModLog(
            message.guild.id,
            "server",
            channel.id
        );

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle("✅ ModLog Ayarlandı")
            .setDescription(
                `Tüm ModLog kayıtları artık ${channel} kanalına gönderilecek.`
            )
            .addFields(
                {
                    name: "🛡️ Moderasyon",
                    value: channel.toString(),
                    inline: true
                },
                {
                    name: "💬 Mesajlar",
                    value: channel.toString(),
                    inline: true
                },
                {
                    name: "👥 Üyeler",
                    value: channel.toString(),
                    inline: true
                },
                {
                    name: "🏠 Sunucu",
                    value: channel.toString(),
                    inline: true
                }
            )
            .setFooter({
                text: "Bankai • ModLog"
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};
