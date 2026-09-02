
const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder
} = require("discord.js");

const file = path.join(
    __dirname,
    "..",
    "boost.json"
);

module.exports = client => {

    client.on(
        "guildMemberUpdate",
        async (oldMember, newMember) => {

            try {

                // Boost başladı mı?
                if (
                    oldMember.premiumSince ||
                    !newMember.premiumSince
                ) {
                    return;
                }

                if (!fs.existsSync(file)) {
                    return;
                }

                let data;

                try {
                    data = JSON.parse(
                        fs.readFileSync(
                            file,
                            "utf8"
                        )
                    );
                } catch {
                    return;
                }

                const channelId =
                    data[newMember.guild.id];

                if (!channelId) return;

                const channel =
                    newMember.guild.channels.cache.get(
                        channelId
                    );

                if (!channel?.isTextBased()) {
                    return;
                }

                const boosts =
                    newMember.guild.premiumSubscriptionCount || 0;

                const level =
                    newMember.guild.premiumTier || 0;

                const embed =
                    new EmbedBuilder()
                        .setColor(0xFF69B4)
                        .setTitle(
                            "🚀 SUNUCU BOOSTLANDI!"
                        )
                        .setDescription(
                            `💖 **${newMember.user}** sunucumuzu boostladı!\n\n` +
                            `🎀 Desteğin için çok teşekkürler!`
                        )
                        .addFields(
                            {
                                name: "👤 Boostlayan",
                                value:
                                    `${newMember.user}`,
                                inline: true
                            },
                            {
                                name: "⭐ Toplam Boost",
                                value:
                                    `**${boosts}**`,
                                inline: true
                            },
                            {
                                name: "🏆 Sunucu Seviyesi",
                                value:
                                    `**Seviye ${level}**`,
                                inline: true
                            }
                        )
                        .setThumbnail(
                            newMember.user.displayAvatarURL({
                                extension: "png",
                                size: 256
                            })
                        )
                        .setFooter({
                            text:
                                "🏦 Bankai • Boost Sistemi"
                        })
                        .setTimestamp();

                await channel.send({
                    embeds: [embed]
                });

                console.log(
                    `🚀 ${newMember.user.tag} boostladı!`
                );

            } catch (error) {

                console.error(
                    "❌ Boost event hatası:"
                );

                console.error(error);

            }
        }
    );
};

