
const {
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const API =
    "https://api.mangadex.org";

const CONFIG_FILE =
    path.join(
        process.cwd(),
        "mangahaber.json"
    );

const CACHE_FILE =
    path.join(
        process.cwd(),
        "mangahaber-cache.json"
    );

// 5 dakikada bir kontrol
const CHECK_INTERVAL =
    5 * 60 * 1000;

// ==========================================
// JSON
// ==========================================

function ensureFile(file) {

    if (!fs.existsSync(file)) {

        fs.writeFileSync(
            file,
            "{}",
            "utf8"
        );
    }
}

function loadJSON(file) {

    ensureFile(file);

    try {

        return JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            `❌ JSON okunamadı: ${file}`,
            error
        );

        return {};
    }
}

function saveJSON(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}

// ==========================================
// MANGADEX
// ==========================================

async function getLatestChapters() {

    const url =
        API +
        "/chapter" +
        "?limit=100" +
        "&order[publishAt]=desc" +
        "&translatedLanguage[]=tr" +
        "&contentRating[]=safe" +
        "&includes[]=manga";

    const response =
        await fetch(
            url,
            {
                headers: {
                    "User-Agent":
                        "Bankai-Discord-Bot/1.0"
                }
            }
        );

    if (!response.ok) {

        throw new Error(
            `MangaDex API ${response.status}`
        );
    }

    const result =
        await response.json();

    return result.data || [];
}

// ==========================================
// MANGA ADINI BUL
// ==========================================

function getMangaTitle(chapter) {

    const mangaRelation =
        chapter.relationships?.find(
            relation =>
                relation.type === "manga"
        );

    const title =
        mangaRelation?.attributes?.title;

    if (!title) {
        return "Bilinmeyen Manga";
    }

    return (
        title.tr ||
        title.en ||
        Object.values(title)[0] ||
        "Bilinmeyen Manga"
    );
}

// ==========================================
// BÖLÜM BİLGİSİ
// ==========================================

function getChapterNumber(chapter) {

    return (
        chapter.attributes?.chapter ||
        "Özel Bölüm"
    );
}

function getChapterTitle(chapter) {

    return (
        chapter.attributes?.title ||
        ""
    );
}

// ==========================================
// HABER EMBED
// ==========================================

function createNewsEmbed(chapter) {

    const mangaTitle =
        getMangaTitle(chapter);

    const chapterNumber =
        getChapterNumber(chapter);

    const chapterTitle =
        getChapterTitle(chapter);

    const description =
        chapterTitle
            ? `**${mangaTitle}**\n\n` +
              `Yeni bölüm: **${chapterNumber}**\n` +
              `Bölüm adı: **${chapterTitle}**`
            : `**${mangaTitle}**\n\n` +
              `Yeni bölüm: **${chapterNumber}**`;

    const embed =
        new EmbedBuilder()
            .setColor("#000000")
            .setTitle(
                "📖 Manga Bölümü Yayında!"
            )
            .setDescription(
                description
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
                        `[MangaDex](${API.replace(
                            "/api",
                            ""
                        )}/chapter/${chapter.id})`,
                    inline: true
                }
            )
            .setFooter({
                text:
                    "Bankai Manga Haber Sistemi"
            })
            .setTimestamp();

    return embed;
}

// ==========================================
// TEK KONTROL
// ==========================================

async function checkMangaNews(client) {

    const config =
        loadJSON(CONFIG_FILE);

    const cache =
        loadJSON(CACHE_FILE);

    const chapters =
        await getLatestChapters();

    if (!chapters.length) {

        console.log(
            "📖 MangaDex yeni bölüm döndürmedi."
        );

        return;
    }

    // ======================================
    // İLK ÇALIŞMA
    // Eski bölümleri göndermiyoruz.
    // ======================================

    if (
        Object.keys(cache).length === 0
    ) {

        for (const chapter of chapters) {

            cache[chapter.id] = {
                manga: getMangaTitle(
                    chapter
                ),
                chapter:
                    getChapterNumber(
                        chapter
                    ),
                publishedAt:
                    chapter.attributes
                        ?.publishedAt ||
                    null
            };
        }

        saveJSON(
            CACHE_FILE,
            cache
        );

        console.log(
            `📖 Manga haber sistemi ilk senkronizasyonu yaptı. ${chapters.length} bölüm kaydedildi.`
        );

        return;
    }

    // ======================================
    // YENİ BÖLÜMLER
    // ======================================

    const newChapters =
        chapters
            .filter(
                chapter =>
                    !cache[chapter.id]
            )
            .reverse();

    if (!newChapters.length) {

        console.log(
            "📖 Yeni manga bölümü yok."
        );

        return;
    }

    console.log(
        `📰 ${newChapters.length} yeni manga bölümü bulundu.`
    );

    // ======================================
    // SUNUCULARA GÖNDER
    // ======================================

    for (const chapter of newChapters) {

        const embed =
            createNewsEmbed(
                chapter
            );

        for (
            const guildId of Object.keys(config)
        ) {

            const guildConfig =
                config[guildId];

            if (
                !guildConfig ||
                guildConfig.enabled !== true ||
                !guildConfig.channelId
            ) {
                continue;
            }

            try {

                const channel =
                    await client.channels.fetch(
                        guildConfig.channelId
                    );

                if (!channel) {
                    continue;
                }

                if (
                    !channel.isTextBased()
                ) {
                    continue;
                }

                await channel.send({
                    embeds: [embed]
                });

            } catch (error) {

                console.error(
                    `❌ Manga haberi gönderilemedi. Guild: ${guildId}`,
                    error.message
                );
            }
        }

        // Cache'e ekle
        cache[chapter.id] = {
            manga:
                getMangaTitle(
                    chapter
                ),
            chapter:
                getChapterNumber(
                    chapter
                ),
            publishedAt:
                chapter.attributes
                    ?.publishedAt ||
                null
        };
    }

    saveJSON(
        CACHE_FILE,
        cache
    );
}

// ==========================================
// BAŞLAT
// ==========================================

module.exports = function startMangaNews(client) {

    console.log(
        "📖 Manga haber sistemi başlatılıyor..."
    );

    // Bot hazır olduktan sonra ilk kontrol
    checkMangaNews(client)
        .catch(error => {
            console.error(
                "❌ İlk manga haber kontrolü başarısız:",
                error
            );
        });

    // Düzenli kontrol
    setInterval(
        () => {

            checkMangaNews(client)
                .catch(error => {

                    console.error(
                        "❌ Manga haber kontrolü başarısız:",
                        error
                    );

                });

        },
        CHECK_INTERVAL
    );
};

