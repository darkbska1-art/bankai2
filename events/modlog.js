
const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder
} = require("discord.js");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "modlog.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "{}", "utf8");
}

// ================================
// VERİ OKUMA
// ================================

function loadData() {
    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch (error) {
        console.error("❌ ModLog verileri okunamadı:", error);
        return {};
    }
}

// ================================
// VERİ KAYDETME
// ================================

function saveData(data) {
    try {
        fs.writeFileSync(
            dataFile,
            JSON.stringify(data, null, 4),
            "utf8"
        );
    } catch (error) {
        console.error("❌ ModLog verileri kaydedilemedi:", error);
    }
}

// ================================
// MODLOG AYARLA
// ================================

function setModLog(guildId, channelId) {

    const data = loadData();

    if (!data[guildId]) {
        data[guildId] = {
            enabled: true,
            channelId: null
        };
    }

    data[guildId].enabled = true;
    data[guildId].channelId = channelId;

    saveData(data);
}

// ================================
// MODLOG KAPAT
// ================================

function disableModLog(guildId) {

    const data = loadData();

    if (!data[guildId]) {
        data[guildId] = {
            enabled: false,
            channelId: null
        };
    }

    data[guildId].enabled = false;

    saveData(data);
}

// ================================
// MODLOG BİLGİ
// ================================

function getModLog(guildId) {

    const data = loadData();

    return data[guildId] || {
        enabled: false,
        channelId: null
    };
}

// ================================
// MODLOG GÖNDER
// ================================

async function sendModLog(client, guildId, options = {}) {

    try {

        const settings = getModLog(guildId);

        if (!settings.enabled) return;
        if (!settings.channelId) return;

        const guild = client.guilds.cache.get(guildId);

        if (!guild) return;

        const channel =
            guild.channels.cache.get(settings.channelId);

        if (!channel) return;

        if (!channel.isTextBased()) return;

        const {
            action = "Moderasyon",
            emoji = "🛡️",
            user = null,
            moderator = null,
            reason = "Belirtilmedi.",
            details = []
        } = options;

        const embed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle(`${emoji} ${action}`)
                .setTimestamp();

        if (user) {

            embed.addFields({
                name: "👤 Kullanıcı",
                value:
                    `${user}\n` +
                    `\`ID: ${user.id}\``,
                inline: true
            });

        }

        if (moderator) {

            embed.addFields({
                name: "🛡️ Yetkili",
                value:
                    `${moderator}\n` +
                    `\`ID: ${moderator.id}\``,
                inline: true
            });

        }

        embed.addFields({
            name: "📝 Sebep",
            value: reason || "Belirtilmedi.",
            inline: false
        });

        if (details.length > 0) {

            embed.addFields(
                details.map(detail => ({
                    name: detail.name,
                    value: detail.value,
                    inline: detail.inline ?? true
                }))
            );

        }

        embed.setFooter({
            text: `${guild.name} • ModLog`
        });

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {

        console.error(
            "❌ ModLog mesajı gönderilemedi:",
            error
        );

    }
}

module.exports = {
    loadData,
    saveData,
    setModLog,
    disableModLog,
    getModLog,
    sendModLog
};

