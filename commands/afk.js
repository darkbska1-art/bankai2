const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "afk.json");

function loadAFK() {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "{}");
            return {};
        }

        const data = fs.readFileSync(filePath, "utf8");

        if (!data.trim()) return {};

        return JSON.parse(data);
    } catch (error) {
        console.error("AFK verisi okunamadı:", error);
        return {};
    }
}

function saveAFK(data) {
    try {
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 4)
        );
    } catch (error) {
        console.error("AFK verisi kaydedilemedi:", error);
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
        return `${hours} saat ${minutes % 60} dakika`;
    }

    const days = Math.floor(hours / 24);

    return `${days} gün ${hours % 24} saat`;
}

module.exports = {
    name: "afk",
    aliases: ["away"],
    description: "AFK moduna girer.",

    async execute(message, args) {

        if (!message.guild) return;

        const data = loadAFK();

        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!data[guildId]) {
            data[guildId] = {};
        }

        const reason =
            args.join(" ").trim() ||
            "Sebep belirtilmedi.";

        /*
        |--------------------------------------------------------------------------
        | Zaten AFK ise sebebini güncelle
        |--------------------------------------------------------------------------
        */

        if (data[guildId][userId]) {

            data[guildId][userId].reason = reason;
            data[guildId][userId].since = Date.now();

            saveAFK(data);

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("💤 AFK Güncellendi")
                .setDescription(
                    `AFK sebebin güncellendi.\n\n` +
                    `**Sebep:** ${reason}`
                )
                .setFooter({
                    text: `Bankai • ${message.guild.name}`
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Eski nickname'i kaydet
        |--------------------------------------------------------------------------
        */

        const oldNickname = message.member.nickname;

        data[guildId][userId] = {
            reason: reason,
            since: Date.now(),
            oldNickname: oldNickname
        };

        saveAFK(data);

        /*
        |--------------------------------------------------------------------------
        | Nickname değiştir
        |--------------------------------------------------------------------------
        */

        let nicknameChanged = false;

        if (
            message.guild.members.me &&
            message.guild.members.me.permissions.has(
                PermissionFlagsBits.ManageNicknames
            )
        ) {

            const currentName =
                message.member.nickname ||
                message.author.username;

            const afkName = `[AFK] ${currentName}`;

            /*
            | Discord nickname maksimum 32 karakter
            */

            const finalName = afkName.slice(0, 32);

            if (
                message.member.manageable &&
                currentName !== finalName
            ) {

                try {
                    await message.member.setNickname(
                        finalName,
                        "AFK sistemi"
                    );

                    nicknameChanged = true;

                } catch (error) {
                    console.error(
                        "AFK nickname değiştirilemedi:",
                        error
                    );
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Embed
        |--------------------------------------------------------------------------
        */

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("💤 AFK Modu")
            .setDescription(
                `**${message.author}** artık AFK.\n\n` +
                `💬 **Sebep:** ${reason}\n` +
                `⏱️ **Başlangıç:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
                (
                    nicknameChanged
                        ? "🏷️ İsminin başına **[AFK]** eklendi."
                        : "⚠️ Nickname değiştirilemedi fakat AFK sistemi aktif."
                )
            )
            .setFooter({
                text: `Bankai • ${message.guild.name}`
            })
            .setTimestamp();

        await message.reply({
            embeds: [embed]
        });
    },

    loadAFK,
    saveAFK,
    formatDuration
};