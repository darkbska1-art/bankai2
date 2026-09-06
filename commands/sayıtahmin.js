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

        // =====================================================
        // MEVCUT OYUN VARSA
        // =====================================================

        if (games.has(userId)) {

            const game = games.get(userId);

            // Sayı girilmemişse mevcut oyunu göster
            if (!args[0]) {

                const embed = new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("🎯 Devam Eden Sayı Tahmini")
                    .setDescription(
                        "Zaten devam eden bir sayı tahmin oyunun var!\n\n" +
                        "🎯 **Tahmin yapmak için:**\n" +
                        "`B!tahmin <sayı>`\n\n" +
                        `🔎 **Mevcut aralık:** \`${game.min} - ${game.max}\`\n` +
                        `📊 **Deneme:** \`${game.attempts}\``
                    )
                    .setFooter({
                        text: "Bankai • Sayı Tahmin"
                    })
                    .setTimestamp();

                return message.reply({
                    embeds: [embed]
                });
            }

            // =================================================
            // TAHMİNİ AL
            // =================================================

            const guess = Number(args[0]);

            // Geçersiz sayı
            if (
                !Number.isInteger(guess) ||
                guess < game.min ||
                guess > game.max
            ) {

                const embed = new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("❌ Geçersiz Tahmin")
                    .setDescription(
                        `Lütfen **${game.min} ile ${game.max} arasında** bir sayı gir.\n\n` +
                        "Örnek:\n" +
                        "`B!tahmin 50`"
                    )
                    .setFooter({
                        text: "Bankai • Sayı Tahmin"
                    })
                    .setTimestamp();

                return message.reply({
                    embeds: [embed]
                });
            }

            game.attempts++;

            // =================================================
            // DOĞRU
            // =================================================

            if (guess === game.number) {

                games.delete(userId);

                const embed = new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("🎉 TEBRİKLER!")
                    .setDescription(
                        `Tuttuğum sayı **${game.number}** idi!\n\n` +
                        `🏆 Sayıyı **${game.attempts} denemede** buldun!`
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

                return message.reply({
                    embeds: [embed]
                });
            }

            // =================================================
            // YANLIŞ TAHMİN
            // =================================================

            if (guess < game.number) {

                game.min = Math.max(
                    game.min,
                    guess + 1
                );

            } else {

                game.max = Math.min(
                    game.max,
                    guess - 1
                );
            }

            // =================================================
            // İPUCU
            // =================================================

            const hint =
                guess < game.number
                    ? "📈 Daha **büyük** bir sayı!"
                    : "📉 Daha **küçük** bir sayı!";

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🎯 Tahmin Sonucu")
                .setDescription(
                    `${hint}\n\n` +
                    `🎲 Tahminin: **${guess}**\n\n` +
                    `🔎 Yeni aralık: **${game.min} - ${game.max}**`
                )
                .addFields(
                    {
                        name: "📊 Deneme",
                        value: `\`${game.attempts}\``,
                        inline: true
                    },
                    {
                        name: "🎯 Devam Et",
                        value: "`B!tahmin <sayı>`",
                        inline: true
                    }
                )
                .setFooter({
                    text: "Bankai • Tahmin etmeye devam et!"
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // =====================================================
        // YENİ OYUN
        // =====================================================

        const number = Math.floor(
            Math.random() * 100
        ) + 1;

        games.set(userId, {
            number,
            attempts: 0,
            min: 1,
            max: 100
        });

        const startEmbed = new EmbedBuilder()
            .setColor(0x000000)
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
                "• Aralık her tahminde daralacak\n" +
                "• Oyunun **2 dakika** süresi var"
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

        // =====================================================
        // 2 DAKİKA SONRA OYUNU KAPAT
        // =====================================================

        setTimeout(() => {

            const game = games.get(userId);

            if (!game) return;

            games.delete(userId);

            const timeoutEmbed = new EmbedBuilder()
                .setColor(0x000000)
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
            }).catch(() => {});

        }, 120000);
    }
};