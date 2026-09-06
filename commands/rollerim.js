const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "rollerim",
    aliases: ["roller", "roles"],

    async execute(message) {
        const member = message.member;

        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position);

        const roleList = roles.size
            ? roles.map(role => `${role}`).join("\n")
            : "Herhangi bir rolün yok.";

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🎭 Rollerim")
            .setDescription(
                `👤 **Kullanıcı:** ${message.author}\n\n` +
                `**Roller (${roles.size})**\n${roleList}`
            )
            .setFooter({
                text: `Bankai • ${message.guild.name}`
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};