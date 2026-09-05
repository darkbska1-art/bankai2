
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const FILE = path.join(__dirname, "..", "hatirlatmalar.json");

function loadData() {
    if (!fs.existsSync(FILE)) {
        fs.writeFileSync(FILE, "{}", "utf8");
    }

    try {
        return JSON.parse(fs.readFileSync(FILE, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function parseTime(input) {
    const match = input.match(/^(\d+)(s|dk|sa|g)$/i);

    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers = {
        s: 1000,
        dk: 60 * 1000,
        sa: 60 * 60 * 1000,
        g: 24 * 60 * 60 * 1000
    };

    return amount * multipliers[unit];
}

module.exports = {
    name: "hatırlat",

    aliases: [
        "hatirlat",
        "remind"
    ],

    description: "Belirlediğin süre sonunda sana DM gönderir.",

    async execute(message, args) {
        if (!args.length) {
            return message.reply(
                "❌ Kullanım:\n" +
                "`B!hatırlat 10dk Ders çalış`\n" +
                "`B!hatırlat 2sa Anime izle`\n" +
                "`B!hatırlat 1g Sunucuya bak`"
            );
        }

        const duration = parseTime(args[0]);

        if (!duration) {
            return message.reply(
                "❌ Geçerli bir süre yaz.\n\n" +
                "Örnekler: `10s`, `10dk`, `2sa`, `1g`"
            );
        }

        const text = args.slice(1).join(" ").trim();

        if (!text) {
            return message.reply(
                "❌ Hatırlatılacak şeyi yazmalısın."
            );
        }

        const data = loadData();

        const userId = message.author.id;

        if (!data[userId]) {
            data[userId] = [];
        }

        const reminder = {
            id: Date.now().toString(),
            text,
            time: Date.now() + duration
        };

        data[userId].push(reminder);

        saveData(data);

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("⏰ Hatırlatıcı Ayarlandı")
            .setDescription(
                `**${text}**\n\n` +
                `⏱️ Süre: **${args[0]}**\n` +
                `📅 <t:${Math.floor(reminder.time / 1000)}:R>`
            )
            .setFooter({
                text: "Bankai • Hatırlatıcı"
            })
            .setTimestamp();

        await message.reply({
            embeds: [embed]
        });
    }
};

// Hatırlatıcı kontrol sistemi
setInterval(async () => {
    const data = loadData();
    let changed = false;

    for (const userId of Object.keys(data)) {
        const reminders = data[userId];

        for (const reminder of [...reminders]) {
            if (Date.now() >= reminder.time) {
                try {
                    const user = await global.client?.users.fetch(userId);

                    if (user) {
                        await user.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("#000000")
                                    .setTitle("⏰ Hatırlatıcın Var!")
                                    .setDescription(
                                        `🔔 **${reminder.text}**`
                                    )
                                    .setFooter({
                                        text: "Bankai • Hatırlatıcı"
                                    })
                                    .setTimestamp()
                            ]
                        });
                    }
                } catch (error) {
                    console.error(
                        "❌ Hatırlatıcı DM hatası:",
                        error.message
                    );
                }

                data[userId] = data[userId].filter(
                    x => x.id !== reminder.id
                );

                changed = true;
            }
        }
    }

    if (changed) {
        saveData(data);
    }
}, 5000);

