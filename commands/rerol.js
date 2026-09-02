
const {
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(
    __dirname,
    "..",
    "cekilis.json"
);

function load() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    return JSON.parse(
        fs.readFileSync(file, "utf8")
    );
}

function save(data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}

module.exports = {
    name: "reroll",
    aliases: ["yenikazanan"],

    async execute(message, args) {

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply(
                "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
            );
        }

        const id = args[0];

        if (!id) {
            return message.reply(
                "❌ Çekiliş ID'sini belirtmelisin."
            );
        }

        const data = load();

        const giveaway = data[id];

        if (!giveaway) {
            return message.reply(
                "❌ Çekiliş bulunamadı."
            );
        }

        if (!giveaway.ended) {
            return message.reply(
                "❌ Bu çekiliş henüz bitmedi."
            );
        }

        const participants =
            giveaway.participants.filter(
                id => !giveaway.lastWinners?.includes(id)
            );

        if (!participants.length) {
            return message.reply(
                "❌ Yeni kazanan seçmek için yeterli katılımcı yok."
            );
        }

        const shuffled =
            [...participants].sort(
                () => Math.random() - 0.5
            );

        const winners =
            shuffled.slice(
                0,
                Math.min(
                    giveaway.winners,
                    participants.length
                )
            );

        giveaway.lastWinners = winners;

        save(data);

        return message.channel.send(
            `🔄 **Yeni kazananlar:** ${winners.map(id => `<@${id}>`).join(", ")}\n` +
            `🎁 **Ödül:** ${giveaway.prize}`
        );
    }
};

