
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "cekilis.json");

function load() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return {};
    }
}

function save(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

function parseDuration(input) {
    const match = /^(\d+)(s|m|h|d)$/i.exec(input);

    if (!match) return null;

    const number = Number(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    const duration = number * multipliers[unit];

    if (duration < 5000) return null;

    if (duration > 30 * 24 * 60 * 60 * 1000) {
        return null;
    }

    return duration;
}

function createEmbed(giveaway, ended = false) {
    const end = Math.floor(giveaway.endTime / 1000);

    if (ended) {
        return new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("🎉 ÇEKİLİŞ SONA ERDİ")
            .setDescription(
                `🎁 **Ödül:** ${giveaway.prize}\n\n` +
                `🏆 **Kazanan sayısı:** ${giveaway.winners}\n` +
                `👥 **Katılımcılar:** ${giveaway.participants.length} kişi\n\n` +
                `🎉 **Kazananlar:** ${giveaway.lastWinners?.map(x => `<@${x}>`).join(", ") || "Kazanan yok."}`
            )
            .setFooter({
                text: "🏦 Bankai • Çekiliş Sistemi"
            })
            .setTimestamp();
    }

    return new EmbedBuilder()
        .setColor(0x000000)
        .setTitle("🎉 ÇEKİLİŞ")
        .setDescription(
            `🎁 **Ödül**\n` +
            `> ${giveaway.prize}\n\n` +

            `🏆 **Kazanan:** ${giveaway.winners} kişi\n` +
            `👥 **Katılımcılar:** ${giveaway.participants.length} kişi\n` +
            `⏰ **Bitiş:** <t:${end}:R>\n\n` +

            `🎟️ Çekilişe katılmak için **Katıl** butonuna bas.\n` +
            `🚪 Katılımını kaldırmak için **Ayrıl** butonuna bas.`
        )
        .setFooter({
            text: "🏦 Bankai • Çekiliş Sistemi"
        })
        .setTimestamp(giveaway.endTime);
}

function createButtons(id) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`giveaway_join_${id}`)
            .setLabel("Katıl")
            .setEmoji("🎟️")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId(`giveaway_leave_${id}`)
            .setLabel("Ayrıl")
            .setEmoji("🚪")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`giveaway_cancel_${id}`)
            .setLabel("İptal")
            .setEmoji("🗑️")
            .setStyle(ButtonStyle.Danger)
    );
}

async function finishGiveaway(client, id) {
    const data = load();
    const giveaway = data[id];

    if (!giveaway || giveaway.ended) return;

    if (Date.now() < giveaway.endTime) return;

    giveaway.ended = true;

    const participants = [...new Set(giveaway.participants)];

    let winners = [];

    if (participants.length > 0) {
        const shuffled = [...participants].sort(
            () => Math.random() - 0.5
        );

        winners = shuffled.slice(
            0,
            Math.min(giveaway.winners, participants.length)
        );
    }

    giveaway.lastWinners = winners;

    save(data);

    const guild = client.guilds.cache.get(giveaway.guildId);

    if (!guild) return;

    const channel = guild.channels.cache.get(
        giveaway.channelId
    );

    if (!channel) return;

    try {
        const msg = await channel.messages.fetch(
            giveaway.messageId
        );

        await msg.edit({
            embeds: [createEmbed(giveaway, true)],
            components: []
        });

        if (winners.length > 0) {
            await channel.send({
                content:
                    `🎉 Tebrikler ${winners.map(id => `<@${id}>`).join(", ")}!\n` +
                    `🎁 **${giveaway.prize}** kazandınız!`
            });
        } else {
            await channel.send(
                `😔 **${giveaway.prize}** çekilişinde yeterli katılımcı olmadı.`
            );
        }

    } catch (error) {
        console.error("❌ Çekiliş bitirme hatası:", error);
    }
}

function scheduleGiveaway(client, id) {
    const data = load();
    const giveaway = data[id];

    if (!giveaway || giveaway.ended) return;

    const remaining = giveaway.endTime - Date.now();

    if (remaining <= 0) {
        finishGiveaway(client, id);
        return;
    }

    setTimeout(() => {
        finishGiveaway(client, id);
    }, Math.min(remaining, 2147483647));
}

module.exports = {
    name: "çekiliş",
    aliases: ["cekilis", "giveaway"],

    async execute(message, args) {

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply(
                "❌ Çekiliş başlatmak için **Sunucuyu Yönet** yetkisi gerekiyor."
            );
        }

        if (args.length < 3) {
            return message.reply(
                "❌ Kullanım:\n\n" +
                "`B!çekiliş <süre> <kazanan> <ödül>`\n\n" +
                "Örnek:\n" +
                "`B!çekiliş 1h 2 Discord Nitro`\n\n" +
                "Süre örnekleri: `30s`, `10m`, `1h`, `1d`\n" +
                "Minimum: 5 saniye • Maksimum: 30 gün"
            );
        }

        const duration = parseDuration(args[0]);

        if (!duration) {
            return message.reply(
                "❌ Geçersiz süre. Örnek: `30s`, `10m`, `1h`, `1d`"
            );
        }

        const winners = Number(args[1]);

        if (
            !Number.isInteger(winners) ||
            winners < 1 ||
            winners > 100
        ) {
            return message.reply(
                "❌ Kazanan sayısı **1-100** arasında olmalı."
            );
        }

        const prize = args.slice(2).join(" ").trim();

        if (!prize) {
            return message.reply("❌ Ödül belirtmelisin.");
        }

        const endTime = Date.now() + duration;

        const id =
            `${message.guild.id}-${message.channel.id}-${Date.now()}`;

        const data = load();

        data[id] = {
            guildId: message.guild.id,
            channelId: message.channel.id,
            messageId: null,
            prize,
            winners,
            endTime,
            participants: [],
            ended: false,
            lastWinners: []
        };

        save(data);

        const msg = await message.channel.send({
            embeds: [createEmbed(data[id])],
            components: [createButtons(id)]
        });

        data[id].messageId = msg.id;

        save(data);

        scheduleGiveaway(message.client, id);

        await message.reply(
            "✅ Çekiliş başarıyla başlatıldı!"
        );
    },

    scheduleGiveaway
};

