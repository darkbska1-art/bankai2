
const { sendModLog } = require("./modlog");

module.exports = {
    name: "messageUpdate",

    async execute(oldMessage, newMessage) {

        if (!oldMessage.guild) return;
        if (oldMessage.author?.bot) return;

        if (oldMessage.content === newMessage.content) return;

        const oldContent =
            oldMessage.content?.trim()
                ? oldMessage.content
                : "*Eski mesaj içeriği alınamadı.*";

        const newContent =
            newMessage.content?.trim()
                ? newMessage.content
                : "*Yeni mesaj içeriği alınamadı.*";

        await sendModLog(
            newMessage.client,
            newMessage.guild.id,
            "messages",
            {
                title: "Mesaj Düzenlendi",
                emoji: "✏️",

                description:
                    `**${newMessage.author?.tag || "Bilinmeyen Kullanıcı"}** mesajını düzenledi.`,

                fields: [
                    {
                        name: "👤 Kullanıcı",
                        value:
                            `${newMessage.author}\n` +
                            `ID: \`${newMessage.author?.id}\``
                    },
                    {
                        name: "📺 Kanal",
                        value:
                            `${newMessage.channel}\n` +
                            `ID: \`${newMessage.channel.id}\``
                    },
                    {
                        name: "⬅️ Eski Mesaj",
                        value: oldContent.substring(0, 1024),
                        inline: false
                    },
                    {
                        name: "➡️ Yeni Mesaj",
                        value: newContent.substring(0, 1024),
                        inline: false
                    }
                ],

                thumbnail: newMessage.author?.displayAvatarURL({
                    size: 256
                })
            }
        );
    }
};

