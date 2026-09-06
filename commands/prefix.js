const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const filePath = path.join(
    __dirname,
    "..",
    "prefixler.json"
);

function loadPrefixes() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(
            filePath,
            JSON.stringify({}, null, 4)
        );
    }

    try {
        return JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );
    } catch {
        return {};
    }
}

function savePrefixes(data) {
    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 4)
    );
}

module.exports = {
    name: "prefix",
    aliases: ["prefixayarla"],

    async execute(message, args) {

        if (!message.guild) return;

        const prefixes = loadPrefixes();

        // Mevcut prefix
        const currentPrefix =
            prefixes[message.guild.id] || "B!";

        // Sadece prefixi göster
        if (!args[0]) {

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("⚙️ Prefix Sistemi")
                        .setDescription(
                            `🏦 Bu sunucunun prefixi: \`${currentPrefix}\`\n\n` +
                            `📝 Değiştirmek için:\n` +
                            `\`${currentPrefix}prefix <yeni prefix>\`\n\n` +
                            `**Örnek:**\n` +
                            `\`${currentPrefix}prefix ?\``
                        )
                ]
            });
        }

        // Yetki
        if (
            !message.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                        )
                ]
            });
        }

        const newPrefix = args[0];

        // Uzunluk kontrolü
        if (newPrefix.length > 5) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Prefix en fazla **5 karakter** olabilir."
                        )
                ]
            });
        }

        // Boşluk kontrolü
        if (/\s/.test(newPrefix)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Prefix içerisinde boşluk kullanamazsın."
                        )
                ]
            });
        }

        prefixes[message.guild.id] = newPrefix;

        savePrefixes(prefixes);

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("✅ Prefix Değiştirildi")
                    .setDescription(
                        `🏦 **Sunucu:** ${message.guild.name}\n\n` +
                        `🔧 **Eski prefix:** \`${currentPrefix}\`\n` +
                        `✨ **Yeni prefix:** \`${newPrefix}\`\n\n` +
                        `Artık komutları \`${newPrefix}\` ile kullanabilirsin.`
                    )
            ]
        });
    }
};