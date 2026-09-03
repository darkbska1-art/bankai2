
const { sendModLog } = require("./modlog");

module.exports = {
    name: "messageDelete",

    async execute(message) {

        if (!message.guild) return;
        if (message.author?.bot) return;

        const content = message.content?.trim()
            ? message.content
            : "*Mesaj içeriği alınamadı veya mesaj boştu.*";

        let attachments = "Yok";

        if (message.attachments?.size) {
            attachments = message.attachments
                .map(a => `📎 [${a.name}](${a.url})`)
                .join("\n");
        }

        await sendModLog(
            message.client,
            message.guild.id,
            "messages",
            {
                title: "Mesaj Silindi",
                emoji: "🗑️",

                description:
                    `**${message.author?.tag || "Bilinmeyen Kullanıcı"}** adlı kullanıcının mesajı silindi.`,

                fields: [
                    {
                        name: "👤 Kullanıcı",
                        value:
                            `${message.author || "Bilinmiyor"}\n` +
                            `ID: \`${message.author?.id || "Bilinmiyor"}\``
                    },
                    {
                        name: "📺 Kanal",
                        value:
                            `${message.channel}\n` +
                            `ID: \`${message.channel.id}\``
                    },
                    {
                        name: "📝 Mesaj",
                        value: content.substring(0, 1024),
                        inline: false
                    },
                    {
                        name: "📎 Ekler",
                        value: attachments.substring(0, 1024),
                        inline: false
                    }
                ],

                thumbnail: message.author?.displayAvatarURL({
                    size: 256
                })
            }
        );
    }
};

