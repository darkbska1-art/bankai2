
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(
    process.cwd(),
    "takipler.json"
);

// =====================================================
// JSON
// =====================================================

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(
                DATA_FILE,
                "{}",
                "utf8"
            );
        }

        return JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );

    } catch (error) {
        console.error(
            "❌ takipler.json okunamadı:",
            error
        );

        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}

// =====================================================
// KOMUT
// =====================================================

module.exports = {

    name: "takip",

    aliases: [
        "follow"
    ],

    description:
        "Anime ve manga takip etmeye başlarsın.",

    async execute(message, args) {

        if (!args.length) {
            return message.reply(
                "❌ Kullanım:\n\n" +
                "`B!takip One Piece`\n" +
                "`B!takip anime One Piece`\n" +
                "`B!takip manga One Piece`"
            );
        }

        let type = null;
        let title = "";

        // =================================================
        // B!takip anime One Piece
        // B!takip manga One Piece
        // =================================================

        if (
            args[0].toLowerCase() === "anime" ||
            args[0].toLowerCase() === "manga"
        ) {

            type =
                args[0].toLowerCase();

            title =
                args
                    .slice(1)
                    .join(" ")
                    .trim();

        }

        // =================================================
        // B!takip One Piece
        // =================================================

        else {

            title =
                args
                    .join(" ")
                    .trim();
        }

        if (!title) {
            return message.reply(
                "❌ Takip etmek istediğin içeriğin adını yazmalısın."
            );
        }

        const data = loadData();

        const guildId =
            message.guild.id;

        const userId =
            message.author.id;

        if (!data[guildId]) {
            data[guildId] = {};
        }

        if (!data[guildId][userId]) {
            data[guildId][userId] = [];
        }

        const follows =
            data[guildId][userId];

        // =================================================
        // TEK TÜR BELİRTİLDİYSE
        // =================================================

        if (type) {

            const exists =
                follows.find(
                    x =>
                        x.type === type &&
                        x.title.toLowerCase() ===
                            title.toLowerCase()
                );

            if (exists) {
                return message.reply(
                    `❌ **${exists.title}** zaten ${type} olarak takip listende.`
                );
            }

            follows.push({
                type,
                title,
                mediaId: null,
                lastEpisode: null,
                lastChapter: null,
                lastChecked: 0
            });

            saveData(data);

            const emoji =
                type === "anime"
                    ? "🎬"
                    : "📖";

            return message.reply(
                `${emoji} **${title}** ${type} takip listene eklendi!`
            );
        }

        // =================================================
        // TÜR BELİRTİLMEDİ
        // B!takip One Piece
        //
        // HEM ANİME HEM MANGA
        // =================================================

        const animeExists =
            follows.find(
                x =>
                    x.type === "anime" &&
                    x.title.toLowerCase() ===
                        title.toLowerCase()
            );

        const mangaExists =
            follows.find(
                x =>
                    x.type === "manga" &&
                    x.title.toLowerCase() ===
                        title.toLowerCase()
            );

        let added = [];

        if (!animeExists) {

            follows.push({
                type: "anime",
                title,
                mediaId: null,
                lastEpisode: null,
                lastChapter: null,
                lastChecked: 0
            });

            added.push("🎬 Anime");
        }

        if (!mangaExists) {

            follows.push({
                type: "manga",
                title,
                mediaId: null,
                lastEpisode: null,
                lastChapter: null,
                lastChecked: 0
            });

            added.push("📖 Manga");
        }

        if (added.length === 0) {
            return message.reply(
                `❌ **${title}** zaten hem anime hem manga olarak takip listende.`
            );
        }

        saveData(data);

        return message.reply(
            `✅ **${title}** takip listene eklendi!\n\n` +
            added.join("\n") +
            "\n\n" +
            "Yeni anime bölümü veya manga chapter'ı çıktığında sana bildirim göndereceğim."
        );
    }
};

