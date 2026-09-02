
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
    name: "animehaber",
    aliases: ["animehaberkanal", "animehaberayarla"],

    async execute(message, args) {

        // Sadece sunucu
        if (!message.guild) {
            return message.reply("❌ Bu komut sadece sunucularda kullanılabilir.");
        }

        // Yetki
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply(
                "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
            );
        }

        const channel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0]);

        if (!channel) {
            return message.reply(
                "❌ Bir haber kanalı belirtmelisin.\n\n" +
                `Örnek: \`D!animehaber #anime-haber\``
            );
        }

        if (!channel.isTextBased()) {
            return message.reply(
                "❌ Seçtiğin kanal bir yazı kanalı değil."
            );
        }

        const botPermissions = channel.permissionsFor(message.guild.members.me);

        if (!botPermissions?.has(PermissionFlagsBits.SendMessages)) {
            return message.reply(
                `❌ ${channel} kanalında mesaj gönderme yetkim yok.`
            );
        }

        if (!botPermissions?.has(PermissionFlagsBits.EmbedLinks)) {
            return message.reply(
                `❌ ${channel} kanalında **Bağlantıları Yerleştir** yetkim yok.`
            );
        }

        const data = loadData();

        data[message.guild.id] = {
            channelId: channel.id,
            enabled: true,
            updatedAt: Date.now()
        };

        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle("📰 Anime Haber Sistemi")
            .setDescription(
                `Anime haberleri artık ${channel} kanalına otomatik gönderilecek.`
            )
            .addFields(
                {
                    name: "📢 Haber Kanalı",
                    value: `${channel}`,
                    inline: true
                },
                {
                    name: "🔄 Durum",
                    value: "🟢 Aktif",
                    inline: true
                },
                {
                    name: "⚡ Sistem",
                    value: "Otomatik haber takibi",
                    inline: true
                }
            )
            .setFooter({
                text: "Bankai • Anime Haber Sistemi"
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};

