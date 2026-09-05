
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
    "sunucu",
    "topluluk"
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
   ADAM ASMA AŞAMALARI
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
   TÜRKÇE HARF KONTROLÜ
===================================================== */

const validLetter = /^[a-zçğıöşü]$/i;

/* =====================================================
   NORMALİZE
===================================================== */

function normalize(text) {
    return text
        .trim()
        .toLocaleLowerCase("tr-TR");
}

/* =====================================================
   RASTGELE KELİME
===================================================== */

function getRandomWord() {
    return words[
        Math.floor(Math.random() * words.length)
    ];
}

/* =====================================================
   GÖRÜNEN KELİME
===================================================== */

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

/* =====================================================
   DOĞRU HARFLER
===================================================== */

function getCorrectLetters(game) {
    const correct = game.guessed.filter(letter =>
        game.word.includes(letter)
    );

    return correct.length
        ? correct.map(x => `\`${x.toUpperCase()}\``).join(" ")
        : "Yok";
}

/* =====================================================
   HATALI HARFLER
===================================================== */

function getWrongLetters(game) {
    const wrong = game.guessed.filter(letter =>
        !game.word.includes(letter)
    );

    return wrong.length
        ? wrong.map(x => `\`${x.toUpperCase()}\``).join(" ")
        : "Yok";
}

/* =====================================================
   İLERLEME
===================================================== */

function getProgress(game) {
    const uniqueLetters = [...new Set(game.word.split(""))];

    const found = uniqueLetters.filter(letter =>
        game.guessed.includes(letter)
    );

    return Math.round(
        (found.length / uniqueLetters.length) * 100
    );
}

/* =====================================================
   KAZANMA KONTROLÜ
===================================================== */

function hasWon(game) {
    return [...new Set(game.word.split(""))]
        .every(letter =>
            game.guessed.includes(letter)
        );
}

/* =====================================================
   EMBED OLUŞTUR
===================================================== */

function createGameEmbed(game) {
    const progress = getProgress(game);

    return new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🪢 Adam Asmaca")
        .setDescription(
            `${stages[game.wrong]}\n\n` +
            `## 🔤 Kelime\n` +
            `**${getDisplay(game)}**\n\n` +
            `📊 **İlerleme:** \`${progress}%\`\n\n` +
            `💡 **Harf tahmini:**\n` +
            `\`B!adamasmaca a\`\n\n` +
            `🧠 **Kelime tahmini:**\n` +
            `\`B!adamasmaca discord\``
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
                name: "🎯 Tahmin",
                value: `**${game.guessed.length}**`,
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
   SONUÇ EMBED
===================================================== */

function createResultEmbed(game, won) {
    if (won) {
        return new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("🎉 Tebrikler, Kazandın!")
            .setDescription(
                `## 🏆 Kelimeyi Bildin!\n\n` +
                `🔤 Kelime: **${game.word.toUpperCase()}**\n\n` +
                `❌ Hatalı tahmin: **${game.wrong}/${MAX_WRONG}**\n` +
                `🎯 Toplam tahmin: **${game.guessed.length}**\n` +
                `📊 İlerleme: **100%**`
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

    return new EmbedBuilder()
        .setColor("#ED4245")
        .setTitle("💀 Oyun Bitti!")
        .setDescription(
            `Maalesef kelimeyi bulamadın.\n\n` +
            `🔤 Doğru kelime: **${game.word.toUpperCase()}**\n\n` +
            `❌ Hatalı tahmin: **${game.wrong}/${MAX_WRONG}**\n` +
            `🎯 Toplam tahmin: **${game.guessed.length}**`
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
           İPTAL
        ================================================= */

        if (args[0]?.toLowerCase() === "iptal") {

            if (!games.has(userId)) {
                return message.reply(
                    "❌ Aktif bir adam asmaca oyunun yok."
                );
            }

            const game = games.get(userId);

            game.collector?.stop("cancelled");

            games.delete(userId);

            return message.reply(
                "🛑 **Adam asmaca oyunun iptal edildi.**"
            );
        }

        /* =================================================
           AKTİF OYUN KONTROLÜ
        ================================================= */

        if (games.has(userId)) {

            return message.reply(
                "❌ Zaten devam eden bir adam asmaca oyunun var!\n\n" +
                "🛑 Oyunu bitirmek için:\n" +
                "`B!adamasmaca iptal`"
            );
        }

        /* =================================================
           KELİME
        ================================================= */

        const word = getRandomWord();

        const game = {
            word,
            guessed: [],
            wrong: 0,
            startedAt: Date.now(),
            collector: null
        };

        games.set(userId, game);

        /* =================================================
           BAŞLANGIÇ MESAJI
        ================================================= */

        const gameMessage = await message.reply({
            embeds: [
                createGameEmbed(game)
            ]
        });

        /* =================================================
           COLLECTOR
        ================================================= */

        const collector =
            message.channel.createMessageCollector({

                filter: m =>
                    m.author.id === userId &&
                    /^b!adamasmaca\b/i.test(
                        m.content.trim()
                    ),

                time: GAME_TIME
            });

        game.collector = collector;

        /* =================================================
           TAHMİN
        ================================================= */

        collector.on("collect", async m => {

            try {

                const input = m.content
                    .replace(
                        /^b!adamasmaca\b/i,
                        ""
                    )
                    .trim();

                const guess = normalize(input);

                /* =============================================
                   BOŞ GİRDİ
                ============================================= */

                if (!guess) {
                    return m.reply(
                        "💡 Bir **harf** veya **kelime** yazmalısın."
                    );
                }

                /* =============================================
                   KELİME TAHMİNİ
                ============================================= */

                if (guess.length > 1) {

                    if (guess === game.word) {

                        games.delete(userId);

                        collector.stop("won");

                        return m.reply({
                            embeds: [
                                createResultEmbed(
                                    game,
                                    true
                                )
                            ]
                        });
                    }

                    game.wrong++;

                    if (game.wrong >= MAX_WRONG) {

                        games.delete(userId);

                        collector.stop("lost");

                        return m.reply({
                            embeds: [
                                createResultEmbed(
                                    game,
                                    false
                                )
                            ]
                        });
                    }

                    return m.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#ED4245")
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
                   HARF KONTROLÜ
                ============================================= */

                if (!validLetter.test(guess)) {

                    return m.reply(
                        "❌ Geçerli bir harf gir.\n" +
                        "Örnek: `B!adamasmaca a`"
                    );
                }

                /* =============================================
                   AYNI HARF
                ============================================= */

                if (game.guessed.includes(guess)) {

                    return m.reply(
                        `❌ **${guess.toUpperCase()}** harfini zaten denedin.`
                    );
                }

                /* =============================================
                   HARF EKLE
                ============================================= */

                game.guessed.push(guess);

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

                    games.delete(userId);

                    collector.stop("won");

                    return m.reply({
                        embeds: [
                            createResultEmbed(
                                game,
                                true
                            )
                        ]
                    });
                }

                /* =============================================
                   KAYBETTİ
                ============================================= */

                if (game.wrong >= MAX_WRONG) {

                    games.delete(userId);

                    collector.stop("lost");

                    return m.reply({
                        embeds: [
                            createResultEmbed(
                                game,
                                false
                            )
                        ]
                    });
                }

                /* =============================================
                   OYUNU GÜNCELLE
                ============================================= */

                await gameMessage.edit({
                    embeds: [
                        createGameEmbed(game)
                    ]
                });

            } catch (error) {

                console.error(
                    "Adam asmaca hatası:",
                    error
                );

            }

        });

        /* =================================================
           SÜRE BİTTİ / OYUN SONLANDI
        ================================================= */

        collector.on("end", async (_, reason) => {

            if (reason === "time") {

                if (!games.has(userId)) {
                    return;
                }

                games.delete(userId);

                return message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#FAA61A")
                            .setTitle("⏰ Süre Doldu!")
                            .setDescription(
                                `${message.author}, adam asmaca oyununun süresi doldu.\n\n` +
                                `🔤 Kelime: **${game.word.toUpperCase()}**`
                            )
                            .setFooter({
                                text: "Bankai • Adam Asmaca"
                            })
                            .setTimestamp()
                    ]
                });
            }

        });
    }
};

