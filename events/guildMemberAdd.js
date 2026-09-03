
const { sendModLog } = require("./modlog");

module.exports = {
    name: "guildMemberAdd",

    async execute(member) {

        await sendModLog(
            member.client,
            member.guild.id,
            "members",
            {
                title: "Üye Sunucuya Katıldı",
                emoji: "📥",

                description:
                    `${member} sunucuya katıldı.`,

                fields: [
                    {
                        name: "👤 Kullanıcı",
                        value:
                            `${member.user.tag}\n` +
                            `ID: \`${member.id}\``
                    },
                    {
                        name: "📅 Hesap Oluşturulma",
                        value:
                            `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`
                    },
                    {
                        name: "👥 Sunucu Üye Sayısı",
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

