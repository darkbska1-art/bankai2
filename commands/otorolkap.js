const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../autorole.json");

function loadData() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }

    try {
        return JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 4)
    );
}

module.exports = {
    name: "otorolkapat",

    aliases: [
        "autorolekapat"
    ],

    description: "Otorol sistemini kapatır.",

    async execute(message) {

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Yetkin Yok")
                        .setDescription(
                            "Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                        )
                ]
            });
        }

        const data = loadData();

        if (!data[message.guild.id]) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Otorol Kapalı")
                        .setDescription(
                            "Bu sunucuda zaten otorol sistemi aktif değil."
                        )
                ]
            });
        }

        delete data[message.guild.id];

        saveData(data);

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("🔴 Otorol Kapatıldı")
                    .setDescription(
                        "Otorol sistemi başarıyla kapatıldı."
                    )
                    .setFooter({
                        text: "Bankai • Otorol Sistemi"
                    })
                    .setTimestamp()
            ]
        });
    }
};