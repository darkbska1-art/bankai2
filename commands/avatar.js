
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "avatar",
    aliases: ["pp", "profil"],

    async execute(message) {

        const user =
            message.mentions.users.first() ||
            message.author;

        const avatar = user.displayAvatarURL({
            extension: "png",
            size: 1024,
            forceStatic: false
        });

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(`🖼️ ${user.username} • Avatar`)
            .setImage(avatar)
            .setDescription(
                `👤 **Kullanıcı:** ${user}\n` +
                `🆔 **ID:** \`${user.id}\``
            )
            .setFooter({
                text: `${message.guild.name} • Avatar`
            })
            .setTimestamp();

        await message.reply({
            embeds: [embed]
        });
    }
};

