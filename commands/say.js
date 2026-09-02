
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "say",
    aliases: ["söyle"],

    async execute(message, args) {

        const text = args.join(" ").trim();

        if (!text) {
            return message.reply(
                "❌ Söylemem için bir mesaj yazmalısın.\n\n" +
                "Örnek: `B!say Merhaba arkadaşlar!`"
            );
        }

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(`💬 ${text}`)
            .setFooter({
                text: `👤 ${message.author.tag} istedi`
            })
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        await message.delete().catch(() => {});
    }
};

