
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "modlog.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "{}", "utf8");
}

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

function createDefaultGuild() {
    return {
        enabled: false,
        channels: {
            moderation: null,
            messages: null,
            members: null,
            server: null
        }
    };
}

function getModLog(guildId) {
    const data = loadData();

    if (!data[guildId]) {
        return createDefaultGuild();
    }

    return {
        enabled: data[guildId].enabled ?? false,

        channels: {
            moderation:
                data[guildId].channels?.moderation ?? null,

            messages:
                data[guildId].channels?.messages ?? null,

            members:
                data[guildId].channels?.members ?? null,

            server:
                data[guildId].channels?.server ?? null
        }
    };
}

function setModLog(guildId, type, channelId) {
    const data = loadData();

    if (!data[guildId]) {
        data[guildId] = createDefaultGuild();
    }

    if (!data[guildId].channels) {
        data[guildId].channels = {
            moderation: null,
            messages: null,
            members: null,
            server: null
        };
    }

    data[guildId].enabled = true;
    data[guildId].channels[type] = channelId;

    saveData(data);
}

function disableModLog(guildId) {
    const data = loadData();

    if (!data[guildId]) {
        data[guildId] = createDefaultGuild();
    }

    data[guildId].enabled = false;

    saveData(data);
}

async function sendModLog(
    client,
    guildId,
    type,
    options = {}
) {
    try {
        const settings = getModLog(guildId);

        if (!settings.enabled) {
            return;
        }

        const channelId =
            settings.channels?.[type];

        if (!channelId) {
            return;
        }

        const guild =
            client.guilds.cache.get(guildId);

        if (!guild) {
            return;
        }

        const channel =
            guild.channels.cache.get(channelId);

        if (
            !channel ||
            !channel.isTextBased()
        ) {
            return;
        }

        const {
            title = "ModLog",
            emoji = "🛡️",
            description = null,
            color = 0x5865F2,
            fields = [],
            thumbnail = null
        } = options;

        const embed =
            new EmbedBuilder()
                .setColor(color)
                .setTitle(`${emoji} ${title}`)
                .setTimestamp();

        if (description) {
            embed.setDescription(
                String(description).substring(0, 4096)
            );
        }

        if (fields.length) {
            embed.addFields(
                fields
                    .filter(
                        field =>
                            field?.name &&
                            field?.value !== undefined
                    )
                    .map(field => ({
                        name:
                            String(field.name)
                                .substring(0, 256),

                        value:
                            String(field.value)
                                .substring(0, 1024),

                        inline:
                            field.inline ?? true
                    }))
            );
        }

        if (thumbnail) {
            embed.setThumbnail(thumbnail);
        }

        embed.setFooter({
            text:
                `${guild.name} • ${type.toUpperCase()} LOG`
        });

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {
        console.error(
            "❌ ModLog gönderme hatası:",
            error
        );
    }
}

module.exports = {
    loadData,
    saveData,
    getModLog,
    setModLog,
    disableModLog,
    sendModLog
};

