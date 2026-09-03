
const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const {
    getModLog,
    setModLog,
    disableModLog
} = require("../events/modlog");

module.exports = {

    name: "modlog",

    aliases: [
        "mod-log",
        "log"
    ],

    async execute(message, args) {

        // =====================================================
        // 🔐 YETKİ
        // =====================================================

        if (
            !message.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return message.reply(
                "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
            );
        }

        // =====================================================
        // 📊 DURUM
        // =====================================================

        if (
            !args[0] ||
            args[0].toLowerCase() === "durum"
        ) {

            const settings =
                getModLog(
                    message.guild.id
                );

            const channels =
                settings.channels;

            const embed =
                new EmbedBuilder()
                    .setColor(
                        settings.enabled
                            ? 0x57F287
                            : 0xED4245
                    )
                    .setTitle(
                        "🛡️ ModLog Durumu"
                    )
                    .setDescription(
                        settings.enabled
                            ? "🟢 ModLog sistemi aktif."
                            : "🔴 ModLog sistemi kapalı."
                    )
                    .addFields(
                        {
                            name: "🛡️ Moderasyon",
                            value:
                                channels.moderation
                                    ? `<#${channels.moderation}>`
                                    : "❌ Ayarlanmadı",
                            inline: true
                        },

                        {
                            name: "💬 Mesajlar",
                            value:
                                channels.messages
                                    ? `<#${channels.messages}>`
                                    : "❌ Ayarlanmadı",
                            inline: true
                        },

                        {
                            name: "👥 Üyeler",
                            value:
                                channels.members
                                    ? `<#${channels.members}>`
                                    : "❌ Ayarlanmadı",
                            inline: true
                        },

                        {
                            name: "🌐 Sunucu",
                            value:
                                channels.server
                                    ? `<#${channels.server}>`
                                    : "❌ Ayarlanmadı",
                            inline: true
                        }
                    )
                    .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // =====================================================
        // ❌ KAPAT
        // =====================================================

        if (
            args[0].toLowerCase() ===
            "kapat"
        ) {

            disableModLog(
                message.guild.id
            );

            return message.reply(
                "🔴 **ModLog sistemi kapatıldı.**"
            );
        }

        // =====================================================
        // 📌 TÜR BELİRLE
        // =====================================================

        const type =
            args[0].toLowerCase();

        const types = {

            moderation: "moderation",
            moderasyon: "moderation",
            mod: "moderation",

            message: "messages",
            messages: "messages",
            mesaj: "messages",
            mesajlar: "messages",

            member: "members",
            members: "members",
            uye: "members",
            üye: "members",
            üyeler: "members",

            server: "server",
            sunucu: "server"
        };

        const selectedType =
            types[type];

        if (!selectedType) {

            return message.reply(
                "❌ Geçersiz ModLog türü.\n\n" +
                "Kullanım:\n" +
                "`B!modlog moderation #kanal`\n" +
                "`B!modlog message #kanal`\n" +
                "`B!modlog member #kanal`\n" +
                "`B!modlog server #kanal`\n" +
                "`B!modlog durum`\n" +
                "`B!modlog kapat`"
            );
        }

        // =====================================================
        // 📺 KANAL
        // =====================================================

        const channel =
            message.mentions.channels.first();

        if (!channel) {

            return message.reply(
                "❌ Bir kanal etiketlemelisin.\n\n" +
                `Örnek: \`B!modlog ${type} #log\``
            );
        }

        if (
            !channel.isTextBased()
        ) {

            return message.reply(
                "❌ Bu kanal bir yazı kanalı değil."
            );
        }

        // =====================================================
        // 🤖 BOT YETKİLERİ
        // =====================================================

        const botMember =
            message.guild.members.me;

        if (!botMember) {
            return message.reply(
                "❌ Bot bilgisi alınamadı."
            );
        }

        const permissions =
            channel.permissionsFor(
                botMember
            );

        if (
            !permissions?.has(
                PermissionFlagsBits.SendMessages
            )
        ) {

            return message.reply(
                "❌ Botun bu kanala **Mesaj Gönderme** yetkisi yok."
            );
        }

        if (
            !permissions?.has(
                PermissionFlagsBits.EmbedLinks
            )
        ) {

            return message.reply(
                "❌ Botun bu kanala **Bağlantıları Yerleştir** yetkisi yok."
            );
        }

        // =====================================================
        // 💾 KAYDET
        // =====================================================

        setModLog(
            message.guild.id,
            selectedType,
            channel.id
        );

        const names = {

            moderation:
                "🛡️ Moderasyon",

            messages:
                "💬 Mesaj",

            members:
                "👥 Üye",

            server:
                "🌐 Sunucu"
        };

        return message.reply(
            `✅ **${names[selectedType]} ModLog** kanalı ${channel} olarak ayarlandı.`
        );
    }
};

