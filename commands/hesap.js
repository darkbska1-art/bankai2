const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "hesap",
    aliases: ["hesapbilgi", "account"],

    async execute(message) {
        const user = message.author;
        const member = message.member;

        const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;
        const joinedAt = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`;

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("👤 Hesap Bilgileri")
            .setThumbnail(user.displayAvatarURL({
                dynamic: true,
                size: 512
            }))
            .addFields(
                {
                    name: "👤 Kullanıcı",
                    value: `${user}\n\`${user.tag}\``,
                    inline: true
                },
                {
                    name: "🆔 Kullanıcı ID",
                    value: `\`${user.id}\``,
                    inline: true
                },
                {
                    name: "🤖 Bot",
                    value: user.bot ? "Evet" : "Hayır",
                    inline: true
                },
                {
                    name: "📅 Discord'a Katılım",
                    value: createdAt,
                    inline: false
                },
                {
                    name: "🏠 Sunucuya Katılım",
                    value: joinedAt,
                    inline: false
                },
                {
                    name: "🎭 En Yüksek Rol",
                    value: `${member.roles.highest}`,
                    inline: true
                },
                {
                    name: "🎨 Avatar",
                    value: `[Avatarı Görüntüle](${user.displayAvatarURL({
                        dynamic: true,
                        size: 1024
                    })})`,
                    inline: true
                }
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