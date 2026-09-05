
const { EmbedBuilder } = require("discord.js");

const games = new Map();

module.exports = {
    name: "sayitahmin",

    aliases: [
        "tahmin",
        "sayitahminet"
    ],

    description: "1-100 arasında sayı tahmin et.",

    async execute(message, args) {
        const userId = message.author.id;

        if (games.has(userId)) {
            return message.reply(
                "❌ Zaten devam eden bir tahmin oyunun var!"
            );
        }

        const number =
            Math.floor(Math.random() * 100) + 1;

        games.set(userId, {
            number,
            attempts: 0
        });

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🎯 Sayı Tahmin")
            .setDescription(
                "1 ile 100 arasında bir sayı tuttum!\n\n" +
                "Tahminini yaz:\n" +
                "`B!tahmin 50`"
            )
            .setFooter({
                text: "Bankai • Sayı Tahmin"
            });

        await message.reply({
            embeds: [embed]
        });

        const collector =
            message.channel.createMessageCollector({
                filter: m =>
                    m.author.id === userId &&
                    (
                        m.content.toLowerCase().startsWith("b!tahmin") ||
                        m.content.toLowerCase().startsWith("b!sayitahmin")
                    ),
                time: 120000
            });

        collector.on("collect", async m => {
            const parts = m.content.trim().split(/\s+/);
            const guess = Number(parts[1]);

            if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
                return m.reply(
                    "❌ 1 ile 100 arasında bir sayı yaz."
                );
            }

            const game = games.get(userId);
            game.attempts++;

            if (guess === game.number) {
                games.delete(userId);
                collector.stop("won");

                return m.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("🎉 Doğru Tahmin!")
                            .setDescription(
                                `🎯 Sayı **${game.number}** idi!\n\n` +
                                `📊 Deneme sayın: **${game.attempts}**`
                            )
                            .setFooter({
                                text: "Bankai • Sayı Tahmin"
                            })
                    ]
                });
            }

            const hint =
                guess < game.number
                    ? "📈 Daha büyük bir sayı!"
                    : "📉 Daha küçük bir sayı!";

            return m.reply(
                `${hint} **${game.attempts}.** denemen.`
            );
        });

        collector.on("end", (_, reason) => {
            if (reason === "time") {
                games.delete(userId);
            }
        });
    }
};

