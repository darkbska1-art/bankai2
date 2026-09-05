
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const takipFile = path.join(
    process.cwd(),
    "takipler.json"
);

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 dakika
const MANGADEX_API = "https://api.mangadex.org";

// =====================================================
// JSON
// =====================================================

function loadData() {
    try {
        if (!fs.existsSync(takipFile)) {
            fs.writeFileSync(
                takipFile,
                "{}",
                "utf8"
            );
        }

        return JSON.parse(
            fs.readFileSync(
                takipFile,
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
        takipFile,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}

// =====================================================
// BEKLEME
// =====================================================

function sleep(ms) {
    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}

// =====================================================
// MANGADEX API
// =====================================================

async function mangaDexRequest(url) {

    const response = await fetch(
        url,
        {
            headers: {
                "User-Agent":
                    "Bankai-Discord-Bot/1.0"
            }
        }
    );

    // Rate limit
    if (response.status === 429) {

        const retryAfter =
            Number(
                response.headers.get(
                    "Retry-After"
                )
            ) || 5;

        console.log(
            `⏳ MangaDex rate limit. ${retryAfter} saniye bekleniyor...`
        );

        await sleep(
            retryAfter * 1000
        );

        return mangaDexRequest(url);
    }

    if (!response.ok) {
        throw new Error(
            `MangaDex API: ${response.status}`
        );
    }

    return response.json();
}

// =====================================================
// MANGA ARAMA
// =====================================================

async function searchManga(title) {

    const url =
        `${MANGADEX_API}/manga` +
        `?title=${encodeURIComponent(title)}` +
        `&limit=5` +
        `&includes[]=cover_art`;

    const result =
        await mangaDexRequest(url);

    const mangas =
        result.data || [];

    if (!mangas.length) {
        return null;
    }

    /*
     * Önce tam eşleşme arıyoruz.
     * Bulamazsak ilk sonucu kullanıyoruz.
     */

    const normalized =
        title
            .toLowerCase()
            .trim();

    const exact =
        mangas.find(manga => {

            const titles =
                manga.attributes?.title || {};

            return Object.values(titles)
                .some(value =>
                    String(value)
                        .toLowerCase()
                        .trim() === normalized
                );
        });

    return exact || mangas[0];
}

// =====================================================
// MANGADEX MANGA ID
// =====================================================

async function getMangaId(follow) {

    if (follow.mediaId) {
        return follow.mediaId;
    }

    const manga =
        await searchManga(
            follow.title
        );

    if (!manga) {
        return null;
    }

    return manga.id;
}

// =====================================================
// SON TÜRKÇE BÖLÜM
// =====================================================

async function getLatestChapter(mangaId) {

    const url =
        `${MANGADEX_API}/chapter` +
        `?manga[]=${encodeURIComponent(mangaId)}` +
        `&limit=10` +
        `&order[publishAt]=desc` +
        `&translatedLanguage[]=tr` +
        `&contentRating[]=safe` +
        `&includes[]=manga`;

    const result =
        await mangaDexRequest(url);

    const chapters =
        result.data || [];

    if (!chapters.length) {
        return null;
    }

    return chapters[0];
}

// =====================================================
// MANGA ADI
// =====================================================

function getMangaTitle(
    chapter,
    fallback
) {

    const mangaRelation =
        chapter?.relationships?.find(
            relation =>
                relation.type === "manga"
        );

    const titles =
        mangaRelation
            ?.attributes
            ?.title;

    if (!titles) {
        return fallback;
    }

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

async function getMangaInfo(mangaId) {

    try {

        const url =
            `${MANGADEX_API}/manga/${mangaId}` +
            `?includes[]=cover_art`;

        const result =
            await mangaDexRequest(url);

        return result.data || null;

    } catch {
        return null;
    }
}

// =====================================================
// KAPAK URL
// =====================================================

function getCoverUrl(manga) {

    if (!manga) {
        return null;
    }

    const cover =
        manga.relationships?.find(
            relation =>
                relation.type === "cover_art"
        );

    const fileName =
        cover?.attributes?.fileName;

    if (!fileName) {
        return null;
    }

    return (
        `https://uploads.mangadex.org/covers/` +
        `${manga.id}/${fileName}.256.jpg`
    );
}

// =====================================================
// BÖLÜM NUMARASI
// =====================================================

function getChapterNumber(chapter) {

    return (
        chapter?.attributes?.chapter ||
        "Özel"
    );
}

// =====================================================
// TAKİP BİLDİRİMİ
// =====================================================

async function sendNotification(
    client,
    userId,
    mangaTitle,
    chapter,
    manga
) {

    const chapterNumber =
        getChapterNumber(
            chapter
        );

    const chapterId =
        chapter.id;

    const mangaUrl =
        `https://mangadex.org/title/${manga?.id || ""}`;

    const chapterUrl =
        `https://mangadex.org/chapter/${chapterId}`;

    const embed =
        new EmbedBuilder()
            .setColor("#000000")
            .setTitle(
                "📖 Manga Bölümü Yayında!"
            )
            .setDescription(
                `**${mangaTitle}**\n\n` +
                `Yeni bölüm: **${chapterNumber}**`
            )
            .addFields(
                {
                    name: "📖 Manga",
                    value: mangaTitle,
                    inline: true
                },
                {
                    name: "📚 Bölüm",
                    value: String(
                        chapterNumber
                    ),
                    inline: true
                },
                {
                    name: "🌐 Kaynak",
                    value:
                        `[MangaDex](${chapterUrl})`,
                    inline: true
                }
            )
            .setFooter({
                text:
                    "Bankai Manga Takip Sistemi"
            })
            .setTimestamp();

    const cover =
        getCoverUrl(manga);

    if (cover) {
        embed.setThumbnail(
            cover
        );
    }

    if (manga?.id) {
        embed.setURL(
            mangaUrl
        );
    }

    try {

        const user =
            await client.users.fetch(
                userId
            );

        await user.send({
            embeds: [embed]
        });

        console.log(
            `📖 ${mangaTitle} - Bölüm ${chapterNumber} bildirimi gönderildi.`
        );

        return true;

    } catch (error) {

        console.log(
            `⚠️ ${userId} kullanıcısına manga DM bildirimi gönderilemedi.`
        );

        return false;
    }
}

// =====================================================
// TÜM TAKİPLERİ KONTROL
// =====================================================

async function checkAll(client) {

    const data =
        loadData();

    let changed = false;

    for (
        const guildId of Object.keys(data)
    ) {

        const guildData =
            data[guildId];

        if (
            !guildData ||
            typeof guildData !== "object"
        ) {
            continue;
        }

        for (
            const userId of Object.keys(
                guildData
            )
        ) {

            const follows =
                guildData[userId];

            if (
                !Array.isArray(follows)
            ) {
                continue;
            }

            /*
             * Sadece manga takiplerini kontrol ediyoruz.
             * Anime kayıtlarına dokunmuyoruz.
             */

            const mangaFollows =
                follows.filter(
                    follow =>
                        follow &&
                        follow.type === "manga"
                );

            for (
                const follow of mangaFollows
            ) {

                try {

                    // =================================
                    // MANGA ID BUL
                    // =================================

                    const mangaId =
                        await getMangaId(
                            follow
                        );

                    if (!mangaId) {

                        console.log(
                            `⚠️ Manga bulunamadı: ${follow.title}`
                        );

                        await sleep(1000);

                        continue;
                    }

                    // Manga ID kaydet
                    if (
                        follow.mediaId !== mangaId
                    ) {

                        follow.mediaId =
                            mangaId;

                        changed = true;
                    }

                    // =================================
                    // SON BÖLÜM
                    // =================================

                    const latestChapter =
                        await getLatestChapter(
                            mangaId
                        );

                    if (!latestChapter) {

                        await sleep(1000);

                        continue;
                    }

                    const chapterId =
                        latestChapter.id;

                    const chapterNumber =
                        getChapterNumber(
                            latestChapter
                        );

                    const manga =
                        await getMangaInfo(
                            mangaId
                        );

                    const mangaTitle =
                        manga?.attributes?.title
                            ?.tr ||
                        manga?.attributes?.title
                            ?.en ||
                        follow.title;

                    // =================================
                    // İLK KONTROL
                    // =================================

                    /*
                     * Kullanıcı yeni takip ettiğinde
                     * mevcut bölümü kaydediyoruz.
                     *
                     * Böylece eski bölümü DM olarak
                     * göndermiyoruz.
                     */

                    if (
                        !follow.lastChapter &&
                        !follow.lastChapterId
                    ) {

                        follow.lastChapter =
                            chapterNumber;

                        follow.lastChapterId =
                            chapterId;

                        follow.lastChecked =
                            Date.now();

                        changed = true;

                        console.log(
                            `📖 ${mangaTitle} ilk kez senkronize edildi: Bölüm ${chapterNumber}`
                        );

                        await sleep(1000);

                        continue;
                    }

                    // =================================
                    // AYNI BÖLÜM
                    // =================================

                    if (
                        follow.lastChapterId ===
                        chapterId
                    ) {

                        follow.lastChecked =
                            Date.now();

                        changed = true;

                        await sleep(1000);

                        continue;
                    }

                    // =================================
                    // YENİ BÖLÜM
                    // =================================

                    const oldChapter =
                        follow.lastChapter;

                    follow.lastChapter =
                        chapterNumber;

                    follow.lastChapterId =
                        chapterId;

                    follow.lastChecked =
                        Date.now();

                    changed = true;

                    await sendNotification(
                        client,
                        userId,
                        mangaTitle,
                        latestChapter,
                        manga
                    );

                } catch (error) {

                    console.error(
                        `❌ ${follow.title} kontrol edilemedi:`,
                        error.message
                    );

                    await sleep(
                        2000
                    );
                }

                /*
                 * MangaDex'e çok hızlı istek
                 * atmamak için bekleme.
                 */

                await sleep(
                    1200
                );
            }
        }
    }

    if (changed) {
        saveData(data);
    }
}

// =====================================================
// BAŞLAT
// =====================================================

module.exports = function startMangaTracker(
    client
) {

    console.log(
        "📖 Manga takip sistemi başlatıldı."
    );

    /*
     * Bot açıldıktan 15 saniye sonra
     * ilk kontrol.
     */

    setTimeout(
        () => {

            checkAll(client)
                .catch(error => {

                    console.error(
                        "❌ Manga takip kontrol hatası:",
                        error
                    );

                });

        },
        15000
    );

    /*
     * Her 10 dakikada bir kontrol.
     */

    setInterval(
        () => {

            checkAll(client)
                .catch(error => {

                    console.error(
                        "❌ Manga takip kontrol hatası:",
                        error
                    );

                });

        },
        CHECK_INTERVAL
    );
};

