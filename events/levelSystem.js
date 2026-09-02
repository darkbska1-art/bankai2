
const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder
} = require("discord.js");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "levels.json");

// =====================================================
// DOSYA SİSTEMİ
// =====================================================

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
        recursive: true
    });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "{}", "utf8");
}

// =====================================================
// VERİLERİ YÜKLE
// =====================================================

function loadData() {
    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch (error) {
        console.error(
            "❌ Level verileri okunamadı:",
            error
        );

        return {};
    }
}

// =====================================================
// VERİLERİ KAYDET
// =====================================================

function saveData(data) {
    try {
        fs.writeFileSync(
            dataFile,
            JSON.stringify(data, null, 4),
            "utf8"
        );
    } catch (error) {
        console.error(
            "❌ Level verileri kaydedilemedi:",
            error
        );
    }
}

// =====================================================
// XP GEREKSİNİMİ
// =====================================================

function xpNeeded(level) {
    return 100 + (level * 75);
}

// =====================================================
// COOLDOWN
// =====================================================

const cooldowns = new Map();

// =====================================================
// LEVEL SİSTEMİ
// =====================================================

function startLevelSystem(client) {

    client.on("messageCreate", async message => {

        // DM geç
        if (!message.guild) return;

        // Botlara XP verme
        if (message.author.bot) return;

        const guildId = message.guild.id;
        const userId = message.author.id;

        // =================================================
        // VERİLER
        // =================================================

        const data = loadData();

        // Sunucu yoksa oluştur
        if (!data[guildId]) {

            data[guildId] = {
                enabled: false,
                channelId: null,
                users: {}
            };

            saveData(data);
        }

        const guildData = data[guildId];

        // Sistem kapalıysa
        if (!guildData.enabled) return;

        // Kanal ayarlanmamışsa
        if (!guildData.channelId) return;

        // =================================================
        // COOLDOWN
        // =================================================

        const cooldownKey =
            `${guildId}-${userId}`;

        const now = Date.now();

        const last =
            cooldowns.get(cooldownKey) || 0;

        // 10 saniye
        if (now - last < 10000) {
            return;
        }

        cooldowns.set(
            cooldownKey,
            now
        );

        // =================================================
        // KULLANICI
        // =================================================

        if (!guildData.users[userId]) {

            guildData.users[userId] = {
                xp: 0,
                level: 0,
                totalXp: 0
            };
        }

        const user =
            guildData.users[userId];

        // =================================================
        // XP KAZAN
        // =================================================

        const gainedXp =
            Math.floor(
                Math.random() * 16
            ) + 15;

        const oldLevel =
            user.level;

        user.xp += gainedXp;
        user.totalXp += gainedXp;

        // =================================================
        // LEVEL KONTROLÜ
        // =================================================

        let leveledUp = false;

        while (
            user.xp >= xpNeeded(user.level)
        ) {

            user.xp -= xpNeeded(user.level);

            user.level++;

            leveledUp = true;
        }

        // =================================================
        // KAYDET
        // =================================================

        saveData(data);

        // Level atlamadıysa devam etme
        if (!leveledUp) return;

        // =================================================
        // LEVEL KANALINI BUL
        // =================================================

        const levelChannel =
            message.guild.channels.cache.get(
                guildData.channelId
            );

        if (!levelChannel) {

            console.error(
                `❌ Level kanalı bulunamadı: ${guildData.channelId}`
            );

            return;
        }

        if (!levelChannel.isTextBased()) {
            return;
        }

        // =================================================
        // YENİ LEVEL XP
        // =================================================

        const nextXp =
            xpNeeded(user.level);

        const currentXp =
            user.xp;

        const totalXp =
            user.totalXp;

        // XP ilerleme yüzdesi
        const percentage =
            Math.min(
                Math.floor(
                    (currentXp / nextXp) * 100
                ),
                100
            );

        // =================================================
        // XP BAR
        // =================================================

        const barSize = 10;

        const filled =
            Math.floor(
                (percentage / 100) * barSize
            );

        const empty =
            barSize - filled;

        const xpBar =
            "🟩".repeat(filled) +
            "⬜".repeat(empty);

        // =================================================
        // LEVEL EMBED
        // =================================================

        const embed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setAuthor({
                    name:
                        message.author.username,
                    iconURL:
                        message.author.displayAvatarURL({
                            size: 128
                        })
                })
                .setTitle("🎉 LEVEL ATLADIN!")
                .setDescription(
                    `${message.author} tebrikler! 🎊\n\n` +
                    `⭐ Yeni seviyen: **Seviye ${user.level}**`
                )
                .addFields(
                    {
                        name: "📈 Seviye",
                        value:
                            `**${oldLevel}** ➜ **${user.level}**`,
                        inline: true
                    },
                    {
                        name: "✨ Kazanılan XP",
                        value:
                            `+${gainedXp} XP`,
                        inline: true
                    },
                    {
                        name: "🏆 Toplam XP",
                        value:
                            `${totalXp} XP`,
                        inline: true
                    },
                    {
                        name: "📊 Sonraki Seviye",
                        value:
                            `${xpBar}\n` +
                            `**${currentXp} / ${nextXp} XP** (${percentage}%)`,
                        inline: false
                    }
                )
                .setThumbnail(
                    message.author.displayAvatarURL({
                        size: 256
                    })
                )
                .setFooter({
                    text:
                        `${message.guild.name} • Level Sistemi`
                })
                .setTimestamp();

        // =================================================
        // MESAJI GÖNDER
        // =================================================

        await levelChannel
            .send({
                embeds: [embed]
            })
            .catch(error => {

                console.error(
                    "❌ Level mesajı gönderilemedi:",
                    error
                );

            });

    });
}



// =====================================================
// EXPORT
// =====================================================

module.exports = startLevelSystem;

module.exports.loadData = loadData;
module.exports.saveData = saveData;
module.exports.xpNeeded = xpNeeded;

