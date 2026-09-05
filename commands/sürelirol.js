const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "sureliroller.json");

function loadData() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

function parseDuration(input) {
    const match = input.match(/^(\d+)(s|m|h|d|w)$/i);

    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    const units = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };

    return amount * units[unit];
}

function formatDuration(ms) {
    let seconds = Math.floor(ms / 1000);

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    const parts = [];

    if (days) parts.push(`${days}g`);
    if (hours) parts.push(`${hours}s`);
    if (minutes) parts.push(`${minutes}d`);
    if (seconds) parts.push(`${seconds}sn`);

    return parts.join(" ") || "0sn";
}

async function checkExpiredRoles(client) {
    const data = loadData();
    let changed = false;

    for (const guildId of Object.keys(data)) {

        const guild = client.guilds.cache.get(guildId);

        if (!guild) continue;

        for (const roleId of Object.keys(data[guildId])) {

            const roleData = data[guildId][roleId];

            for (const userId of Object.keys(roleData)) {

                const info = roleData[userId];

                if (Date.now() < info.expiresAt) {
                    continue;
                }

                const member = await guild.members
                    .fetch(userId)
                    .catch(() => null);

                if (member) {

                    const role = guild.roles.cache.get(roleId);

                    if (role && member.roles.cache.has(roleId)) {
                        await member.roles.remove(
                            role,
                            "Süreli rol süresi doldu"
                        ).catch(() => {});
                    }
                }

                delete data[guildId][roleId][userId];

                changed = true;
            }

            if (
                Object.keys(data[guildId][roleId]).length === 0
            ) {
                delete data[guildId][roleId];
            }
        }

        if (
            Object.keys(data[guildId]).length === 0
        ) {
            delete data[guildId];
        }
    }

    if (changed) {
        saveData(data);
    }
}

module.exports = {
    name: "sürelirol",
    aliases: ["temp-role", "süreliver"],

    async execute(message, args) {

        if (!message.guild) return;

        if (
            !message.member.permissions.has(
                PermissionFlagsBits.ManageRoles
            )
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bu komutu kullanmak için **Rolleri Yönet** yetkisine sahip olmalısın."
                        )
                ]
            });
        }

        const member =
            message.mentions.members.first();

        const role =
            message.mentions.roles.first();

        if (!member || !role || !args[2]) {

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("⏳ Süreli Rol")
                        .setDescription(
                            "**Kullanım:**\n" +
                            "`B!sürelirol @kullanıcı @rol süre`\n\n" +
                            "**Örnekler:**\n" +
                            "`B!sürelirol @Ali @VIP 30m`\n" +
                            "`B!sürelirol @Ali @VIP 2h`\n" +
                            "`B!sürelirol @Ali @VIP 7d`\n\n" +
                            "**Süre birimleri:**\n" +
                            "`s` = saniye\n" +
                            "`m` = dakika\n" +
                            "`h` = saat\n" +
                            "`d` = gün\n" +
                            "`w` = hafta"
                        )
                ]
            });
        }

        const duration =
            parseDuration(args[2]);

        if (!duration || duration <= 0) {

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Geçersiz süre!\n\nÖrnek: `30m`, `2h`, `7d`, `1w`"
                        )
                ]
            });
        }

        if (role.managed) {

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Entegrasyon tarafından yönetilen bir role süre veremem."
                        )
                ]
            });
        }

        const botMember =
            message.guild.members.me;

        if (
            role.position >=
            botMember.roles.highest.position
        ) {

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bu rol benim en yüksek rolümün üstünde veya aynı seviyede."
                        )
                ]
            });
        }

        try {

            await member.roles.add(
                role,
                `${message.author.tag} tarafından süreli rol`
            );

            const data = loadData();

            const guildId =
                message.guild.id;

            const roleId =
                role.id;

            const userId =
                member.id;

            if (!data[guildId]) {
                data[guildId] = {};
            }

            if (!data[guildId][roleId]) {
                data[guildId][roleId] = {};
            }

            data[guildId][roleId][userId] = {
                expiresAt: Date.now() + duration,
                addedBy: message.author.id
            };

            saveData(data);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("⏳ Süreli Rol Verildi")
                        .setDescription(
                            `👤 **Kullanıcı:** ${member}\n` +
                            `🎭 **Rol:** ${role}\n` +
                            `⏱️ **Süre:** ${formatDuration(duration)}\n` +
                            `📅 **Bitiş:** <t:${Math.floor((Date.now() + duration) / 1000)}:F>`
                        )
                        .setFooter({
                            text: "Bankai • Süreli Rol Sistemi"
                        })
                ]
            });

        } catch (error) {

            console.error(
                "❌ Süreli rol hatası:",
                error
            );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Rol verilirken bir hata oluştu."
                        )
                ]
            });
        }
    },

    checkExpiredRoles
};