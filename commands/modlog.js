
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

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply(
                "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekli."
            );
        }

        const sub = args[0]?.toLowerCase();

        // ==============================
        // KAPAT
        // ==============================

        if (sub === "kapat") {

            disableModLog(message.guild.id);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🛡️ ModLog Kapatıldı")
                        .setDescription(
                            "Bu sunucudaki ModLog sistemi kapatıldı."
                        )
                        .setTimestamp()
                ]
            });
        }

        // ==============================
        // DURUM
        // ==============================

        if (!sub || sub === "durum") {

            const settings = getModLog(message.guild.id);

            const channels = settings.channels || {};

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🛡️ ModLog Ayarları")
                .addFields(
                    {
                        name: "📊 Durum",
                        value: settings.enabled
                            ? "🟢 Açık"
                            : "🔴 Kapalı",
                        inline: true
                    },
                    {
                        name: "🛡️ Moderasyon",
                        value: channels.moderation
                            ? `<#${channels.moderation}>`
                            : "Ayarlanmadı",
                        inline: true
                    },
                    {
                        name: "🗑️ Mesaj",
                        value: channels.messages
                            ? `<#${channels.messages}>`
                            : "Ayarlanmadı",
                        inline: true
                    },
                    {
                        name: "👥 Üye",
                        value: channels.members
                            ? `<#${channels.members}>`
                            : "Ayarlanmadı",
                        inline: true
                    },
                    {
                        name: "🏠 Sunucu",
                        value: channels.server
                            ? `<#${channels.server}>`
                            : "Ayarlanmadı",
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

        // ==============================
        // KANAL AYARLAMA
        // ==============================

        const types = {
            moderation: "moderation",
            mod: "moderation",
            moderasyon: "moderation",

            message: "messages",
            messages: "messages",
            mesaj: "messages",

            member: "members",
            members: "members",
            uye: "members",
            üye: "members",

            server: "server",
            sunucu: "server"
        };

        const type = types[sub];

        if (!type) {
            return message.reply(
                "❌ Geçersiz ModLog türü.\n\n" +
                "**Kullanım:**\n" +
                "`B!modlog durum`\n" +
                "`B!modlog moderation #kanal`\n" +
                "`B!modlog message #kanal`\n" +
                "`B!modlog member #kanal`\n" +
                "`B!modlog server #kanal`\n" +
                "`B!modlog kapat`"
            );
        }

        const channel = message.mentions.channels.first();

        if (!channel) {
            return message.reply(
                "❌ Bir kanal etiketlemelisin.\n\n" +
                `Örnek: \`B!modlog ${sub} #mod-log\``
            );
        }

        if (!channel.isTextBased()) {
            return message.reply(
                "❌ Bu kanal mesaj gönderilebilen bir kanal değil."
            );
        }

        const botMember = message.guild.members.me;

        const permissions = channel.permissionsFor(botMember);

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

        setModLog(
            message.guild.id,
            type,
            channel.id
        );

        const names = {
            moderation: "🛡️ Moderasyon Log",
            messages: "🗑️ Mesaj Log",
            members: "👥 Üye Log",
            server: "🏠 Sunucu Log"
        };

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("✅ ModLog Ayarlandı")
                    .setDescription(
                        `${names[type]} başarıyla ayarlandı.\n\n` +
                        `📋 **Kanal:** ${channel}\n` +
                        `🟢 **Durum:** Açık`
                    )
                    .setTimestamp()
            ]
        });
    }
};

