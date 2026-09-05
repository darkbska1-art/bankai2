const {
    EmbedBuilder
} = require("discord.js");

// =====================================================
// 🧠 SORULAR
// =====================================================

const questions = [

    // =========================
    // 🧮 MATEMATİK
    // =========================

    {
        question: "12 + 18 kaçtır?",
        answers: ["30"]
    },
    {
        question: "7 × 8 kaçtır?",
        answers: ["56"]
    },
    {
        question: "100 / 4 kaçtır?",
        answers: ["25"]
    },
    {
        question: "15 × 3 kaçtır?",
        answers: ["45"]
    },
    {
        question: "144'ün karekökü kaçtır?",
        answers: ["12"]
    },
    {
        question: "9 × 9 kaçtır?",
        answers: ["81"]
    },
    {
        question: "50'nin %20'si kaçtır?",
        answers: ["10"]
    },
    {
        question: "2'nin 5. kuvveti kaçtır?",
        answers: ["32"]
    },
    {
        question: "200 - 75 kaçtır?",
        answers: ["125"]
    },
    {
        question: "11 × 11 kaçtır?",
        answers: ["121"]
    },

    // =========================
    // 🌍 GENEL KÜLTÜR
    // =========================

    {
        question: "Türkiye'nin başkenti neresidir?",
        answers: ["ankara"]
    },
    {
        question: "Türkiye'nin para birimi nedir?",
        answers: ["türk lirası", "tl", "lira"]
    },
    {
        question: "Bir yılda kaç ay vardır?",
        answers: ["12", "on iki"]
    },
    {
        question: "Bir haftada kaç gün vardır?",
        answers: ["7", "yedi"]
    },
    {
        question: "Dünya'nın doğal uydusunun adı nedir?",
        answers: ["ay"]
    },
    {
        question: "Japonya'nın başkenti neresidir?",
        answers: ["tokyo"]
    },
    {
        question: "Fransa'nın başkenti neresidir?",
        answers: ["paris"]
    },
    {
        question: "İtalya'nın başkenti neresidir?",
        answers: ["roma"]
    },
    {
        question: "Almanya'nın başkenti neresidir?",
        answers: ["berlin"]
    },
    {
        question: "İngiltere'nin başkenti neresidir?",
        answers: ["londra"]
    },
    {
        question: "Dünyanın en büyük okyanusu hangisidir?",
        answers: ["pasifik", "pasifik okyanusu"]
    },
    {
        question: "Mısır'ın başkenti neresidir?",
        answers: ["kahire"]
    },
    {
        question: "İspanya'nın başkenti neresidir?",
        answers: ["madrid"]
    },

    // =========================
    // 🔬 BİLİM
    // =========================

    {
        question: "Su kaç °C'de donar?",
        answers: ["0", "0 derece"]
    },
    {
        question: "Su kaç °C'de kaynar?",
        answers: ["100", "100 derece"]
    },
    {
        question: "Dünya'nın Güneş etrafındaki bir turu yaklaşık kaç gündür?",
        answers: ["365", "365 gün"]
    },
    {
        question: "İnsan vücudunda kanı pompalayan organ hangisidir?",
        answers: ["kalp"]
    },
    {
        question: "Bitkilerin fotosentez yapmasını sağlayan pigment nedir?",
        answers: ["klorofil"]
    },
    {
        question: "Dünya'nın en yakın yıldızı hangisidir?",
        answers: ["güneş"]
    },
    {
        question: "İnsanlarda kaç kromozom çifti vardır?",
        answers: ["23", "yirmi üç"]
    },
    {
        question: "Hangi gezegen Kızıl Gezegen olarak bilinir?",
        answers: ["mars"]
    },
    {
        question: "Güneş sisteminin en büyük gezegeni hangisidir?",
        answers: ["jüpiter"]
    },
    {
        question: "Dünya'nın şekli yaklaşık olarak nasıldır?",
        answers: ["küre", "geoit"]
    },

    // =========================
    // 💻 TEKNOLOJİ
    // =========================

    {
        question: "HTML'nin açılımındaki 'H' neyi ifade eder?",
        answers: ["hyper"]
    },
    {
        question: "JavaScript'in dosya uzantısı nedir?",
        answers: [".js", "js"]
    },
    {
        question: "Discord hangi tür platformdur?",
        answers: ["iletişim", "sohbet", "chat", "iletişim platformu"]
    },
    {
        question: "CPU'nun açılımı nedir?",
        answers: ["central processing unit"]
    },
    {
        question: "RAM ne tür bir bellektir?",
        answers: ["geçici", "geçici bellek"]
    },
    {
        question: "CSS ne için kullanılır?",
        answers: ["stil", "tasarım", "stil verme"]
    },
    {
        question: "Node.js hangi dil üzerine kuruludur?",
        answers: ["javascript"]
    },
    {
        question: "GitHub en çok ne için kullanılır?",
        answers: ["kod", "kod paylaşımı", "yazılım"]
    },

    // =========================
    // 🎮 OYUN
    // =========================

    {
        question: "Minecraft'ın geliştiricisi hangi şirkettir?",
        answers: ["mojang", "mojang studios"]
    },
    {
        question: "Minecraft'ta Ender Dragon hangi boyutta bulunur?",
        answers: ["end"]
    },
    {
        question: "Minecraft'ta elmas hangi tür kaynaktır?",
        answers: ["maden", "cevher"]
    },
    {
        question: "Among Us'ta oyuncuların görevi nedir?",
        answers: ["görev yapmak", "task yapmak", "task"]
    },
    {
        question: "Tetris'te parçalar neyin içine düşer?",
        answers: ["alan", "tahta", "oyun alanı"]
    },
    {
        question: "Super Mario'nun ana karakterinin adı nedir?",
        answers: ["mario"]
    },
    {
        question: "Pokémon serisindeki elektrik türü Pokémon'un en bilinen örneği nedir?",
        answers: ["pikachu"]
    },
    {
        question: "Fortnite hangi tür oyunlardan biridir?",
        answers: ["battle royale"]
    },

    // =========================
    // 🍥 ANİME
    // =========================

    {
        question: "Naruto'nun ana karakterinin adı nedir?",
        answers: ["naruto", "naruto uzumaki"]
    },
    {
        question: "Bleach'in ana karakteri kimdir?",
        answers: ["ichigo", "ichigo kurosaki"]
    },
    {
        question: "One Piece'in ana karakteri kimdir?",
        answers: ["luffy", "monkey d luffy", "monkey d. luffy"]
    },
    {
        question: "Dragon Ball'daki ana karakter kimdir?",
        answers: ["goku", "son goku"]
    },
    {
        question: "Death Note'taki ana karakterin adı nedir?",
        answers: ["light", "light yagami"]
    },
    {
        question: "Demon Slayer'ın ana karakteri kimdir?",
        answers: ["tanjiro", "tanjiro kamado"]
    },
    {
        question: "Jujutsu Kaisen'in ana karakteri kimdir?",
        answers: ["yuji", "yuji itadori"]
    },
    {
        question: "Attack on Titan'ın ana karakterlerinden biri kimdir?",
        answers: ["eren", "eren yeager", "eren jaeger"]
    },
    {
        question: "Bleach'te Ichigo'nun Zanpakuto'sunun adı nedir?",
        answers: ["zangetsu"]
    },
    {
        question: "Naruto'daki Dokuz Kuyruklu'nun adı nedir?",
        answers: ["kurama"]
    },
    {
        question: "One Piece'te Luffy'nin hayali nedir?",
        answers: ["korsanlar kralı olmak", "korsanlar kralı"]
    },
    {
        question: "Demon Slayer'da Tanjiro'nun kız kardeşinin adı nedir?",
        answers: ["nezuko", "nezuko kamado"]
    },

    // =========================
    // 📚 KARIŞIK
    // =========================

    {
        question: "Bir saatte kaç dakika vardır?",
        answers: ["60", "altmış"]
    },
    {
        question: "Bir dakikada kaç saniye vardır?",
        answers: ["60", "altmış"]
    },
    {
        question: "Alfabenin ilk harfi nedir?",
        answers: ["a"]
    },
    {
        question: "Alfabenin son harfi nedir?",
        answers: ["z"]
    },
    {
        question: "Gökkuşağında kaç renk vardır?",
        answers: ["7", "yedi"]
    },
    {
        question: "Dünyanın en büyük kıtası hangisidir?",
        answers: ["asya"]
    },
    {
        question: "Türkiye hangi iki kıta üzerinde bulunur?",
        answers: ["asya ve avrupa", "asya avrupa", "avrupa asya"]
    },
    {
        question: "Satrançta kaç taş bulunur?",
        answers: ["32", "otuz iki"]
    },
    {
        question: "Satrançta şahın yanında bulunan taşlardan biri hangisidir?",
        answers: ["vezir", "kale", "fil", "at"]
    },
    {
        question: "Bir üçgenin kaç kenarı vardır?",
        answers: ["3", "üç"]
    },
    {
        question: "Bir karenin kaç kenarı vardır?",
        answers: ["4", "dört"]
    },
    {
        question: "Bir düzinede kaç tane vardır?",
        answers: ["12", "on iki"]
    }
];

// =====================================================
// 🎮 AKTİF OYUNLAR
// =====================================================

const activeGames = new Map();

// =====================================================
// 📊 İSTATİSTİK
// =====================================================

const statistics = new Map();

function getStats(userId) {

    if (!statistics.has(userId)) {
        statistics.set(userId, {
            wins: 0,
            games: 0
        });
    }

    return statistics.get(userId);
}

// =====================================================
// 🔤 CEVABI TEMİZLE
// =====================================================

function normalizeAnswer(text) {

    return text
        .toLocaleLowerCase("tr-TR")
        .trim()
        .replace(/[.,!?;:'"`]/g, "")
        .replace(/\s+/g, " ");
}

// =====================================================
// 🎯 KOMUT
// =====================================================

module.exports = {

    name: "hızlıcevap",

    aliases: [
        "hizlicevap",
        "hizli",
        "quickanswer"
    ],

    description: "Hızlı cevap oyununu başlatır.",

    async execute(message) {

        // =========================
        // 🚫 AKTİF OYUN KONTROLÜ
        // =========================

        if (activeGames.has(message.channel.id)) {

            return message.reply({
                content:
                    "❌ Bu kanalda zaten bir **Hızlı Cevap** oyunu devam ediyor!"
            });
        }

        // =========================
        // 🎲 RASTGELE SORU
        // =========================

        const selected =
            questions[
                Math.floor(
                    Math.random() * questions.length
                )
            ];

        const gameId =
            `${message.channel.id}-${Date.now()}`;

        // =========================
        // 📊 OYUNU KAYDET
        // =========================

        activeGames.set(
            message.channel.id,
            {
                gameId,
                question: selected,
                startedAt: Date.now()
            }
        );

        // =========================
        // 🧠 SORU EMBED
        // =========================

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("⚡ Hızlı Cevap")
            .setDescription(
                `🧠 **Soru**\n\n` +
                `> ${selected.question}\n\n` +
                `⏱️ **10 saniyen var!**\n` +
                `🏆 İlk doğru cevap veren kazanır!\n\n` +
                `💡 Cevabını aşağıya yaz.`
            )
            .setFooter({
                text:
                    `Bankai • ${questions.length} farklı soru`
            })
            .setTimestamp();

        const gameMessage =
            await message.channel.send({
                embeds: [embed]
            });

        // =========================
        // 🎯 CEVAP FİLTRESİ
        // =========================

        const filter = msg => {

            if (msg.author.bot) {
                return false;
            }

            const answer =
                normalizeAnswer(msg.content);

            return selected.answers.some(
                correctAnswer =>
                    normalizeAnswer(correctAnswer) === answer
            );
        };

        // =========================
        // ⏱️ CEVAP BEKLE
        // =========================

        try {

            const collected =
                await message.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 10000,
                    errors: ["time"]
                });

            const winner =
                collected.first();

            // =========================
            // 🧹 OYUNU SİL
            // =========================

            activeGames.delete(
                message.channel.id
            );

            // =========================
            // 📊 İSTATİSTİK
            // =========================

            const stats =
                getStats(winner.author.id);

            stats.games++;
            stats.wins++;

            const elapsed =
                ((Date.now() -
                    activeGames.get?.(message.channel.id)?.startedAt ||
                    0) / 1000);

            // =========================
            // 🏆 KAZANAN
            // =========================

            const winEmbed =
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("🏆 Hızlı Cevap • Kazanan!")
                    .setDescription(
                        `🎉 **Doğru cevap!**\n\n` +
                        `👤 **Kazanan:** ${winner.author}\n` +
                        `💬 **Cevap:** \`${winner.content}\`\n\n` +
                        `⚡ **Tebrikler!**`
                    )
                    .addFields(
                        {
                            name: "📊 Oyuncu İstatistiği",
                            value:
                                `🏆 Kazanılan: **${stats.wins}**\n` +
                                `🎮 Oynanan: **${stats.games}**`,
                            inline: true
                        },
                        {
                            name: "🧠 Soru",
                            value:
                                selected.question,
                            inline: true
                        }
                    )
                    .setThumbnail(
                        winner.author.displayAvatarURL({
                            dynamic: true
                        })
                    )
                    .setFooter({
                        text:
                            "Bankai • Hızlı Cevap"
                    })
                    .setTimestamp();

            return gameMessage.edit({
                embeds: [winEmbed]
            });

        } catch {

            // =========================
            // ⏰ SÜRE DOLDU
            // =========================

            activeGames.delete(
                message.channel.id
            );

            const timeoutEmbed =
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("⏰ Süre Doldu!")
                    .setDescription(
                        `Kimse doğru cevap veremedi.\n\n` +
                        `🧠 **Soru:**\n` +
                        `> ${selected.question}\n\n` +
                        `💡 **Doğru cevap:** ||${selected.answers[0]}||`
                    )
                    .setFooter({
                        text:
                            "Bankai • Hızlı Cevap"
                    })
                    .setTimestamp();

            return gameMessage.edit({
                embeds: [timeoutEmbed]
            });
        }
    }
};