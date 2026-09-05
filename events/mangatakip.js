
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const DATA_FILE = path.join(process.cwd(), "takipler.json");

const CHECK_INTERVAL = 10 * 60 * 1000;
const API = "https://api.mangadex.org";

let checking = false;

// =====================================================
// JSON
// =====================================================

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, "{}", "utf8");
        }

        return JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );
    } catch (error) {
        console.error("❌ takipler.json okunamadı:", error);
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

// =====================================================
// HELPERS
// =====================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Bankai-Discord-Bot/1.0"
                }
            });

            if (response.status === 429) {
                const retry =
                    Number(response.headers.get("Retry-After")) || 5;

                console.log(
                    `⏳ MangaDex rate limit. ${retry} saniye bekleniyor...`
                );

                await sleep(retry * 1000);
                continue;
            }

            if (!response.ok) {
                throw new Error(
                    `MangaDex API ${response.status}`
                );
            }

            return await response.json();

        } catch (error) {
            if (attempt >= retries) {
                throw error;
            }

            await sleep(2000);
        }
    }
}

// =====================================================
// MANGA ARAMA
// =====================================================

async function searchManga(title) {
    const url =
        `${API}/manga` +
        `?title=${encodeURIComponent(title)}` +
        `&limit=10`;

    const result = await request(url);

    const mangas = result.data || [];

    if (!mangas.length) {
        return null;
    }

    const query = title
        .toLowerCase()
        .trim();

    const exact = mangas.find(manga => {
        const titles =
            manga.attributes?.title || {};

        return Object.values(titles).some(
            value =>
                String(value)
                    .toLowerCase()
                    .trim() === query
        );
    });

    return exact || mangas[0];
}

// =====================================================
// SON TÜRKÇE CHAPTER
// =====================================================

async function getLatestChapter(mangaId) {
    const url =
        `${API}/chapter` +
        `?manga[]=${encodeURIComponent(mangaId)}` +
        `&limit=20` +
        `&order[publishAt]=desc` +
        `&translatedLanguage[]=tr` +
        `&contentRating[]=safe`;

    const result = await request(url);

    const chapters = result.data || [];

    if (!chapters.length) {
        return null;
    }

    return chapters[0];
}

// =====================================================
// MANGA BİLGİ
// =====================================================

async function getMangaInfo(mangaId) {
    try {
        const result = await request(
            `${API}/manga/${mangaId}?includes[]=cover_art`
        );

        return result.data || null;

    } catch {
        return null;
    }
}

// =====================================================
// BAŞLIK
// =====================================================

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

// =====================================================
// KAPAK
// =====================================================

function getCover(manga) {
    const relation =
        manga?.relationships?.find(
            x => x.type === "cover_art"
        );

    const fileName =
        relation?.attributes?.fileName;

    if (!fileName || !manga?.id) {
        return null;
    }

    return (
        `https://uploads.mangadex.org/covers/` +
        `${manga.id}/${fileName}.256.jpg`
    );
}

// =====================================================
// BÖLÜM
// =====================================================

function getChapterNumber(chapter) {
    return (
        chapter?.attributes?.chapter ||
        "Özel"
    );
}

// =====================================================
// DM
// =====================================================

async function sendNotification(
    client,
    userId,
    manga,
    chapter
) {
    const title =
        getTitle(
            manga,
            "Bilinmeyen Manga"
        );

    const chapterNumber =
        getChapterNumber(chapter);

    const chapterId =
        chapter.id;

    const embed =
        new EmbedBuilder()
            .setColor("#000000")
            .setTitle("📖 Manga Bölümü Yayında!")
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
                    name: "📚 Bölüm",
                    value: String(chapterNumber),
                    inline: true
                },
                {
                    name: "🌐 Kaynak",
                    value:
                        `[MangaDex](https://mangadex.org/chapter/${chapterId})`,
                    inline: true
                }
            )
            .setFooter({
                text: "Bankai Manga Takip Sistemi"
            })
            .setTimestamp();

    const cover = getCover(manga);

    if (cover) {
        embed.setThumbnail(cover);
    }

    try {
        const user =
            await client.users.fetch(userId);

        await user.send({
            embeds: [embed]
        });

        console.log(
            `📖 ${title} → Bölüm ${chapterNumber} bildirildi.`
        );

    } catch {
        console.log(
            `⚠️ ${userId} kullanıcısına manga DM gönderilemedi.`
        );
    }
}

// =====================================================
// TÜM TAKİPLER
// =====================================================

async function checkAll(client) {
    if (checking) {
        console.log(
            "⏳ Manga kontrolü zaten devam ediyor."
        );
        return;
    }

    checking = true;

    try {
        const data = loadData();

        let changed = false;

        for (const guildId of Object.keys(data)) {
            const guildData = data[guildId];

            if (!guildData || typeof guildData !== "object") {
                continue;
            }

            for (const userId of Object.keys(guildData)) {
                const follows = guildData[userId];

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
                        // =================================
                        // MANGA ID
                        // =================================

                        if (!follow.mediaId) {
                            const manga =
                                await searchManga(
                                    follow.title
                                );

                            if (!manga) {
                                console.log(
                                    `⚠️ Manga bulunamadı: ${follow.title}`
                                );

                                continue;
                            }

                            follow.mediaId =
                                manga.id;

                            changed = true;
                        }

                        // =================================
                        // SON CHAPTER
                        // =================================

                        const chapter =
                            await getLatestChapter(
                                follow.mediaId
                            );

                        if (!chapter) {
                            console.log(
                                `ℹ️ ${follow.title} için Türkçe chapter bulunamadı.`
                            );

                            continue;
                        }

                        const chapterNumber =
                            getChapterNumber(
                                chapter
                            );

                        // =================================
                        // MANGA BİLGİSİ
                        // =================================

                        const manga =
                            await getMangaInfo(
                                follow.mediaId
                            );

                        // =================================
                        // İLK SENKRONİZASYON
                        // =================================

                        if (!follow.lastChapterId) {
                            follow.lastChapter =
                                chapterNumber;

                            follow.lastChapterId =
                                chapter.id;

                            follow.lastChecked =
                                Date.now();

                            changed = true;

                            console.log(
                                `📖 ${follow.title} ilk kez senkronize edildi → ${chapterNumber}`
                            );

                            await sleep(1200);
                            continue;
                        }

                        // =================================
                        // AYNI CHAPTER
                        // =================================

                        if (
                            follow.lastChapterId ===
                            chapter.id
                        ) {
                            follow.lastChecked =
                                Date.now();

                            changed = true;

                            await sleep(1000);
                            continue;
                        }

                        // =================================
                        // YENİ CHAPTER
                        // =================================

                        follow.lastChapter =
                            chapterNumber;

                        follow.lastChapterId =
                            chapter.id;

                        follow.lastChecked =
                            Date.now();

                        changed = true;

                        await sendNotification(
                            client,
                            userId,
                            manga,
                            chapter
                        );

                    } catch (error) {
                        console.error(
                            `❌ ${follow.title} kontrol edilemedi:`,
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
        checking = false;
    }
}

// =====================================================
// BAŞLAT
// =====================================================

module.exports = function startMangaTracker(client) {
    console.log(
        "📖 Manga takip sistemi başlatıldı."
    );

    setTimeout(() => {
        checkAll(client).catch(error => {
            console.error(
                "❌ Manga takip hatası:",
                error
            );
        });
    }, 15000);

    setInterval(() => {
        checkAll(client).catch(error => {
            console.error(
                "❌ Manga takip hatası:",
                error
            );
        });
    }, CHECK_INTERVAL);
};

