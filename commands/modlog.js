
const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const {
    setModLog,
    disableModLog,
    getModLog
} = require("../events/modlog");

module.exports = {
    name: "modlog",
    aliases: ["moderasyonlog", "modlogayar"],

    async execute(message, args) {

        // ================================
        // YETKİ
        // ================================

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply(
                "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekli."
            );
        }

        // ================================
        // KAPAT
        // ================================

        if (
            args[0]?.toLowerCase() === "kapat"
        ) {

            disableModLog(message.guild.id);

            const embed =
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("🛡️ ModLog")
                    .setDescription(
                        "🔴 ModLog sistemi bu sunucuda **kapatıldı**."
                    )
                    .setFooter({
                        text: `${message.guild.name} • ModLog`
                    })
                    .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // ================================
        // KANAL YOKSA MEVCUT AYARI GÖSTER
        // ================================

        if (!args[0]) {

            const settings =
                getModLog(message.guild.id);

            const channel =
                settings.channelId
                    ? `<#${settings.channelId}>`
                    : "Ayarlanmadı";

            const durum =
                settings.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const embed =
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("🛡️ ModLog Ayarları")
                    .addFields(
                        {
                            name: "📊 Durum",
                            value: durum,
                            inline: true
                        },
                        {
                            name: "📋 Log Kanalı",
                            value: channel,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: `${message.guild.name} • ModLog`
                    })
                    .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // ================================
        // KANAL BUL
        // ================================

        const channel =
            message.mentions.channels.first();

        if (!channel) {
            return message.reply(
                "❌ Bir kanal etiketlemelisin.\n\n" +
                "Örnek: `B!modlog #mod-log`"
            );
        }

        // ================================
        // TEXT KANALI KONTROLÜ
        // ================================

        if (!channel.isTextBased()) {
            return message.reply(
                "❌ Bu kanal mesaj gönderilebilen bir kanal değil."
            );
        }

        // ================================
        // BOT YETKİ KONTROLÜ
        // ================================

        const botMember =
            message.guild.members.me;

        const permissions =
            channel.permissionsFor(botMember);

        if (!permissions?.has(
            PermissionFlagsBits.SendMessages
        )) {
            return message.reply(
                "❌ Botun bu kanala **Mesaj Gönder** yetkisi yok."
            );
        }

        if (!permissions?.has(
            PermissionFlagsBits.EmbedLinks
        )) {
            return message.reply(
                "❌ Botun bu kanalda **Bağlantıları Yerleştir** yetkisi yok."
            );
        }

        // ================================
        // KAYDET
        // ================================

        setModLog(
            message.guild.id,
            channel.id
        );

        const embed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🛡️ ModLog Ayarlandı")
                .setDescription(
                    `ModLog kanalı başarıyla ayarlandı.\n\n` +
                    `📋 **Kanal:** ${channel}\n` +
                    `🟢 **Durum:** Açık`
                )
                .setFooter({
                    text: `${message.guild.name} • ModLog`
                })
                .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};

