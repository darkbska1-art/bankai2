
const { EmbedBuilder } = require("discord.js");

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
];

const games = new Map();

const stages = [
    "🪢",
    "🪢\n🧍",
    "🪢\n🧍\n🪵",
    "🪢\n🧍\n🪵\n╱",
    "🪢\n🧍\n🪵\n╱ ╲",
    "🪢\n🧍\n🪵\n╱ ╲\n  ╲"
];

module.exports = {
    name: "adamasmaca",

    aliases: [
        "adam",
        "asmaca"
    ],

    description: "Adam asmaca oyunu oynarsın.",

    async execute(message, args) {
        const userId = message.author.id;

        if (games.has(userId)) {
            return message.reply(
                "❌ Zaten devam eden bir adam asmaca oyunun var!"
            );
        }

        const word =
            words[Math.floor(Math.random() * words.length)];

        const letters = [...new Set(word.split(""))];

        const game = {
            word,
            guessed: [],
            wrong: 0
        };

        games.set(userId, game);

        const getDisplay = () => {
            return word
                .split("")
                .map(letter =>
                    game.guessed.includes(letter)
                        ? letter
                        : "＿"
                )
                .join(" ");
        };

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🪢 Adam Asmaca")
            .setDescription(
                `${stages[0]}\n\n` +
                `**Kelime:** ${getDisplay()}\n\n` +
                `💡 Bir harf tahmin etmek için:\n` +
                `\`B!adamasmaca a\``
            )
            .addFields({
                name: "❌ Hatalı Tahmin",
                value: "0 / 5",
                inline: true
            })
            .setFooter({
                text: "Bankai • Adam Asmaca"
            });

        await message.reply({
            embeds: [embed]
        });

        const collector =
            message.channel.createMessageCollector({
                filter: m =>
                    m.author.id === userId &&
                    m.content.toLowerCase().startsWith("b!adamasmaca"),
                time: 120000
            });

        collector.on("collect", async m => {
            const letter = m.content
                .slice("b!adamasmaca".length)
                .trim()
                .toLocaleLowerCase("tr-TR");

            if (!/^[a-zçğıöşü]$/i.test(letter)) {
                return;
            }

            if (game.guessed.includes(letter)) {
                return m.reply("❌ Bu harfi zaten denedin.");
            }

            game.guessed.push(letter);

            if (!word.includes(letter)) {
                game.wrong++;
            }

            const won = [...new Set(word.split(""))]
                .every(x => game.guessed.includes(x));

            if (won) {
                games.delete(userId);
                collector.stop("won");

                return m.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("🎉 Kazandın!")
                            .setDescription(
                                `Kelime: **${word}**\n\n` +
                                `🪢 Hatalı tahmin: **${game.wrong}/5**`
                            )
                            .setFooter({
                                text: "Bankai • Adam Asmaca"
                            })
                    ]
                });
            }

            if (game.wrong >= 5) {
                games.delete(userId);
                collector.stop("lost");

                return m.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#000000")
                            .setTitle("😔 Oyun Bitti")
                            .setDescription(
                                `Kelime: **${word}**`
                            )
                            .setFooter({
                                text: "Bankai • Adam Asmaca"
                            })
                    ]
                });
            }

            const newEmbed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("🪢 Adam Asmaca")
                .setDescription(
                    `${stages[game.wrong]}\n\n` +
                    `**Kelime:** ${getDisplay()}`
                )
                .addFields({
                    name: "❌ Hatalı Tahmin",
                    value: `${game.wrong} / 5`,
                    inline: true
                })
                .setFooter({
                    text: "Bankai • Adam Asmaca"
                });

            await m.reply({
                embeds: [newEmbed]
            });
        });

        collector.on("end", (_, reason) => {
            if (reason === "time") {
                games.delete(userId);
            }
        });
    }
};

