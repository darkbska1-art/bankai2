
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const takipFile = path.join(
    process.cwd(),
    "takipler.json"
);

const CHECK_INTERVAL = 10 * 60 * 1000;
const JIKAN_API = "https://api.jikan.moe/v4";

let checking = false;

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
    try {
        fs.writeFileSync(
            takipFile,
            JSON.stringify(
                data,
                null,
                2
            ),
            "utf8"
        );
    } catch (error) {
        console.error(
            "❌ takipler.json kaydedilemedi:",
            error
        );
    }
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
// JIKAN API
// =====================================================

async function jikanRequest(
    endpoint,
    retries = 3
) {
    for (
        let attempt = 1;
        attempt <= retries;
        attempt++
    ) {
        try {
            const response = await fetch(
                `${JIKAN_API}${endpoint}`,
                {
                    headers: {
                        "User-Agent":
                            "Bankai-Discord-Bot/1.0"
                    }
                }
            );

            // Jikan rate limit
            if (response.status === 429) {
                console.log(
                    `⏳ Jikan rate limit. ${attempt}. deneme...`
                );

                await sleep(
                    3000
                );

                continue;
            }

            if (!response.ok) {
                throw new Error(
                    `Jikan API: ${response.status}`
                );
            }

            return await response.json();

        } catch (error) {
            if (
                attempt >= retries
            ) {
                throw error;
            }

            await sleep(
                2000
            );
        }
    }

    return null;
}

// =====================================================
// ANIME ARAMA
// =====================================================

async function searchAnime(
    title
) {
    const result =
        await jikanRequest(
            `/anime?q=${encodeURIComponent(title)}&limit=10`
        );

    const animeList =
        result?.data || [];

    if (!animeList.length) {
        return null;
    }

    const normalized =
        title
            .toLowerCase()
            .trim();

    // Önce tam isim eşleşmesi
    const exact =
        animeList.find(
            anime => {

                const titles = [
                    anime.title,
                    anime.title_english,
                    anime.title_japanese
                ].filter(Boolean);

                return titles.some(
                    value =>
                        String(value)
                            .toLowerCase()
                            .trim() === normalized
                );
            }
        );

    return exact || animeList[0];
}

// =====================================================
// ANIME BİLGİSİ
// =====================================================

async function getAnimeInfo(
    animeId
) {
    const result =
        await jikanRequest(
            `/anime/${animeId}/full`
        );

    return result?.data || null;
}

// =====================================================
// BÖLÜM NUMARASI
// =====================================================

function getEpisode(
    anime
) {
    if (
        anime?.episodes === null ||
        anime?.episodes === undefined
    ) {
        return null;
    }

    const episode =
        Number(anime.episodes);

    if (
        !Number.isFinite(episode) ||
        episode <= 0
    ) {
        return null;
    }

    return episode;
}

// =====================================================
// ANIME ADI
// =====================================================

function getAnimeTitle(
    anime,
    fallback
) {
    return (
        anime?.title ||
        anime?.title_english ||
        anime?.title_japanese ||
        fallback
    );
}

// =====================================================
// DURUM
// =====================================================

function getAnimeStatus(
    anime
) {
    const statusMap = {
        "Currently Airing":
            "Yayınlanıyor",

        "Finished Airing":
            "Tamamlandı",

        "Not yet aired":
            "Henüz yayınlanmadı"
    };

    return (
        statusMap[anime?.status] ||
        anime?.status ||
        "Bilinmiyor"
    );
}

// =====================================================
// BİLDİRİM
// =====================================================

async function sendNotification(
    client,
    userId,
    anime,
    oldEpisode,
    newEpisode
) {
    const title =
        getAnimeTitle(
            anime,
            "Bilinmeyen Anime"
        );

    const embed =
        new EmbedBuilder()
            .setColor("#000000")
            .setTitle(
                "🎬 Anime Bölümü Yayında!"
            )
            .setDescription(
                `**${title}**\n\n` +
                `Yeni bölüm: **${newEpisode}**`
            )
            .addFields(
                {
                    name: "🎬 Anime",
                    value: title,
                    inline: true
                },
                {
                    name: "📺 Yeni Bölüm",
                    value: String(
                        newEpisode
                    ),
                    inline: true
                },
                {
                    name: "📺 Önceki Bölüm",
                    value: String(
                        oldEpisode
                    ),
                    inline: true
                },
                {
                    name: "📌 Durum",
                    value:
                        getAnimeStatus(
                            anime
                        ),
                    inline: true
                },
                {
                    name: "🌐 Kaynak",
                    value:
                        anime?.url
                            ? `[MyAnimeList](${anime.url})`
                            : "MyAnimeList",
                    inline: true
                }
            )
            .setFooter({
                text:
                    "Bankai Anime Takip Sistemi"
            })
            .setTimestamp();

    const image =
        anime?.images?.jpg
            ?.large_image_url ||
        anime?.images?.jpg
            ?.image_url;

    if (image) {
        embed.setThumbnail(
            image
        );
    }

    if (anime?.url) {
        embed.setURL(
            anime.url
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
            `🎬 ${title} → Bölüm ${newEpisode} bildirildi.`
        );

        return true;

    } catch (error) {
        console.log(
            `⚠️ ${userId} kullanıcısına anime DM gönderilemedi.`
        );

        return false;
    }
}

// =====================================================
// TÜM TAKİPLERİ KONTROL
// =====================================================

async function checkAll(
    client
) {
    if (checking) {
        console.log(
            "⏳ Anime kontrolü zaten devam ediyor."
        );

        return;
    }

    checking = true;

    try {
        const data =
            loadData();

        let changed = false;

        // =============================================
        // SUNUCULAR
        // =============================================

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

            // =========================================
            // KULLANICILAR
            // =========================================

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

                // Sadece anime takipleri
                const animeFollows =
                    follows.filter(
                        follow =>
                            follow &&
                            follow.type === "anime"
                    );

                // =====================================
                // ANİME TAKİPLERİ
                // =====================================

                for (
                    const follow of animeFollows
                ) {
                    try {

                        // =================================
                        // ANIME ID
                        // =================================

                        let animeId =
                            follow.mediaId;

                        let anime;

                        if (!animeId) {

                            anime =
                                await searchAnime(
                                    follow.title
                                );

                            if (!anime) {
                                console.log(
                                    `⚠️ Anime bulunamadı: ${follow.title}`
                                );

                                await sleep(
                                    1500
                                );

                                continue;
                            }

                            animeId =
                                anime.mal_id;

                            follow.mediaId =
                                animeId;

                            changed = true;

                        } else {

                            anime =
                                await getAnimeInfo(
                                    animeId
                                );

                            /*
                             * ID artık geçersizse
                             * tekrar arama yap.
                             */

                            if (!anime) {

                                anime =
                                    await searchAnime(
                                        follow.title
                                    );

                                if (!anime) {
                                    continue;
                                }

                                animeId =
                                    anime.mal_id;

                                follow.mediaId =
                                    animeId;

                                changed = true;
                            }
                        }

                        // =================================
                        // BÖLÜM
                        // =================================

                        const currentEpisode =
                            getEpisode(
                                anime
                            );

                        /*
                         * Jikan henüz bölüm bilgisini
                         * vermiyorsa takip güncellenmez.
                         */

                        if (
                            currentEpisode === null
                        ) {
                            console.log(
                                `ℹ️ ${follow.title} için bölüm bilgisi yok.`
                            );

                            await sleep(
                                1500
                            );

                            continue;
                        }

                        // =================================
                        // İLK SENKRONİZASYON
                        // =================================

                        /*
                         * Kullanıcı ilk kez takip ettiğinde
                         * mevcut bölümü kaydet.
                         *
                         * Eski bölümleri DM olarak gönderme.
                         */

                        if (
                            follow.lastEpisode === null ||
                            follow.lastEpisode === undefined
                        ) {

                            follow.lastEpisode =
                                currentEpisode;

                            follow.lastChecked =
                                Date.now();

                            changed = true;

                            console.log(
                                `🎬 ${getAnimeTitle(anime, follow.title)} ilk kez senkronize edildi → Bölüm ${currentEpisode}`
                            );

                            await sleep(
                                1500
                            );

                            continue;
                        }

                        const lastEpisode =
                            Number(
                                follow.lastEpisode
                            );

                        // =================================
                        // AYNI BÖLÜM
                        // =================================

                        if (
                            currentEpisode ===
                            lastEpisode
                        ) {

                            follow.lastChecked =
                                Date.now();

                            changed = true;

                            await sleep(
                                1200
                            );

                            continue;
                        }

                        // =================================
                        // YENİ BÖLÜM
                        // =================================

                        if (
                            currentEpisode >
                            lastEpisode
                        ) {

                            const oldEpisode =
                                lastEpisode;

                            follow.lastEpisode =
                                currentEpisode;

                            follow.lastChecked =
                                Date.now();

                            changed = true;

                            /*
                             * Eğer birden fazla bölüm
                             * atlanmışsa tek DM yerine
                             * mevcut son bölümü bildiriyoruz.
                             */

                            await sendNotification(
                                client,
                                userId,
                                anime,
                                oldEpisode,
                                currentEpisode
                            );

                        } else {

                            /*
                             * API'den daha düşük bir
                             * bölüm geldiyse geriye
                             * düşürme.
                             */

                            follow.lastChecked =
                                Date.now();

                            changed = true;
                        }

                    } catch (error) {

                        console.error(
                            `❌ ${follow.title} anime kontrolü başarısız:`,
                            error.message
                        );

                        await sleep(
                            2500
                        );
                    }

                    /*
                     * Jikan rate limitlerini
                     * azaltmak için bekleme.
                     */

                    await sleep(
                        1500
                    );
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
// SİSTEMİ BAŞLAT
// =====================================================

module.exports = function startAnimeTracker(
    client
) {
    console.log(
        "🎬 Anime takip sistemi başlatıldı."
    );

    /*
     * Bot açıldıktan 20 saniye sonra
     * ilk kontrol.
     */

    setTimeout(
        () => {
            checkAll(client)
                .catch(error => {
                    console.error(
                        "❌ Anime takip kontrol hatası:",
                        error
                    );
                });
        },
        20000
    );

    /*
     * Her 10 dakikada bir kontrol.
     */

    setInterval(
        () => {
            checkAll(client)
                .catch(error => {
                    console.error(
                        "❌ Anime takip kontrol hatası:",
                        error
                    );
                });
        },
        CHECK_INTERVAL
    );
};

