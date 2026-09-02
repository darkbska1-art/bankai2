
const {
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(
    __dirname,
    "..",
    "boost.json"
);

module.exports = {
    name: "boostkapat",
    aliases: ["boostkapatma"],

    async execute(message) {

        if (
            !message.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return message.reply(
                "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
            );
        }

        if (!fs.existsSync(file)) {
            return message.reply(
                "❌ Boost sistemi zaten kapalı."
            );
        }

        let data;

        try {
            data = JSON.parse(
                fs.readFileSync(file, "utf8")
            );
        } catch {
            data = {};
        }

        if (!data[message.guild.id]) {
            return message.reply(
                "❌ Boost sistemi zaten kapalı."
            );
        }

        delete data[message.guild.id];

        fs.writeFileSync(
            file,
            JSON.stringify(data, null, 4)
        );

        await message.reply(
            "✅ Boost mesajları kapatıldı."
        );
    }
};

