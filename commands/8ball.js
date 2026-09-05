
const { EmbedBuilder } = require("discord.js");

const answers = [
    "Evet, kesinlikle!",
    "Bence evet.",
    "Büyük ihtimalle.",
    "Olabilir.",
    "Şu an belli değil.",
    "Bence hayır.",
    "Pek sanmıyorum.",
    "Kesinlikle hayır!",
    "Bunu zaman gösterecek.",
    "Tekrar sorman gerekebilir."
];

module.exports = {
    name: "8ball",

    aliases: [
        "8b",
        "sor"
    ],

    description: "8Ball'a soru sor.",

    async execute(message, args) {
        if (!args.length) {
            return message.reply(
                "❌ Bir soru sor.\n\n" +
                "`B!8ball Yarın hava güzel olacak mı?`"
            );
        }

        const question = args.join(" ");

        const answer =
            answers[
                Math.floor(Math.random() * answers.length)
            ];

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🎱 8Ball")
            .addFields(
                {
                    name: "❓ Soru",
                    value: question
                },
                {
                    name: "🔮 Cevap",
                    value: answer
                }
            )
            .setFooter({
                text: `Bankai • ${message.author.username}`
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};

