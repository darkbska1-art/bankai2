
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

        // Kullanıcı + sunucu özel cooldown
        const cooldownKey = `${guildId}-${userId}`;

        const now = Date.now();
        const last = cooldowns.get(cooldownKey) || 0;

        // 10 saniye cooldown
        if (now - last < 10000) {
            return;
        }

        cooldowns.set(cooldownKey, now);

        const data = loadData();

        // Sunucu yoksa oluştur
        if (!data[guildId]) {
            data[guildId] = {
                enabled: true,
                users: {}
            };
        }

        // Sistem kapalıysa XP verme
        if (!data[guildId].enabled) {
            return;
        }

        // Kullanıcı yoksa oluştur
        if (!data[guildId].users[userId]) {
            data[guildId].users[userId] = {
                xp: 0,
                level: 0,
                totalXp: 0
            };
        }

        const user = data[guildId].users[userId];

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

        // Level atladıysa mesaj gönder
        if (leveledUp) {

            await message.channel.send(
                `🎉 Tebrikler ${message.author}! ` +
                `**Seviye ${user.level}** oldun! 🏆`
            ).catch(() => {});

        }

    });

}

// Komutların kullanacağı yardımcılar
module.exports = startLevelSystem;

module.exports.loadData = loadData;
module.exports.saveData = saveData;
module.exports.xpNeeded = xpNeeded;

