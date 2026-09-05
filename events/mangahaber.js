
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const CONFIG_FILE = path.join(
    process.cwd(),
    "mangahaber.json"
);

const CACHE_FILE = path.join(
    process.cwd(),
    "mangahaber-cache.json"
);

const CHECK_INTERVAL = 10 * 60 * 1000;

// =====================================================
// JSON SİSTEMİ
// =====================================================

function loadJSON(file, fallback = {}) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(
            file,
            JSON.stringify(fallback, null, 2),
            "utf8"
        );

        return fallback;
    }

    try {
        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch (error) {
        console.error(`❌ JSON okunamadı: ${file}`);
        return fallback;
    }
}

function saveJSON(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

// =====================================================
// MANGADEX API
// =====================================================

async function mangaDexRequest(endpoint) {
    const response = await fetch(
        `https://api.mangadex.org${endpoint}`,
        {
            headers: {
                "User-Agent": "Bankai-Discord-Bot/1.0"
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            `MangaDex API ${response.status}`
        );
    }

    return response.json();
}

// =====================================================
// SON CHAPTERLARI AL
// =====================================================

async function getLatestChapters() {
    const params = new URLSearchParams();

    params.set("limit", "100");
    params.set("offset", "0");

    params.set(
        "order[readableAt]",
        "desc"
    );

    params.set(
        "contentRating[]",
        "safe"
    );

    params.set(
        "contentRating[]",
        "suggestive"
    );

    params.set(
        "includes[]",
        "manga"
    );

    params.set(
        "translatedLanguage[]",
        "tr"
    );

    return mangaDexRequest(
        `/chapter?${params.toString()}`
    );
}

// =====================================================
// CHAPTER BİLGİSİNİ DÜZENLE
// =====================================================

function parseChapter(chapter) {
    const relationships =
        chapter.relationships || [];

    const mangaRelation =
        relationships.find(
            relation => relation.type === "manga"
        );

    const mangaId =
        mangaRelation?.id;

    if (!mangaId) {
        return null;
    }

    const mangaAttributes =
        mangaRelation.attributes || {};

    const title =
        mangaAttributes.title?.en ||
        mangaAttributes.title?.tr ||
        Object.values(
            mangaAttributes.title || {}
        )[0] ||
        "Bilinmeyen Manga";

    const chapterNumber =
        chapter.attributes?.chapter ||
        "Özel";

    const chapterId =
        chapter.id;

    const readableAt =
        chapter.attributes?.readableAt;

    return {
        id: chapterId,
        mangaId,
        title,
        chapter: chapterNumber,
        readableAt,
        url:
            `https://mangadex.org/chapter/${chapterId}`
    };
}

// =====================================================
// HABER EMBEDİ
// =====================================================

function createEmbed(chapter) {
    return new EmbedBuilder()
        .setColor("#000000")
        .setTitle("📖 Manga Bölümü Yayında!")
        .setDescription(
            `**${chapter.title}**\n\n` +
            `Yeni bölüm: **${chapter.chapter}**`
        )
        .addFields({
            name: "📖 Bölüm",
            value: String(chapter.chapter),
            inline: true
        })
        .addFields({
            name: "🌐 Kaynak",
            value: "[MangaDex](https://mangadex.org/)",
            inline: true
        })
        .setURL(chapter.url)
        .setFooter({
            text: "Bankai Manga Haber Sistemi"
        })
        .setTimestamp(
            chapter.readableAt
                ? new Date(chapter.readableAt)
                : new Date()
        );
}

// =====================================================
// HABER KONTROLÜ
// =====================================================

async function checkMangaNews(client) {
    const config =
        loadJSON(CONFIG_FILE);

    const cache =
        loadJSON(CACHE_FILE);

    let result;

    try {
        result =
            await getLatestChapters();
    } catch (error) {
        console.error(
            "❌ MangaDex bağlantı hatası:",
            error.message
        );

        return;
    }

    const chapters =
        result.data || [];

    if (!chapters.length) {
        console.log(
            "📖 MangaDex: Yeni chapter bulunamadı."
        );

        return;
    }

    const newChapters = [];

    for (const rawChapter of chapters) {
        const chapter =
            parseChapter(rawChapter);

        if (!chapter) {
            continue;
        }

        /*
         * Daha önce görüldüyse tekrar gönderme.
         */
        if (cache[chapter.id]) {
            continue;
        }

        /*
         * Chapter'ı cache'e ekle.
         */
        cache[chapter.id] = {
            mangaId: chapter.mangaId,
            title: chapter.title,
            chapter: chapter.chapter,
            readableAt: chapter.readableAt,
            addedAt: Date.now()
        };

        newChapters.push(chapter);
    }

    saveJSON(
        CACHE_FILE,
        cache
    );

    if (!newChapters.length) {
        return;
    }

    console.log(
        `📖 MangaDex: ${newChapters.length} yeni chapter bulundu.`
    );

    // =================================================
    // SUNUCULARI KONTROL ET
    // =================================================

    for (const [
        guildId,
        settings
    ] of Object.entries(config)) {

        if (
            !settings ||
            !settings.enabled ||
            !settings.channelId
        ) {
            continue;
        }

        const guild =
            client.guilds.cache.get(guildId);

        if (!guild) {
            continue;
        }

        const channel =
            guild.channels.cache.get(
                settings.channelId
            );

        if (!channel) {
            console.log(
                `⚠️ ${guild.name}: Manga haber kanalı bulunamadı.`
            );

            continue;
        }

        // =================================================
        // YENİ HABERLERİ GÖNDER
        // =================================================

        for (const chapter of newChapters) {
            try {
                await channel.send({
                    embeds: [
                        createEmbed(chapter)
                    ]
                });

                console.log(
                    `📰 ${guild.name} → ${chapter.title} #${chapter.chapter}`
                );

            } catch (error) {
                console.error(
                    `❌ ${guild.name} manga haberi gönderilemedi:`,
                    error.message
                );
            }
        }
    }
}

// =====================================================
// EVENT BAŞLAT
// =====================================================

module.exports = function startMangaNews(client) {
    console.log(
        "📰 MangaDex manga haber sistemi başlatıldı."
    );

    /*
     * JSON'ların oluşmasını sağlar.
     */
    loadJSON(CONFIG_FILE);
    loadJSON(CACHE_FILE);

    /*
     * Bot açıldıktan 30 saniye sonra ilk kontrol.
     */
    setTimeout(() => {
        checkMangaNews(client).catch(error => {
            console.error(
                "❌ İlk manga haber kontrolü:",
                error
            );
        });
    }, 30000);

    /*
     * Her 10 dakikada bir kontrol.
     */
    setInterval(() => {
        checkMangaNews(client).catch(error => {
            console.error(
                "❌ Manga haber kontrolü:",
                error
            );
        });
    }, CHECK_INTERVAL);
};

