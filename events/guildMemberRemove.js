
const { sendModLog } = require("./modlog");

module.exports = {
    name: "guildMemberRemove",

    async execute(member) {

        await sendModLog(
            member.client,
            member.guild.id,
            "members",
            {
                title: "Üye Sunucudan Ayrıldı",
                emoji: "📤",

                description:
                    `**${member.user.tag}** sunucudan ayrıldı.`,

                fields: [
                    {
                        name: "👤 Kullanıcı",
                        value:
                            `${member.user.tag}\n` +
                            `ID: \`${member.id}\``
                    },
                    {
                        name: "👥 Kalan Üye",
                        value:
                            `\`${member.guild.memberCount}\``
                    }
                ],

                thumbnail: member.user.displayAvatarURL({
                    size: 256
                })
            }
        );
    }
};

