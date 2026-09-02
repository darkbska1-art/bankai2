
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataFolder = path.join(__dirname, "..", "data");
const dataFile = path.join(dataFolder, "animeNews.json");

function loadData() {
    if (!fs.existsSync(dataFolder)) {
        fs.mkdirSync(dataFolder, { recursive: true });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify({}, null, 2));
    }

    try {
        return JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(data, null, 2)
    );
}

module.exports = {
    name: "animehaberkapat",
    aliases: ["animehaberkapatma"],

    async execute(message) {

        if (!message.guild) {
            return message.reply(
                "❌ Bu komut sadece sunucularda kullanılabilir."
            );
        }

        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply(
                "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
            );
        }

        const data = loadData();

        if (!data[message.guild.id]?.enabled) {
            return message.reply(
                "⚠️ Bu sunucuda anime haber sistemi zaten kapalı."
            );
        }

        data[message.guild.id].enabled = false;
        data[message.guild.id].updatedAt = Date.now();

        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle("📰 Anime Haber Sistemi")
            .setDescription(
                "Anime haberlerinin otomatik gönderimi kapatıldı."
            )
            .addFields({
                name: "🔴 Durum",
                value: "Kapalı",
                inline: true
            })
            .setFooter({
                text: "Bankai • Anime Haber Sistemi"
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};

