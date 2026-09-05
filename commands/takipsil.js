
const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "takipler.json");

function loadData() {
    if (!fs.existsSync(FILE)) {
        fs.writeFileSync(FILE, "{}", "utf8");
    }

    try {
        return JSON.parse(
            fs.readFileSync(FILE, "utf8")
        );
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

module.exports = {
    name: "takipsil",
    aliases: ["unfollow"],

    description: "Anime veya manga takibini siler.",

    async execute(message, args) {
        if (!message.guild) {
            return message.reply(
                "❌ Bu komut sunucuda kullanılabilir."
            );
        }

        if (!args.length) {
            return message.reply(
                "❌ Kullanım:\n\n" +
                "`B!takipsil One Piece`\n" +
                "`B!takipsil anime One Piece`\n" +
                "`B!takipsil manga One Piece`"
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
                "❌ Silmek istediğin içeriğin adını yaz."
            );
        }

        const data = loadData();

        const guildId = message.guild.id;
        const userId = message.author.id;

        if (
            !data[guildId] ||
            !Array.isArray(data[guildId][userId])
        ) {
            return message.reply(
                "❌ Takip listen boş."
            );
        }

        const follows = data[guildId][userId];
        const normalizedTitle = normalize(title);

        const before = follows.length;

        data[guildId][userId] =
            follows.filter(item => {
                const sameTitle =
                    normalize(item.title) === normalizedTitle;

                const sameType =
                    !type ||
                    item.type === type;

                return !(sameTitle && sameType);
            });

        const removed =
            before -
            data[guildId][userId].length;

        if (!removed) {
            return message.reply(
                `❌ **${title}** takip listende bulunamadı.`
            );
        }

        saveData(data);

        if (type) {
            const emoji =
                type === "anime"
                    ? "🎬"
                    : "📖";

            return message.reply(
                `✅ ${emoji} **${title}** ${type} takipten çıkarıldı.`
            );
        }

        return message.reply(
            `✅ **${title}** anime ve manga takiplerinden çıkarıldı.`
        );
    }
};

