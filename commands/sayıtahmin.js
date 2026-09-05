
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

        // Zaten oyun var mı?
        if (games.has(userId)) {
            const activeEmbed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("⚠️ Zaten Bir Oyunun Var!")
                .setDescription(
                    "Şu anda devam eden bir sayı tahmin oyunun bulunuyor.\n\n" +
                    "🎯 Tahmin yapmak için:\n" +
                    "`B!tahmin <sayı>`"
                )
                .setFooter({
                    text: "Bankai • Sayı Tahmin"
                })
                .setTimestamp();

            return message.reply({
                embeds: [activeEmbed]
            });
        }

        // 1-100 arası rastgele sayı
        const number = Math.floor(Math.random() * 100) + 1;

        games.set(userId, {
            number,
            attempts: 0,
            min: 1,
            max: 100
        });

        const startEmbed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🎯 SAYI TAHMİN")
            .setDescription(
                "Aklımdan **1 ile 100 arasında** bir sayı tuttum!\n\n" +
                "🎲 **Görevin:**\n" +
                "Tuttuğum sayıyı bulmaya çalış.\n\n" +
                "💬 **Tahmin yapmak için:**\n" +
                "`B!tahmin 50`\n\n" +
                "📌 **Kurallar:**\n" +
                "• 1-100 arasında sayı girmelisin\n" +
                "• Her yanlış tahminde ipucu vereceğim\n" +
                "• Oyunu tamamlamak için **2 dakikan var**"
            )
            .addFields(
                {
                    name: "🎯 Aralık",
                    value: "`1 - 100`",
                    inline: true
                },
                {
                    name: "📊 Deneme",
                    value: "`0`",
                    inline: true
                },
                {
                    name: "⏱️ Süre",
                    value: "`2 dakika`",
                    inline: true
                }
            )
            .setFooter({
                text: "Bankai • Sayı Tahmin"
            })
            .setTimestamp();

        await message.reply({
            embeds: [startEmbed]
        });

        // Collector
        const collector = message.channel.createMessageCollector({
            filter: m => {
                if (m.author.id !== userId) return false;

                const content = m.content.trim().toLowerCase();

                return (
                    content.startsWith("b!tahmin ") ||
                    content.startsWith("b!sayitahmin ") ||
                    content.startsWith("b!sayitahminet ")
                );
            },
            time: 120000
        });

        collector.on("collect", async m => {

            const game = games.get(userId);

            if (!game) {
                collector.stop("finished");
                return;
            }

            const parts = m.content.trim().split(/\s+/);

            const guess = Number(parts[1]);

            // Geçersiz sayı
            if (
                !Number.isInteger(guess) ||
                guess < 1 ||
                guess > 100
            ) {

                const errorEmbed = new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("❌ Geçersiz Tahmin")
                    .setDescription(
                        "Lütfen **1 ile 100 arasında** tam bir sayı gir.\n\n" +
                        "Örnek:\n" +
                        "`B!tahmin 50`"
                    )
                    .setFooter({
                        text: "Bankai • Sayı Tahmin"
                    });

                return m.reply({
                    embeds: [errorEmbed]
                });
            }

            game.attempts++;

            // Doğru tahmin
            if (guess === game.number) {

                games.delete(userId);
                collector.stop("won");

                const winEmbed = new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("🎉 TEBRİKLER!")
                    .setDescription(
                        `Tuttuğum sayı **${game.number}** idi!\n\n` +
                        `🏆 **${game.attempts} denemede** doğru tahmin ettin!`
                    )
                    .addFields(
                        {
                            name: "🎯 Bulduğun Sayı",
                            value: `\`${game.number}\``,
                            inline: true
                        },
                        {
                            name: "📊 Toplam Deneme",
                            value: `\`${game.attempts}\``,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Bankai • Sayı Tahmin"
                    })
                    .setTimestamp();

                return m.reply({
                    embeds: [winEmbed]
                });
            }

            // Aralığı daralt
            if (guess < game.number) {
                game.min = Math.max(game.min, guess + 1);
            } else {
                game.max = Math.min(game.max, guess - 1);
            }

            // İpucu
            const hint =
                guess < game.number
                    ? "📈 Daha **büyük** bir sayı!"
                    : "📉 Daha **küçük** bir sayı!";

            const hintEmbed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("🎯 Tahmin Sonucu")
                .setDescription(
                    `${hint}\n\n` +
                    `Tahminin: **${guess}**`
                )
                .addFields(
                    {
                        name: "📊 Deneme",
                        value: `\`${game.attempts}\``,
                        inline: true
                    },
                    {
                        name: "🔎 Yeni Aralık",
                        value: `\`${game.min} - ${game.max}\``,
                        inline: true
                    }
                )
                .setFooter({
                    text: "Bankai • Tahmin etmeye devam et!"
                })
                .setTimestamp();

            return m.reply({
                embeds: [hintEmbed]
            });
        });

        // Süre bitti
        collector.on("end", (_, reason) => {

            const game = games.get(userId);

            if (!game) return;

            if (reason === "time") {

                games.delete(userId);

                const timeoutEmbed = new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("⏰ Süre Doldu!")
                    .setDescription(
                        "Sayı tahmin oyununun süresi doldu.\n\n" +
                        `🎯 Tuttuğum sayı: **${game.number}**\n` +
                        `📊 Yaptığın deneme: **${game.attempts}**`
                    )
                    .setFooter({
                        text: "Bankai • Sayı Tahmin"
                    })
                    .setTimestamp();

                message.channel.send({
                    content: `<@${userId}>`,
                    embeds: [timeoutEmbed]
                });
            }
        });
    }
};
