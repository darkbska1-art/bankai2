
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "levels.json");

// data klasörü yoksa oluştur
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
        recursive: true
    });
}

// levels.json yoksa oluştur
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "{}", "utf8");
}

// Verileri yükle
function loadData() {
    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch (error) {
        console.error("❌ Level verileri okunamadı:", error);
        return {};
    }
}

// Verileri kaydet
function saveData(data) {
    try {
        fs.writeFileSync(
            dataFile,
            JSON.stringify(data, null, 4),
            "utf8"
        );
    } catch (error) {
        console.error("❌ Level verileri kaydedilemedi:", error);
    }
}

// Seviye için gereken XP
function xpNeeded(level) {
    return 100 + (level * 75);
}

// Kullanıcı cooldownları
const cooldowns = new Map();

// Level sistemini başlat
function startLevelSystem(client) {

    client.on("messageCreate", async message => {

        // DM'leri geç
        if (!message.guild) return;

        // Botlara XP verme
        if (message.author.bot) return;

        const guildId = message.guild.id;
        const userId = message.author.id;

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

        // Sistem kapalıysa XP verme
        if (!guildData.enabled) {
            return;
        }

        // Level kanalı ayarlanmamışsa XP verme
        if (!guildData.channelId) {
            return;
        }

        // Kullanıcı + sunucu özel cooldown
        const cooldownKey = `${guildId}-${userId}`;

        const now = Date.now();
        const last = cooldowns.get(cooldownKey) || 0;

        // 10 saniye cooldown
        if (now - last < 10000) {
            return;
        }

        cooldowns.set(cooldownKey, now);

        // Kullanıcı yoksa oluştur
        if (!guildData.users[userId]) {
            guildData.users[userId] = {
                xp: 0,
                level: 0,
                totalXp: 0
            };
        }

        const user = guildData.users[userId];

        // 15-30 XP
        const gainedXp =
            Math.floor(Math.random() * 16) + 15;

        user.xp += gainedXp;
        user.totalXp += gainedXp;

        let leveledUp = false;

        // Seviye kontrolü
        while (user.xp >= xpNeeded(user.level)) {

            user.xp -= xpNeeded(user.level);

            user.level++;

            leveledUp = true;
        }

        // Verileri kaydet
        saveData(data);

        // Level atlamadıysa devam etme
        if (!leveledUp) {
            return;
        }

        // Ayarlanan level kanalını bul
        const levelChannel =
            message.guild.channels.cache.get(
                guildData.channelId
            );

        // Kanal bulunamazsa
        if (!levelChannel) {
            console.error(
                `❌ Level kanalı bulunamadı: ${guildData.channelId}`
            );
            return;
        }

        // Botun kanala mesaj gönderme yetkisi var mı?
        if (!levelChannel.isTextBased()) {
            return;
        }

        // Level mesajını ayarlanan kanala gönder
        await levelChannel.send(
            `🎉 Tebrikler ${message.author}! ` +
            `**Seviye ${user.level}** oldun! 🏆`
        ).catch(error => {
            console.error(
                "❌ Level mesajı gönderilemedi:",
                error
            );
        });

    });

}

// Komutların kullanacağı yardımcılar
module.exports = startLevelSystem;

module.exports.loadData = loadData;
module.exports.saveData = saveData;
module.exports.xpNeeded = xpNeeded;

