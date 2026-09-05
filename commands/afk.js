const fs = require("fs");
const path = require("path");
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const filePath = path.join(__dirname, "..", "afk.json");

function loadData() {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "{}");
        }

        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        console.error("❌ afk.json okunamadı:", error);
        return {};
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 4),
            "utf8"
        );
    } catch (error) {
        console.error("❌ afk.json kaydedilemedi:", error);
    }
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);

    if (seconds < 60) {
        return `${seconds} saniye`;
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} dakika`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} saat`;
    }

    const days = Math.floor(hours / 24);

    return `${days} gün`;
}

async function addNickname(member) {
    try {
        if (!member.manageable) return false;

        if (!member.guild.members.me.permissions.has(
            PermissionFlagsBits.ManageNicknames
        )) {
            return false;
        }

        const currentNickname = member.nickname;

        if (currentNickname?.startsWith("[AFK] ")) {
            return true;
        }

        let newNickname = `[AFK] ${currentNickname || member.user.username}`;

        // Discord nickname sınırı
        if (newNickname.length > 32) {
            newNickname = newNickname.slice(0, 32);
        }

        await member.setNickname(
            newNickname,
            "AFK sistemi"
        );

        return true;

    } catch (error) {
        console.log(
            `⚠️ ${member.user.tag} nick değiştirilemedi:`,
            error.message
        );

        return false;
    }
}

async function removeNickname(member, oldNickname) {
    try {
        if (!member.manageable) return;

        if (!member.guild.members.me.permissions.has(
            PermissionFlagsBits.ManageNicknames
        )) {
            return;
        }

        await member.setNickname(
            oldNickname || null,
            "AFK sistemi kaldırıldı"
        );

    } catch (error) {
        console.log(
            `⚠️ ${member.user.tag} nick geri alınamadı:`,
            error.message
        );
    }
}


// =====================================================
// B!AFK
// =====================================================

async function execute(message, args) {

    if (!message.guild) return;

    const data = loadData();

    const guildId = message.guild.id;
    const userId = message.author.id;

    if (!data[guildId]) {
        data[guildId] = {};
    }

    // Zaten AFK
    if (data[guildId][userId]) {

        const since = data[guildId][userId].since;

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("💤 Zaten AFK'sın")
                    .setDescription(
                        `Zaten AFK durumundasın.\n\n` +
                        `**Sebep:** ${data[guildId][userId].reason}\n` +
                        `**Süre:** ${formatDuration(Date.now() - since)}`
                    )
            ]
        });
    }

    const reason =
        args.length > 0
            ? args.join(" ")
            : "Belirtilmedi";

    const member = message.member;

    const oldNickname = member.nickname;

    data[guildId][userId] = {
        reason: reason,
        since: Date.now(),
        oldNickname: oldNickname,
        mentions: 0
    };

    saveData(data);

    // Nick değiştir
    await addNickname(member);

    return message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor("#000000")
                .setTitle("💤 AFK Modu")
                .setDescription(
                    `**${message.author}** artık AFK.\n\n` +
                    `📝 **Sebep:** ${reason}\n` +
                    `⏱️ **Başlangıç:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
                    `💬 Bir mesaj gönderdiğinde AFK durumun otomatik olarak kaldırılır.`
                )
                .setFooter({
                    text: "Bankai • AFK Sistemi"
                })
        ]
    });
}


// =====================================================
// MESAJ KONTROLÜ
// =====================================================

async function handleMessage(message) {

    if (!message.guild) return;

    if (message.author.bot) return;

    const data = loadData();

    const guildId = message.guild.id;
    const userId = message.author.id;

    if (!data[guildId]) {
        data[guildId] = {};
    }


    // =================================================
    // 1. KENDİ AFK'SINI KALDIR
    // =================================================

    if (data[guildId][userId]) {

        const afkData = data[guildId][userId];

        const duration = formatDuration(
            Date.now() - afkData.since
        );

        delete data[guildId][userId];

        saveData(data);

        await removeNickname(
            message.member,
            afkData.oldNickname
        );

        await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("👋 AFK Kaldırıldı")
                    .setDescription(
                        `Tekrar hoş geldin **${message.author.username}**!\n\n` +
                        `⏱️ AFK süren: **${duration}**`
                    )
                    .setFooter({
                        text: "Bankai • AFK Sistemi"
                    })
            ]
        }).catch(() => {});

        return;
    }


    // =================================================
    // 2. MENTIONLANAN KİŞİLERİ KONTROL ET
    // =================================================

    if (message.mentions.users.size === 0) {
        return;
    }

    let replies = [];

    for (const [, user] of message.mentions.users) {

        if (user.bot) continue;

        const targetData = data[guildId]?.[user.id];

        if (!targetData) continue;

        targetData.mentions =
            (targetData.mentions || 0) + 1;

        const duration = formatDuration(
            Date.now() - targetData.since
        );

        replies.push(
            `💤 **${user.username}** şu anda AFK.\n` +
            `📝 Sebep: **${targetData.reason}**\n` +
            `⏱️ Süre: **${duration}**`
        );
    }

    if (replies.length === 0) {
        return;
    }

    saveData(data);

    await message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor("#000000")
                .setTitle("💤 AFK Bilgisi")
                .setDescription(
                    replies.join("\n\n")
                )
                .setFooter({
                    text: "Bankai • AFK Sistemi"
                })
        ]
    }).catch(() => {});
}


// =====================================================
// AFK BİLGİ
// =====================================================

async function afkInfo(message, target) {

    if (!message.guild) return;

    const data = loadData();

    const user =
        target || message.author;

    const afkData =
        data[message.guild.id]?.[user.id];

    if (!afkData) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("❌ AFK Değil")
                    .setDescription(
                        `**${user.username}** AFK değil.`
                    )
            ]
        });
    }

    await message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor("#000000")
                .setTitle("💤 AFK Bilgisi")
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    {
                        name: "👤 Kullanıcı",
                        value: `${user}`,
                        inline: true
                    },
                    {
                        name: "📝 Sebep",
                        value: afkData.reason,
                        inline: true
                    },
                    {
                        name: "⏱️ Süre",
                        value: formatDuration(
                            Date.now() - afkData.since
                        ),
                        inline: true
                    },
                    {
                        name: "📨 Mention",
                        value: `${afkData.mentions || 0}`,
                        inline: true
                    }
                )
        ]
    });
}


// =====================================================
// AFK LİSTESİ
// =====================================================

async function afkList(message) {

    if (!message.guild) return;

    const data = loadData();

    const guildData =
        data[message.guild.id] || {};

    const entries =
        Object.entries(guildData);

    if (entries.length === 0) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("💤 AFK Listesi")
                    .setDescription(
                        "Bu sunucuda AFK olan kimse yok."
                    )
            ]
        });
    }

    const list = [];

    for (const [userId, afk] of entries) {

        const member =
            await message.guild.members
                .fetch(userId)
                .catch(() => null);

        if (!member) continue;

        list.push(
            `💤 ${member} — **${afk.reason}** — ${formatDuration(Date.now() - afk.since)}`
        );
    }

    await message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor("#000000")
                .setTitle("💤 AFK Listesi")
                .setDescription(
                    list.length
                        ? list.join("\n")
                        : "AFK olan kimse yok."
                )
        ]
    });
}


// =====================================================
// AFK İPTAL
// =====================================================

async function cancelAFK(message, target) {

    if (!message.guild) return;

    const user =
        target || message.author;

    const data = loadData();

    const guildData =
        data[message.guild.id];

    if (!guildData?.[user.id]) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("❌ AFK Bulunamadı")
                    .setDescription(
                        `${user.username} AFK değil.`
                    )
            ]
        });
    }

    const afkData =
        guildData[user.id];

    delete guildData[user.id];

    saveData(data);

    const member =
        await message.guild.members
            .fetch(user.id)
            .catch(() => null);

    if (member) {
        await removeNickname(
            member,
            afkData.oldNickname
        );
    }

    await message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor("#000000")
                .setTitle("✅ AFK İptal Edildi")
                .setDescription(
                    `**${user.username}** AFK durumundan çıkarıldı.`
                )
        ]
    });
}


module.exports = {
    name: "afk",
    aliases: ["away"],
    description: "Gelişmiş AFK sistemi.",

    async execute(message, args) {
        return execute(message, args);
    },

    handleMessage,
    afkInfo,
    afkList,
    cancelAFK,
    formatDuration
};