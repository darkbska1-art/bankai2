
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "yazitura",

    aliases: [
        "yazıtur",
        "yazitura"
    ],

    description: "Yazı veya tura atar.",

    async execute(message) {
        const result =
            Math.random() < 0.5
                ? "Yazı"
                : "Tura";

        const emoji =
            result === "Yazı"
                ? "🪙"
                : "🔄";

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🪙 Yazı Tura")
            .setDescription(
                `${emoji} **${result}!**`
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

