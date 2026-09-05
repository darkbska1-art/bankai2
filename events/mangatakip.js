
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const FILE = path.join(
    process.cwd(),
    "takipler.json"
);

const API = "https://api.mangadex.org";
const CHECK_INTERVAL = 10 * 60 * 1000;

let running = false;

function sleep(ms) {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}

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

async function request(endpoint) {
    for (let i = 0; i < 4; i++) {
        try {
            const response = await fetch(
                `${API}${endpoint}`,
                {
                    headers: {
                        "User-Agent":
                            "Bankai-Discord-Bot/1.0"
                    }
                }
            );

            if (response.status === 429) {
                await sleep(5000);
                continue;
            }

            if (!response.ok) {
                throw new Error(
                    `MangaDex ${response.status}`
                );
            }

            return await response.json();

        } catch (error) {
            if (i === 3) {
                throw error;
            }

            await sleep(2500);
        }
    }

    return null;
}

async function searchManga(title) {
    const result = await request(
        `/manga?title=${encodeURIComponent(title)}&limit=10`
    );

    const list = result?.data || [];

    if (!list.length) {
        return null;
    }

    const wanted =
        title.toLocaleLowerCase("tr-TR").trim();

    const exact = list.find(manga => {
        const titles =
            manga.attributes?.title || {};

        return Object.values(titles).some(
            value =>
                String(value)
                    .toLocaleLowerCase("tr-TR")
                    .trim() === wanted
        );
    });

    return exact || list[0];
}

async function getManga(id) {
    const result = await request(
        `/manga/${id}?includes[]=cover_art`
    );

    return result?.data || null;
}

async function getLatestChapter(mangaId) {
    const result = await request(
        `/chapter?manga[]=${mangaId}` +
        `&limit=10` +
        `&order[publishAt]=desc` +
        `&translatedLanguage[]=tr` +
        `&contentRating[]=safe`
    );

    return result?.data?.[0] || null;
}

function getTitle(manga, fallback) {
    const titles =
        manga?.attributes?.title || {};

    return (
        titles.tr ||
        titles.en ||
        titles["ja-ro"] ||
        Object.values(titles)[0] ||
        fallback
    );
}

function getChapter(chapter) {
    return (
        chapter?.attributes?.chapter ||
        "Özel"
    );
}

function getCover(manga) {
    const cover = manga?.relationships?.find(
        relation =>
            relation.type === "cover_art"
    );

    if (!cover?.attributes?.fileName) {
        return null;
    }

    return (
        `https://uploads.mangadex.org/covers/` +
        `${manga.id}/` +
        `${cover.attributes.fileName}.256.jpg`
    );
}

async function sendDM(
    client,
    userId,
    manga,
    chapter
) {
    try {
        const user =
            await client.users.fetch(userId);

        const title =
            getTitle(manga, "Bilinmeyen Manga");

        const chapterNumber =
            getChapter(chapter);

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle(
                "📖 Manga Bölümü Yayında!"
            )
            .setDescription(
                `**${title}**\n\n` +
                `Yeni bölüm: **${chapterNumber}**`
            )
            .addFields(
                {
                    name: "📖 Manga",
                    value: title,
                    inline: true
                },
                {
                    name: "📚 Chapter",
                    value: String(chapterNumber),
                    inline: true
                },
                {
                    name: "🌐 Kaynak",
                    value: chapter.id
                        ? `[MangaDex](https://mangadex.org/chapter/${chapter.id})`
                        : "MangaDex",
                    inline: true
                }
            )
            .setFooter({
                text: "Bankai Manga Takip Sistemi"
            })
            .setTimestamp();

        const cover =
            getCover(manga);

        if (cover) {
            embed.setThumbnail(cover);
        }

        if (chapter.id) {
            embed.setURL(
                `https://mangadex.org/chapter/${chapter.id}`
            );
        }

        await user.send({
            embeds: [embed]
        });

        return true;

    } catch (error) {
        console.log(
            `⚠️ Manga DM gönderilemedi (${userId}):`,
            error.message
        );

        return false;
    }
}

async function checkAll(client) {
    if (running) {
        return;
    }

    running = true;

    try {
        const data = loadData();
        let changed = false;

        for (const guildId of Object.keys(data)) {
            const users = data[guildId];

            if (!users || typeof users !== "object") {
                continue;
            }

            for (const userId of Object.keys(users)) {
                const follows = users[userId];

                if (!Array.isArray(follows)) {
                    continue;
                }

                for (const follow of follows) {
                    if (
                        !follow ||
                        follow.type !== "manga"
                    ) {
                        continue;
                    }

                    try {
                        let manga = null;

                        if (follow.mediaId) {
                            try {
                                manga =
                                    await getManga(
                                        follow.mediaId
                                    );
                            } catch {
                                manga = null;
                            }
                        }

                        if (!manga) {
                            manga =
                                await searchManga(
                                    follow.title
                                );

                            if (!manga) {
                                console.log(
                                    `⚠️ Manga bulunamadı: ${follow.title}`
                                );

                                await sleep(1500);
                                continue;
                            }

                            follow.mediaId =
                                manga.id;

                            changed = true;
                        }

                        const chapter =
                            await getLatestChapter(
                                manga.id
                            );

                        if (!chapter) {
                            await sleep(1500);
                            continue;
                        }

                        const chapterId =
                            chapter.id;

                        const chapterNumber =
                            getChapter(chapter);

                        // İlk senkronizasyon
                        if (
                            !follow.lastChapterId
                        ) {
                            follow.lastChapterId =
                                chapterId;

                            follow.lastChapter =
                                chapterNumber;

                            follow.lastChecked =
                                Date.now();

                            changed = true;

                            console.log(
                                `📖 ${getTitle(manga, follow.title)} → mevcut chapter ${chapterNumber} kaydedildi.`
                            );

                            await sleep(1500);
                            continue;
                        }

                        // Yeni chapter
                        if (
                            follow.lastChapterId !==
                            chapterId
                        ) {
                            follow.lastChapterId =
                                chapterId;

                            follow.lastChapter =
                                chapterNumber;

                            follow.lastChecked =
                                Date.now();

                            changed = true;

                            await sendDM(
                                client,
                                userId,
                                manga,
                                chapter
                            );

                        } else {
                            follow.lastChecked =
                                Date.now();

                            changed = true;
                        }

                    } catch (error) {
                        console.error(
                            `❌ Manga kontrol hatası (${follow.title}):`,
                            error.message
                        );
                    }

                    await sleep(1500);
                }
            }
        }

        if (changed) {
            saveData(data);
        }

    } finally {
        running = false;
    }
}

module.exports = function startMangaTracker(client) {
    console.log(
        "📖 Manga takip sistemi başlatıldı."
    );

    setTimeout(() => {
        checkAll(client).catch(console.error);
    }, 25000);

    setInterval(() => {
        checkAll(client).catch(console.error);
    }, CHECK_INTERVAL);
};

