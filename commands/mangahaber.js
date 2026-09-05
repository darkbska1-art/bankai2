
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(
    process.cwd(),
    "mangahaber.json"
);

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(
                DATA_FILE,
                "{}",
                "utf8"
            );
        }

        return JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );

    } catch (error) {
        console.error(
            "❌ mangahaber.json okunamadı:",
            error
        );

        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}

module.exports = {
    name: "mangahaber",

    aliases: [
        "mangahaberkanal"
    ],

    description:
        "Manga haber kanalını ayarlar.",

    async execute(message, args) {

        if (!message.guild) {
            return;
        }

        const data = loadData();

        const guildId =
            message.guild.id;

        // ==========================================
        // KAPAT
        // ==========================================

        if (
            args[0]?.toLowerCase() === "kapat"
        ) {

            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("❌ Yetkin Yok")
                            .setDescription(
                                "Bu sistemi kapatmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                            )
                    ]
                });
            }

            if (!data[guildId]) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("📖 Manga Haber")
                            .setDescription(
                                "Bu sunucuda manga haber sistemi zaten kapalı."
                            )
                    ]
                });
            }

            delete data[guildId];

            saveData(data);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("✅ Manga Haber Kapatıldı")
                        .setDescription(
                            "Bu sunucuda otomatik manga haberleri artık gönderilmeyecek."
                        )
                ]
            });
        }

        // ==========================================
        // AYARI GÖSTER
        // ==========================================

        if (!args.length) {

            const channelId =
                data[guildId]?.channelId;

            if (!channelId) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("📖 Manga Haber Sistemi")
                            .setDescription(
                                "Bu sunucuda manga haber kanalı ayarlanmamış.\n\n" +
                                "**Kanal ayarlamak için:**\n" +
                                "`B!mangahaber #manga-haber`"
                            )
                    ]
                });
            }

            const channel =
                message.guild.channels.cache.get(
                    channelId
                );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("📖 Manga Haber Kanalı")
                        .setDescription(
                            channel
                                ? `Manga haberleri ${channel} kanalına gönderiliyor.`
                                : "Ayarlanan kanal artık bulunamıyor."
                        )
                ]
            });
        }

        // ==========================================
        // YETKİ
        // ==========================================

        if (
            !message.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Yetkin Yok")
                        .setDescription(
                            "Manga haber kanalını ayarlamak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                        )
                ]
            });
        }

        // ==========================================
        // KANAL
        // ==========================================

        const channel =
            message.mentions.channels.first();

        if (!channel) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Kanal Belirtilmedi")
                        .setDescription(
                            "Bir kanal etiketlemelisin.\n\n" +
                            "**Örnek:**\n" +
                            "`B!mangahaber #manga-haber`"
                        )
                ]
            });
        }

        data[guildId] = {
            channelId: channel.id,
            enabled: true
        };

        saveData(data);

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("✅ Manga Haber Kanalı Ayarlandı")
                    .setDescription(
                        `Yeni manga bölümleri artık ${channel} kanalına gönderilecek.`
                    )
                    .addFields(
                        {
                            name: "📖 Sistem",
                            value: "Otomatik Manga Bölüm Haberleri",
                            inline: true
                        },
                        {
                            name: "📢 Kanal",
                            value: `${channel}`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Bankai Manga Haber Sistemi"
                    })
                    .setTimestamp()
            ]
        });
    }
};

