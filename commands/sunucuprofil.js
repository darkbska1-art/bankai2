const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "sunucuprofil",
    aliases: ["sunucuprofilbilgi", "serverprofile", "serverprofil"],

    async execute(message) {
        const guild = message.guild;

        const iconURL = guild.iconURL({
            extension: "png",
            size: 1024
        });

        const owner = await guild.fetchOwner().catch(() => null);

        const textChannels = guild.channels.cache.filter(
            channel => channel.isTextBased()
        ).size;

        const voiceChannels = guild.channels.cache.filter(
            channel => channel.isVoiceBased()
        ).size;

        const roles = guild.roles.cache.size - 1;

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🏠 Sunucu Profili")
            .setThumbnail(iconURL)
            .addFields(
                {
                    name: "🏠 Sunucu",
                    value: `**${guild.name}**`,
                    inline: true
                },
                {
                    name: "🆔 Sunucu ID",
                    value: `\`${guild.id}\``,
                    inline: true
                },
                {
                    name: "👑 Sahip",
                    value: owner
                        ? `${owner.user}`
                        : "Bilinmiyor",
                    inline: true
                },
                {
                    name: "👥 Üyeler",
                    value: `\`${guild.memberCount}\``,
                    inline: true
                },
                {
                    name: "💬 Metin Kanalları",
                    value: `\`${textChannels}\``,
                    inline: true
                },
                {
                    name: "🔊 Ses Kanalları",
                    value: `\`${voiceChannels}\``,
                    inline: true
                },
                {
                    name: "🎭 Roller",
                    value: `\`${roles}\``,
                    inline: true
                },
                {
                    name: "😀 Emojiler",
                    value: `\`${guild.emojis.cache.size}\``,
                    inline: true
                },
                {
                    name: "📅 Oluşturulma",
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    inline: false
                }
            )
            .setFooter({
                text: `Bankai • ${guild.name}`
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};