const { EmbedBuilder } = require("discord.js");

/* =====================================================
   KELİMELER
===================================================== */

const words = [
    "discord",
    "anime",
    "manga",
    "bankai",
    "bleach",
    "naruto",
    "onepiece",
    "minecraft",
    "youtube",
    "bilgisayar",
    "telefon",
    "internet",
    "sunucu",
    "arkadas",
    "oyuncu",
    "valorant",
    "league",
    "fortnite",
    "csgo",
    "roblox",
    "programlama",
    "javascript",
    "python",
    "java",
    "html",
    "css",
    "discordjs",
    "bot",
    "komut",
    "sunucuyonetimi",
    "oyun",
    "animeci",
    "fansub",
    "çeviri",
    "japonya",
    "kahraman",
    "macera",
    "uzay",
    "savaşçı",
    "kılıç",
    "ejderha",
    "krallık",
    "dedektif",
    "hikaye",
    "arkadaşlık",
    "teknoloji",
    "yazılım",
    "geliştirici",
    "topluluk",
    "Uchiha Sasuke",
    "Hatake Kakashi",
    "Monkey D. Luffy",
    "Roronoa Zoro",
    "Naruto Uzumaki",
    "Sakura Haruno",
    "Sasuke Uchiha",
    "Aizen Sosuke",
    "Kuchiki Rukia",
    "Kurosaki Ichigo",
    "Renji Abarai",
    "Urahara Kisuke",
    "Yamamoto Genryusai",
    "Shanks",
    "Portgas D. Ace",
    "Trafalgar D. Water Law",
    "Nami",
    "Usopp",
    "Sanji",
    "Tony Tony Chopper",
    "Nico Robin",
    "Franky",
    "Brook",
    "Jinbe",
    "Vinsmoke Sanji",
    "Charlotte Katakuri",
    "denji",
    "power",
    "makima",
    "chainsawman",
    "aot",
    "eren",
];

/* =====================================================
   OYUNLAR
===================================================== */

const games = new Map();

/* =====================================================
   AYARLAR
===================================================== */

const MAX_WRONG = 5;
const GAME_TIME = 120000;

/* =====================================================
   ADAM ASMAMACA
===================================================== */

const stages = [
    "🪢",
    "🪢\n🧍",
    "🪢\n🧍\n🪵",
    "🪢\n🧍\n🪵\n╱",
    "🪢\n🧍\n🪵\n╱ ╲",
    "🪢\n🧍\n🪵\n╱ ╲\n  ╲"
];

/* =====================================================
   YARDIMCI FONKSİYONLAR
===================================================== */

function normalize(text) {
    return text
        .trim()
        .toLocaleLowerCase("tr-TR");
}

function getRandomWord() {
    return words[Math.floor(Math.random() * words.length)];
}

function getDisplay(game) {
    return game.word
        .split("")
        .map(letter =>
            game.guessed.includes(letter)
                ? letter.toUpperCase()
                : "＿"
        )
        .join(" ");
}

function getCorrectLetters(game) {
    const letters = game.guessed.filter(letter =>
        game.word.includes(letter)
    );

    return letters.length
        ? letters
            .map(x => `\`${x.toUpperCase()}\``)
            .join(" ")
        : "Yok";
}

function getWrongLetters(game) {
    const letters = game.guessed.filter(letter =>
        !game.word.includes(letter)
    );

    return letters.length
        ? letters
            .map(x => `\`${x.toUpperCase()}\``)
            .join(" ")
        : "Yok";
}

function getProgress(game) {
    const unique = [...new Set(game.word.split(""))];

    const found = unique.filter(letter =>
        game.guessed.includes(letter)
    );

    return Math.round(
        (found.length / unique.length) * 100
    );
}

function hasWon(game) {
    return [...new Set(game.word.split(""))]
        .every(letter =>
            game.guessed.includes(letter)
        );
}

/* =====================================================
   OYUN EMBED
===================================================== */

function createGameEmbed(game) {
    const progress = getProgress(game);

    return new EmbedBuilder()
        .setColor("#000000")
        .setTitle("🪢 Adam Asmaca")
        .setDescription(
            `${stages[game.wrong]}\n\n` +

            `## 🔤 Kelime\n` +
            `**${getDisplay(game)}**\n\n` +

            `📊 **İlerleme:** \`${progress}%\`\n\n` +

            `💡 **Harf tahmini:**\n` +
            `\`B!adamasmaca a\`\n\n` +

            `🧠 **Kelime tahmini:**\n` +
            `\`B!adamasmaca discord\`\n\n` +

            `🛑 **Oyunu iptal:**\n` +
            `\`B!adamasmaca iptal\``
        )
        .addFields(
            {
                name: "❌ Hatalı",
                value: `**${game.wrong} / ${MAX_WRONG}**`,
                inline: true
            },
            {
                name: "❤️ Kalan Hak",
                value: `**${MAX_WRONG - game.wrong}**`,
                inline: true
            },
            {
                name: "🎯 Toplam Tahmin",
                value: `**${game.guesses}**`,
                inline: true
            },
            {
                name: "✅ Doğru Harfler",
                value: getCorrectLetters(game),
                inline: false
            },
            {
                name: "❌ Hatalı Harfler",
                value: getWrongLetters(game),
                inline: false
            }
        )
        .setFooter({
            text: "Bankai • Adam Asmaca • 2 dakika"
        })
        .setTimestamp();
}

/* =====================================================
   KAZANMA EMBED
===================================================== */

function createWinEmbed(game) {
    return new EmbedBuilder()
        .setColor("#000000")
        .setTitle("🎉 Tebrikler, Kazandın!")
        .setDescription(
            `## 🏆 Kelimeyi Bildin!\n\n` +

            `🔤 **Kelime:** ` +
            `**${game.word.toUpperCase()}**\n\n` +

            `❌ **Hatalı tahmin:** ` +
            `**${game.wrong}/${MAX_WRONG}**\n` +

            `🎯 **Toplam tahmin:** ` +
            `**${game.guesses}**\n` +

            `📊 **İlerleme:** **100%**`
        )
        .addFields({
            name: "⭐ Performans",
            value:
                game.wrong === 0
                    ? "🔥 Kusursuz oyun!"
                    : game.wrong <= 2
                        ? "😎 Harika oynadın!"
                        : "👍 Son anda kurtardın!"
        })
        .setFooter({
            text: "Bankai • Adam Asmaca"
        })
        .setTimestamp();
}

/* =====================================================
   KAYBETME EMBED
===================================================== */

function createLoseEmbed(game) {
    return new EmbedBuilder()
        .setColor("#000000")
        .setTitle("💀 Oyun Bitti!")
        .setDescription(
            `Maalesef kelimeyi bulamadın.\n\n` +

            `🔤 **Doğru kelime:** ` +
            `**${game.word.toUpperCase()}**\n\n` +

            `❌ **Hatalı tahmin:** ` +
            `**${game.wrong}/${MAX_WRONG}**\n` +

            `🎯 **Toplam tahmin:** ` +
            `**${game.guesses}**`
        )
        .setFooter({
            text: "Bankai • Adam Asmaca"
        })
        .setTimestamp();
}

/* =====================================================
   KOMUT
===================================================== */

module.exports = {
    name: "adamasmaca",

    aliases: [
        "adam",
        "asmaca"
    ],

    description:
        "Gelişmiş adam asmaca oyunu oynarsın.",

    async execute(message, args) {

        const userId = message.author.id;

        /* =================================================
           AKTİF OYUN VARSA
        ================================================= */

        if (games.has(userId)) {

            const game = games.get(userId);

            /* =============================================
               İPTAL
            ============================================= */

            if (
                args[0] &&
                normalize(args[0]) === "iptal"
            ) {

                clearTimeout(game.timeout);

                games.delete(userId);

                return message.reply(
                    "🛑 **Adam asmaca oyunun iptal edildi.**"
                );
            }

            /* =============================================
               BOŞ TAHMİN
            ============================================= */

            if (!args.length) {
                return message.reply(
                    "❌ Zaten devam eden bir adam asmaca oyunun var!\n\n" +
                    "💡 Harf tahmini:\n" +
                    "`B!adamasmaca a`\n\n" +
                    "🧠 Kelime tahmini:\n" +
                    "`B!adamasmaca discord`\n\n" +
                    "🛑 İptal:\n" +
                    "`B!adamasmaca iptal`"
                );
            }

            /* =============================================
               TAHMİNİ AL
            ============================================= */

            const guess = normalize(
                args.join(" ")
            );

            /* =============================================
               KELİME TAHMİNİ
            ============================================= */

            if (guess.length > 1) {

                game.guesses++;

                /* DOĞRU */

                if (guess === game.word) {

                    clearTimeout(game.timeout);

                    games.delete(userId);

                    return message.reply({
                        embeds: [
                            createWinEmbed(game)
                        ]
                    });
                }

                /* YANLIŞ */

                game.wrong++;

                if (game.wrong >= MAX_WRONG) {

                    clearTimeout(game.timeout);

                    games.delete(userId);

                    return message.reply({
                        embeds: [
                            createLoseEmbed(game)
                        ]
                    });
                }

                await game.message.edit({
                    embeds: [
                        createGameEmbed(game)
                    ]
                });

                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                           .setColor("#000000")
                            .setTitle("❌ Yanlış Kelime!")
                            .setDescription(
                                `**${guess}** doğru kelime değil.\n\n` +
                                `❤️ Kalan hak: **${MAX_WRONG - game.wrong}**`
                            )
                            .setFooter({
                                text: "Bankai • Adam Asmaca"
                            })
                    ]
                });
            }

            /* =============================================
               HARF TAHMİNİ
            ============================================= */

            if (!/^[a-zçğıöşü]$/i.test(guess)) {

                return message.reply(
                    "❌ Geçerli bir harf gir.\n\n" +
                    "Örnek:\n" +
                    "`B!adamasmaca a`"
                );
            }

            /* =============================================
               AYNI HARF
            ============================================= */

            if (game.guessed.includes(guess)) {

                return message.reply(
                    `❌ **${guess.toUpperCase()}** harfini zaten denedin.`
                );
            }

            /* =============================================
               HARFİ EKLE
            ============================================= */

            game.guessed.push(guess);
            game.guesses++;

            /* =============================================
               YANLIŞ HARF
            ============================================= */

            if (!game.word.includes(guess)) {
                game.wrong++;
            }

            /* =============================================
               KAZANDI
            ============================================= */

            if (hasWon(game)) {

                clearTimeout(game.timeout);

                games.delete(userId);

                return message.reply({
                    embeds: [
                        createWinEmbed(game)
                    ]
                });
            }

            /* =============================================
               KAYBETTİ
            ============================================= */

            if (game.wrong >= MAX_WRONG) {

                clearTimeout(game.timeout);

                games.delete(userId);

                return message.reply({
                    embeds: [
                        createLoseEmbed(game)
                    ]
                });
            }

            /* =============================================
               OYUN MESAJINI GÜNCELLE
            ============================================= */

            await game.message.edit({
                embeds: [
                    createGameEmbed(game)
                ]
            });

            return;
        }

        /* =================================================
           YENİ OYUN
        ================================================= */

        const word = getRandomWord();

        const game = {
            word,
            guessed: [],
            wrong: 0,
            guesses: 0,
            message: null,
            timeout: null
        };

        games.set(userId, game);

        /* =================================================
           OYUN MESAJI
        ================================================= */

        const sentMessage = await message.reply({
            embeds: [
                createGameEmbed(game)
            ]
        });

        game.message = sentMessage;

        /* =================================================
           2 DAKİKA SÜRE
        ================================================= */

        game.timeout = setTimeout(async () => {

            if (!games.has(userId)) {
                return;
            }

            games.delete(userId);

            try {

                await sentMessage.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("⏰ Süre Doldu!")
                            .setDescription(
                                `Adam asmaca oyununun süresi doldu.\n\n` +
                                `🔤 **Kelime:** ` +
                                `**${word.toUpperCase()}**\n\n` +
                                `🎯 **Toplam tahmin:** ` +
                                `**${game.guesses}**`
                            )
                            .setFooter({
                                text: "Bankai • Adam Asmaca"
                            })
                            .setTimestamp()
                    ]
                });

            } catch (error) {

                console.error(
                    "Adam asmaca süre hatası:",
                    error
                );

            }

        }, GAME_TIME);
    }
};