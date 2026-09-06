const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "davet",
    aliases: ["invite", "botdavet", "botdavetlink"],

    async execute(message) {
        const client = message.client;

        const permissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageChannels
        ];

        const inviteURL =
            `https://discord.com/oauth2/authorize` +
            `?client_id=${client.user.id}` +
            `&permissions=${permissions.reduce(
                (a, b) => BigInt(a) | BigInt(b),
                0n
            )}` +
            `&scope=bot%20applications.commands`;

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🤖 Bankai'yi Davet Et")
            .setDescription(
                "Bankai'yi başka bir sunucuya eklemek için aşağıdaki bağlantıyı kullanabilirsin.\n\n" +
                `[🔗 **Bankai'yi Sunucuya Ekle**](${inviteURL})`
            )
            .addFields({
                name: "📌 Bot",
                value: `${client.user}\n\`${client.user.id}\``
            })
            .setFooter({
                text: "Bankai • Davet Sistemi"
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};