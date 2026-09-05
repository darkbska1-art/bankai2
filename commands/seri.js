const {
    EmbedBuilder
} = require("discord.js");

const {
    getUser
} = require("../database/database");

module.exports = {
    name: "seri",

    aliases: [
        "streak"
    ],

    description: "Global seri bilgini gösterir.",

    async execute(message) {

        const user = getUser(message.author.id);

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setAuthor({
                name: `${message.author.username} • Seri`
            })
            .setTitle("🔥 Global Seri")
            .setDescription(
                `🔥 **Mevcut Serin:** ${user.streak}\n` +
                `🏆 **En Yüksek Serin:** ${user.best_streak}\n\n` +
                `🌍 Bu seri **tüm sunucularda ortaktır.**`
            )
            .setThumbnail(message.author.displayAvatarURL({
                dynamic: true
            }))
            .setFooter({
                text: "Bankai • Global Seri Sistemi"
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};