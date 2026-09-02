
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "banner",
    aliases: ["kapak"],

    async execute(message, args, client) {

        const user =
            message.mentions.users.first() ||
            message.author;

        try {

            const fetchedUser =
                await client.users.fetch(
                    user.id,
                    {
                        force: true
                    }
                );

            if (!fetchedUser.banner) {
                return message.reply(
                    `❌ **${fetchedUser.username}** kullanıcısının bannerı bulunmuyor.`
                );
            }

            const banner =
                fetchedUser.bannerURL({
                    extension: "png",
                    size: 1024,
                    forceStatic: false
                });

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle(
                    `🎨 ${fetchedUser.username} • Banner`
                )
                .setImage(banner)
                .setDescription(
                    `👤 **Kullanıcı:** ${fetchedUser}\n` +
                    `🆔 **ID:** \`${fetchedUser.id}\``
                )
                .setFooter({
                    text: `${message.guild.name} • Banner`
                })
                .setTimestamp();

            await message.reply({
                embeds: [embed]
            });

        } catch (error) {

            console.error("BANNER HATASI:", error);

            await message.reply(
                "❌ Banner alınırken bir hata oluştu."
            );
        }
    }
};

