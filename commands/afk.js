const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const AFK_FILE = path.join(__dirname, "..", "afk.json");

// =====================================================
// 📁 AFK VERİTABANI
// =====================================================

function loadData() {
    try {
        if (!fs.existsSync(AFK_FILE)) {
            fs.writeFileSync(AFK_FILE, "{}");
            return {};
        }

        const content = fs.readFileSync(AFK_FILE, "utf8");

        if (!content.trim()) {
            return {};
        }

        return JSON.parse(content);

    } catch (error) {

        console.error("❌ AFK verisi okunamadı:", error);

        return {};
    }
}

function saveData(data) {
    try {

        fs.writeFileSync(
            AFK_FILE,
            JSON.stringify(data, null, 4)
        );

    } catch (error) {

        console.error("❌ AFK verisi kaydedilemedi:", error);
    }
}

// =====================================================
// ⏱️ SÜRE FORMAT
// =====================================================

function formatDuration(ms) {

    let seconds = Math.floor(ms / 1000);

    if (seconds < 0) {
        seconds = 0;
    }

    const days = Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);

    seconds %= 60;

    const parts = [];

    if (days > 0) {
        parts.push(`${days} gün`);
    }

    if (hours > 0) {
        parts.push(`${hours} saat`);
    }

    if (minutes > 0) {
        parts.push(`${minutes} dakika`);
    }

    if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds} saniye`);
    }

    return parts.join(" ");
}

// =====================================================
// 🏷️ NICKNAME DEĞİŞTİR
// =====================================================

async function addAFKNickname(member) {

    try {

        const me = member.guild.members.me;

        if (!me) {
            return false;
        }

        if (
            !me.permissions.has(
                PermissionFlagsBits.ManageNicknames
            )
        ) {
            return false;
        }

        if (!member.manageable) {
            return false;
        }

        const currentName =
            member.nickname || member.user.username;

        // Zaten AFK ise tekrar ekleme
        if (
            currentName.startsWith("[AFK]") ||
            currentName.startsWith("[afk]")
        ) {
            return true;
        }

        const newNickname =
            `[AFK] ${currentName}`.slice(0, 32);

        await member.setNickname(
            newNickname,
            "Bankai AFK sistemi"
        );

        return true;

    } catch (error) {

        console.error(
            `❌ ${member.user.tag} nickname değiştirilemedi:`,
            error.message
        );

        return false;
    }
}

// =====================================================
// 🏷️ ESKİ NICKNAME GERİ GETİR
// =====================================================

async function removeAFKNickname(member, oldNickname) {

    try {

        if (!member) {
            return false;
        }

        if (!member.manageable) {
            return false;
        }

        await member.setNickname(
            oldNickname || null,
            "Bankai AFK sistemi sona erdi"
        );

        return true;

    } catch (error) {

        console.error(
            `❌ ${member.user.tag} nickname geri alınamadı:`,
            error.message
        );

        return false;
    }
}

// =====================================================
// 💤 AFK KOMUTU
// =====================================================

async function execute(message, args) {

    if (!message.guild) {
        return;
    }

    if (message.author.bot) {
        return;
    }

    const data = loadData();

    const guildId = message.guild.id;
    const userId = message.author.id;

    if (!data[guildId]) {
        data[guildId] = {};
    }

    const reason =
        args.join(" ").trim() ||
        "Sebep belirtilmedi.";

    // =================================================
    // ZATEN AFK MI?
    // =================================================

    if (data[guildId][userId]) {

        const oldAFK =
            data[guildId][userId];

        oldAFK.reason = reason;

        saveData(data);

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("💤 AFK Güncellendi")
            .setDescription(
                `AFK durumun güncellendi.\n\n` +
                `💬 **Yeni sebep:** ${reason}\n` +
                `⏱️ **AFK süresi:** ${formatDuration(Date.now() - oldAFK.since)}`
            )
            .setFooter({
                text: `Bankai • ${message.guild.name}`
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }

    // =================================================
    // ESKİ NICKNAME
    // =================================================

    const oldNickname =
        message.member.nickname || null;

    // =================================================
    // AFK KAYDI
    // =================================================

    data[guildId][userId] = {

        reason: reason,

        since: Date.now(),

        oldNickname: oldNickname,

        mentions: 0
    };

    saveData(data);

    // =================================================
    // NICKNAME
    // =================================================

    const nicknameChanged =
        await addAFKNickname(message.member);

    // =================================================
    // EMBED
    // =================================================

    const embed = new EmbedBuilder()
        .setColor("#000000")
        .setTitle("💤 AFK Modu Aktif")
        .setDescription(
            `${message.author}, artık AFK'sın.\n\n` +

            `💬 **Sebep:** ${reason}\n` +

            `⏱️ **Başlangıç:** <t:${Math.floor(Date.now() / 1000)}:R>\n` +

            `🏷️ **Nickname:** ${
                nicknameChanged
                    ? "`[AFK]` eklendi."
                    : "Değiştirilemedi."
            }\n\n` +

            `📌 Bir mesaj yazdığında AFK otomatik olarak kaldırılır.`
        )
        .setFooter({
            text: `Bankai • ${message.guild.name}`
        })
        .setTimestamp();

    return message.reply({
        embeds: [embed]
    });
}

// =====================================================
// 📊 AFK BİLGİ
// =====================================================

async function afkInfo(message, target) {

    const data = loadData();

    const guildId = message.guild.id;

    const userId =
        target?.id || message.author.id;

    const afk =
        data[guildId]?.[userId];

    if (!afk) {

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("💤 AFK Bilgisi")
            .setDescription(
                `❌ ${target || message.author} şu anda AFK değil.`
            )
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }

    const user =
        await message.client.users.fetch(userId)
            .catch(() => null);

    const mention =
        user ? `<@${userId}>` : "Bilinmeyen kullanıcı";

    const duration =
        formatDuration(Date.now() - afk.since);

    const embed = new EmbedBuilder()
        .setColor("#000000")
        .setTitle("💤 AFK Bilgisi")
        .addFields(

            {
                name: "👤 Kullanıcı",
                value: mention,
                inline: true
            },

            {
                name: "💬 Sebep",
                value: afk.reason || "Sebep yok",
                inline: true
            },

            {
                name: "⏱️ Süre",
                value: duration,
                inline: true
            },

            {
                name: "🔔 Etiketlenme",
                value: `${afk.mentions || 0} kez`,
                inline: true
            },

            {
                name: "🕐 Başlangıç",
                value: `<t:${Math.floor(afk.since / 1000)}:F>`,
                inline: true
            }
        )
        .setFooter({
            text: `Bankai • ${message.guild.name}`
        })
        .setTimestamp();

    return message.reply({
        embeds: [embed]
    });
}

// =====================================================
// 📋 AFK LİSTESİ
// =====================================================

async function afkList(message) {

    const data = loadData();

    const guildData =
        data[message.guild.id] || {};

    const entries =
        Object.entries(guildData);

    if (entries.length === 0) {

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("💤 AFK Listesi")
            .setDescription(
                "Bu sunucuda şu anda AFK olan kimse yok."
            )
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }

    const list = [];

    for (const [userId, afk] of entries.slice(0, 15)) {

        list.push(
            `💤 <@${userId}> — **${afk.reason}**\n` +
            `> ⏱️ ${formatDuration(Date.now() - afk.since)}`
        );
    }

    const embed = new EmbedBuilder()
        .setColor("#000000")
        .setTitle("💤 AFK Listesi")
        .setDescription(
            list.join("\n\n")
        )
        .setFooter({
            text:
                `Toplam ${entries.length} AFK • Bankai`
        })
        .setTimestamp();

    return message.reply({
        embeds: [embed]
    });
}

// =====================================================
// ❌ AFK İPTAL
// =====================================================

async function cancelAFK(message, target) {

    const data = loadData();

    const guildId = message.guild.id;

    const user =
        target || message.author;

    const userId = user.id;

    const afk =
        data[guildId]?.[userId];

    if (!afk) {

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("❌ AFK Bulunamadı")
            .setDescription(
                `${user} şu anda AFK değil.`
            )
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }

    delete data[guildId][userId];

    if (
        Object.keys(data[guildId]).length === 0
    ) {
        delete data[guildId];
    }

    saveData(data);

    // Sadece kendi nickname'ini veya hedefin nickname'ini
    // değiştirebilecek durumda ise geri al
    const member =
        await message.guild.members
            .fetch(userId)
            .catch(() => null);

    if (member) {

        await removeAFKNickname(
            member,
            afk.oldNickname
        );
    }

    const embed = new EmbedBuilder()
        .setColor("#000000")
        .setTitle("✅ AFK Kaldırıldı")
        .setDescription(
            `${user} kullanıcısının AFK durumu kaldırıldı.`
        )
        .setFooter({
            text: `Bankai • ${message.guild.name}`
        })
        .setTimestamp();

    return message.reply({
        embeds: [embed]
    });
}

// =====================================================
// 🔥 MESAJ AFK SİSTEMİ
// =====================================================

async function handleMessage(message) {

    if (!message.guild) {
        return;
    }

    if (message.author.bot) {
        return;
    }

    const data = loadData();

    const guildId = message.guild.id;
    const userId = message.author.id;

    let changed = false;

    // =================================================
    // 1. MESAJ ATAN KİŞİ AFK MI?
    // =================================================

    if (data[guildId]?.[userId]) {

        const afk =
            data[guildId][userId];

        delete data[guildId][userId];

        if (
            Object.keys(data[guildId]).length === 0
        ) {
            delete data[guildId];
        }

        saveData(data);

        // Nickname geri getir
        await removeAFKNickname(
            message.member,
            afk.oldNickname
        );

        const duration =
            formatDuration(
                Date.now() - afk.since
            );

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("👋 AFK Sona Erdi")
            .setDescription(
                `Tekrar hoş geldin ${message.author}!\n\n` +

                `💬 **AFK sebebin:** ${afk.reason}\n` +

                `⏱️ **AFK süren:** ${duration}\n\n` +

                `🏷️ Eski nickname'in geri getirildi.`
            )
            .setFooter({
                text: `Bankai • ${message.guild.name}`
            })
            .setTimestamp();

        await message.reply({
            embeds: [embed]
        });

        changed = true;
    }

    // =================================================
    // 2. ETİKETLENEN AFK KİŞİLER
    // =================================================

    if (message.mentions.users.size > 0) {

        for (
            const mentionedUser
            of message.mentions.users.values()
        ) {

            if (mentionedUser.bot) {
                continue;
            }

            if (mentionedUser.id === userId) {
                continue;
            }

            const afk =
                data[guildId]?.[mentionedUser.id];

            if (!afk) {
                continue;
            }

            // Mention sayısını artır
            afk.mentions =
                (afk.mentions || 0) + 1;

            saveData(data);

            const duration =
                formatDuration(
                    Date.now() - afk.since
                );

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("💤 AFK Bildirimi")
                .setDescription(
                    `Etiketlediğin kişi şu anda AFK.\n\n` +

                    `👤 **Kullanıcı:** <@${mentionedUser.id}>\n` +

                    `💬 **Sebep:** ${afk.reason}\n` +

                    `⏱️ **AFK süresi:** ${duration}\n` +

                    `🔔 **Etiketlenme:** ${afk.mentions} kez`
                )
                .setFooter({
                    text: `Bankai • ${message.guild.name}`
                })
                .setTimestamp();

            await message.reply({
                embeds: [embed]
            });

            // Spam olmaması için bir mesajda 1 bildirim
            break;
        }
    }

    return changed;
}

// =====================================================
// 📦 EXPORT
// =====================================================

module.exports = {

    name: "afk",

    aliases: [
        "away"
    ],

    description:
        "Gelişmiş AFK sistemi.",

    async execute(message, args) {

        await execute(
            message,
            args
        );
    },

    handleMessage,

    afkInfo,

    afkList,

    cancelAFK,

    formatDuration
};