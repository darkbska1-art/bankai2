
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

function loadData() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    try {
        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}

module.exports = {
    name: "boostayar",
    aliases: ["boostkanal"],

    async execute(message, args) {

        if (
            !message.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return message.reply(
                "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
            );
        }

        const channel =
            message.mentions.channels.first();

        if (!channel) {
            return message.reply(
                "❌ Bir kanal etiketlemelisin.\n\n" +
                "Örnek: `B!boostayar #boost`"
            );
        }

        if (!channel.isTextBased()) {
            return message.reply(
                "❌ Bu kanal mesaj göndermek için uygun değil."
            );
        }

        const data = loadData();

        data[message.guild.id] = channel.id;

        saveData(data);

        await message.reply(
            `✅ Boost mesajları artık ${channel} kanalına gönderilecek.`
        );
    }
};

