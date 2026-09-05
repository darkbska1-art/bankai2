
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

    name: "takipsil",

    aliases: [
        "unfollow"
    ],

    description:
        "Takip ettiğin anime veya mangayı siler.",

    async execute(message, args) {

        if (!args.length) {

            return message.reply(
                "❌ Kullanım:\n\n" +
                "`B!takipsil One Piece` → Anime + Manga\n" +
                "`B!takipsil anime One Piece` → Sadece Anime\n" +
                "`B!takipsil manga One Piece` → Sadece Manga"
            );
        }

        let type = null;
        let title = "";

        // =================================================
        // TÜR BELİRTİLDİ
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
        // TÜR BELİRTİLMEDİ
        // =================================================

        else {

            title =
                args
                    .join(" ")
                    .trim();
        }

        if (!title) {

            return message.reply(
                "❌ Silmek istediğin içeriğin adını yazmalısın."
            );
        }

        const data =
            loadData();

        const guildId =
            message.guild.id;

        const userId =
            message.author.id;

        const follows =
            data?.[
                guildId
            ]?.[
                userId
            ] || [];

        // =================================================
        // SADECE ANİME / MANGA
        // =================================================

        if (type) {

            const index =
                follows.findIndex(
                    x =>
                        x.type === type &&
                        x.title.toLowerCase() ===
                            title.toLowerCase()
                );

            if (index === -1) {

                return message.reply(
                    `❌ **${title}** ${type} takip listende bulunamadı.`
                );
            }

            const removed =
                follows[index];

            follows.splice(
                index,
                1
            );

            saveData(data);

            const emoji =
                type === "anime"
                    ? "🎬"
                    : "📖";

            return message.reply(
                `${emoji} **${removed.title}** ${type} takipten çıkarıldı.`
            );
        }

        // =================================================
        // HEM ANİME HEM MANGA
        // =================================================

        const oldLength =
            follows.length;

        const remaining =
            follows.filter(
                x =>
                    x.title.toLowerCase() !==
                    title.toLowerCase()
            );

        if (
            remaining.length === oldLength
        ) {

            return message.reply(
                `❌ **${title}** takip listende bulunamadı.`
            );
        }

        data[guildId][userId] =
            remaining;

        saveData(data);

        const removedCount =
            oldLength -
            remaining.length;

        return message.reply(
            `✅ **${title}** takipten çıkarıldı.\n\n` +
            `🗑️ Silinen takip: **${removedCount}**`
        );
    }
};

