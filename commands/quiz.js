const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

// =====================================================
// 🧠 QUIZ SORULARI
// =====================================================

const questions = [
    {
        question: "Bleach'te Ichigo'nun Zanpakutō'sunun adı nedir?",
        options: [
            "Senbonzakura",
            "Zangetsu",
            "Hyōrinmaru",
            "Zabimaru"
        ],
        answer: 1
    },
    {
        question: "Naruto'nun köyünün adı nedir?",
        options: [
            "Sunagakure",
            "Kirigakure",
            "Konohagakure",
            "Iwagakure"
        ],
        answer: 2
    },
    {
        question: "One Piece'in ana karakteri kimdir?",
        options: [
            "Roronoa Zoro",
            "Sanji",
            "Monkey D. Luffy",
            "Portgas D. Ace"
        ],
        answer: 2
    },
    {
        question: "Dragon Ball'da Goku'nun Saiyan adı nedir?",
        options: [
            "Kakarot",
            "Vegeta",
            "Broly",
            "Raditz"
        ],
        answer: 0
    },
    {
        question: "Death Note'u kullanan ana karakter kimdir?",
        options: [
            "L",
            "Light Yagami",
            "Near",
            "Mello"
        ],
        answer: 1
    },
    {
        question: "Demon Slayer'da Tanjiro'nun kız kardeşinin adı nedir?",
        options: [
            "Shinobu",
            "Mitsuri",
            "Nezuko",
            "Kanae"
        ],
        answer: 2
    },
    {
        question: "Jujutsu Kaisen'de Yuji Itadori'nin içinde kim bulunur?",
        options: [
            "Gojo",
            "Sukuna",
            "Toji",
            "Mahito"
        ],
        answer: 1
    },
    {
        question: "Attack on Titan'da Eren'in soyadı nedir?",
        options: [
            "Ackerman",
            "Arlert",
            "Yeager",
            "Reiss"
        ],
        answer: 2
    },
    {
        question: "My Hero Academia'nın ana karakteri kimdir?",
        options: [
            "Katsuki Bakugo",
            "Izuku Midoriya",
            "Shoto Todoroki",
            "All Might"
        ],
        answer: 1
    },
    {
        question: "Hunter x Hunter'da Gon'un soyadı nedir?",
        options: [
            "Freecss",
            "Zoldyck",
            "Kurta",
            "Netero"
        ],
        answer: 0
    }
];

// =====================================================
// AKTİF QUIZLER
// =====================================================

const activeQuizzes = new Map();

// =====================================================
// KOMUT
// =====================================================

module.exports = {
    name: "quiz",
    aliases: ["bilgi", "test"],

    async execute(message) {

        if (!message.guild) return;

        // Aynı kanalda aktif quiz varsa engelle
        if (activeQuizzes.has(message.channel.id)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "🧠 Bu kanalda zaten aktif bir quiz var!"
                        )
                ]
            });
        }

        // Rastgele soru seç
        const quiz =
            questions[
                Math.floor(Math.random() * questions.length)
            ];

        const quizId =
            `${message.guild.id}_${message.channel.id}_${Date.now()}`;

        const buttons = quiz.options.map((option, index) => {

            return new ButtonBuilder()
                .setCustomId(
                    `quiz_${quizId}_${index}`
                )
                .setLabel(
                    `${String.fromCharCode(65 + index)}) ${option}`
                )
                .setStyle(ButtonStyle.Secondary);
        });

        const row = new ActionRowBuilder()
            .addComponents(buttons);

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🧠 Bankai Quiz")
            .setDescription(
                `❓ **${quiz.question}**\n\n` +
                `⏱️ Cevaplamak için **20 saniyen** var!\n` +
                `🎯 Doğru cevabı seç.`
            )
            .setFooter({
                text: "Bankai Quiz • İyi şanslar!"
            });

        const quizMessage =
            await message.channel.send({
                embeds: [embed],
                components: [row]
            });

        activeQuizzes.set(message.channel.id, {
            id: quizId,
            question: quiz,
            messageId: quizMessage.id,
            answered: false
        });

        // 20 saniye sonra quiz kapanır
        setTimeout(async () => {

            const active =
                activeQuizzes.get(message.channel.id);

            if (!active || active.id !== quizId) return;

            activeQuizzes.delete(message.channel.id);

            const disabledButtons =
                quiz.options.map((option, index) => {

                    const button =
                        new ButtonBuilder()
                            .setCustomId(
                                `quiz_${quizId}_${index}`
                            )
                            .setLabel(
                                `${String.fromCharCode(65 + index)}) ${option}`
                            )
                            .setStyle(
                                index === quiz.answer
                                    ? ButtonStyle.Success
                                    : ButtonStyle.Secondary
                            )
                            .setDisabled(true);

                    return button;
                });

            const disabledRow =
                new ActionRowBuilder()
                    .addComponents(disabledButtons);

            const timeoutEmbed =
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("⏰ Quiz Süresi Doldu!")
                    .setDescription(
                        `❓ **${quiz.question}**\n\n` +
                        `⏰ Süre doldu!\n\n` +
                        `✅ **Doğru cevap:** ${String.fromCharCode(65 + quiz.answer)}) ${quiz.options[quiz.answer]}`
                    )
                    .setFooter({
                        text: "Bankai Quiz"
                    });

            await quizMessage.edit({
                embeds: [timeoutEmbed],
                components: [disabledRow]
            }).catch(() => {});

        }, 20 * 1000);
    },

    activeQuizzes
};