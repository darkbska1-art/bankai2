
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "zar",

    aliases: [
        "dice"
    ],

    description: "1 ile 6 arasında zar atar.",

    async execute(message) {
        const result =
            Math.floor(Math.random() * 6) + 1;

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🎲 Zar Atıldı!")
            .setDescription(
                `🎲 Zar sonucu: **${result}**`
            )
            .setFooter({
                text: `Bankai • ${message.author.username}`
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};

