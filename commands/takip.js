
const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "takipler.json");

function loadData() {
    if (!fs.existsSync(FILE)) {
        fs.writeFileSync(FILE, "{}", "utf8");
    }

    try {
        return JSON.parse(fs.readFileSync(FILE, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function normalize(text) {
    return text
        .toLocaleLowerCase("tr-TR")
        .trim();
}

function createFollow(type, title) {
    return {
        type,
        title,
        mediaId: null,
        lastEpisode: null,
        lastChapter: null,
        lastChapterId: null,
        lastChecked: 0
    };
}

module.exports = {
    name: "takip",
    aliases: ["follow"],

    description: "Anime ve manga takip sistemi.",

    async execute(message, args) {
        if (!message.guild) {
            return message.reply(
                "❌ Bu komut sunucuda kullanılabilir."
            );
        }

        if (!args.length) {
            return message.reply(
                "❌ Kullanım:\n\n" +
                "`B!takip One Piece` → Anime + Manga\n" +
                "`B!takip anime One Piece` → Anime\n" +
                "`B!takip manga One Piece` → Manga"
            );
        }

        let type = null;
        let title;

        const first = normalize(args[0]);

        if (
            first === "anime" ||
            first === "manga"
        ) {
            type = first;
            title = args.slice(1).join(" ").trim();
        } else {
            title = args.join(" ").trim();
        }

        if (!title) {
            return message.reply(
                "❌ Takip etmek istediğin içeriğin adını yaz."
            );
        }

        const data = loadData();

        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!data[guildId]) {
            data[guildId] = {};
        }

        if (!Array.isArray(data[guildId][userId])) {
            data[guildId][userId] = [];
        }

        const follows = data[guildId][userId];
        const normalizedTitle = normalize(title);

        // ============================================
        // TEK TÜR
        // ============================================

        if (type) {
            const exists = follows.find(
                x =>
                    x.type === type &&
                    normalize(x.title) === normalizedTitle
            );

            if (exists) {
                return message.reply(
                    `❌ **${exists.title}** zaten ${type} olarak takip ediliyor.`
                );
            }

            follows.push(
                createFollow(type, title)
            );

            saveData(data);

            const emoji =
                type === "anime"
                    ? "🎬"
                    : "📖";

            return message.reply(
                `${emoji} **${title}** ${type} takip listene eklendi!\n\n` +
                "Yeni bölüm/chapter çıktığında sana DM göndereceğim."
            );
        }

        // ============================================
        // ANİME + MANGA
        // ============================================

        const animeExists = follows.find(
            x =>
                x.type === "anime" &&
                normalize(x.title) === normalizedTitle
        );

        const mangaExists = follows.find(
            x =>
                x.type === "manga" &&
                normalize(x.title) === normalizedTitle
        );

        const added = [];

        if (!animeExists) {
            follows.push(
                createFollow("anime", title)
            );

            added.push("🎬 Anime");
        }

        if (!mangaExists) {
            follows.push(
                createFollow("manga", title)
            );

            added.push("📖 Manga");
        }

        if (!added.length) {
            return message.reply(
                `❌ **${title}** zaten hem anime hem manga olarak takip ediliyor.`
            );
        }

        saveData(data);

        return message.reply(
            `✅ **${title}** takip listene eklendi!\n\n` +
            added.map(x => `• ${x}`).join("\n") +
            "\n\nYeni bölüm veya chapter çıktığında sana DM göndereceğim."
        );
    }
};

