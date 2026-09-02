// =====================================================
// commands/warn.js
// =====================================================

const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const warnPath = path.join(
    __dirname,
    "..",
    "warns.json"
);

function loadWarns() {

    if (!fs.existsSync(warnPath)) {
        fs.writeFileSync(
            warnPath,
            "{}",
            "utf8"
        );
    }

    try {
        return JSON.parse(
            fs.readFileSync(warnPath, "utf8")
        );
    } catch {
        return {};
    }
}

function saveWarns(data) {

    fs.writeFileSync(
        warnPath,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

module.exports = {
    name: "warn",
    aliases: ["uyar", "uyarı"],

    async execute(message, args) {

        if (!message.member.permissions.has(
            PermissionFlagsBits.ModerateMembers
        )) {
            return message.reply(
                "❌ **Üyelere Zaman Aşımı Uygula** yetkin yok."
            );
        }

        const member =
            message.mentions.members.first() ||
            await message.guild.members.fetch(
                args[0]
            ).catch(() => null);

        if (!member) {
            return message.reply(
                "❌ Bir üye belirtmelisin.\n" +
                "Örnek: `B!warn @Ali spam`"
            );
        }

        if (member.id === message.author.id) {
            return message.reply(
                "❌ Kendini uyaramazsın."
            );
        }

        const reason =
            args.slice(1).join(" ") ||
            "Sebep belirtilmedi.";

        const data = loadWarns();

        if (!data[message.guild.id]) {
            data[message.guild.id] = {};
        }

        if (!data[message.guild.id][member.id]) {
            data[message.guild.id][member.id] = [];
        }

        data[message.guild.id][member.id].push({
            reason,
            moderator: message.author.id,
            date: new Date().toISOString()
        });

        saveWarns(data);

        const total =
            data[message.guild.id][member.id].length;

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("⚠️ Üye Uyarıldı")
            .setThumbnail(
                member.user.displayAvatarURL()
            )
            .addFields(
                {
                    name: "👤 Üye",
                    value: `${member.user.tag}`,
                    inline: true
                },
                {
                    name: "🔢 Toplam Uyarı",
                    value: `\`${total}\``,
                    inline: true
                },
                {
                    name: "👮 Yetkili",
                    value: `${message.author}`,
                    inline: true
                },
                {
                    name: "📝 Sebep",
                    value: reason,
                    inline: false
                }
            )
            .setFooter({
                text: "Uyarı kaydı kalıcı olarak saklandı."
            })
            .setTimestamp();

        await message.reply({
            embeds: [embed]
        });
    }
};

