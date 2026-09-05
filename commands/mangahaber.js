
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "mangahaber.json");

function loadData() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}", "utf8");
    }

    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

module.exports = {
    name: "mangahaber",
    aliases: ["mangahaberkanal"],

    async execute(message, args) {
        if (!message.guild) return;

        const data = loadData();
        const guildId = message.guild.id;

        // KAPAT
        if (
            args[0]?.toLowerCase() === "kapat" ||
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
                                "Bu sunucuda manga haber sistemi zaten ayarlı değil."
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
                            "Bu sunucunun manga haber kanalı kaldırıldı."
                        )
                ]
            });
        }

        // MEVCUT KANALI GÖSTER
        if (!args.length) {
            const channelId = data[guildId]?.channelId;

            if (!channelId) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("📖 Manga Haber Sistemi")
                            .setDescription(
                                "Bu sunucuda manga haber kanalı ayarlanmamış.\n\n" +
                                "Kanal ayarlamak için:\n" +
                                "`B!mangahaber #kanal`"
                            )
                    ]
                });
            }

            const channel = message.guild.channels.cache.get(channelId);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("📖 Manga Haber Kanalı")
                        .setDescription(
                            channel
                                ? `Manga haberleri şu kanala gönderiliyor: ${channel}`
                                : "Ayarlanan kanal artık bulunamıyor."
                        )
                ]
            });
        }

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
                            "Örnek:\n" +
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
                    .addFields({
                        name: "📖 Sistem",
                        value: "Otomatik Manga Bölüm Bildirimleri",
                        inline: true
                    })
                    .addFields({
                        name: "📢 Kanal",
                        value: `${channel}`,
                        inline: true
                    })
                    .setFooter({
                        text: "Bankai Manga Haber Sistemi"
                    })
            ]
        });
    }
};

