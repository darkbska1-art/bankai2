
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const FILE = path.join(
    process.cwd(),
    "takipler.json"
);

const API = "https://api.jikan.moe/v4";
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
                await sleep(4000);
                continue;
            }

            if (!response.ok) {
                throw new Error(
                    `Jikan ${response.status}`
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

async function findAnime(title) {
    const result = await request(
        `/anime?q=${encodeURIComponent(title)}&limit=10`
    );

    const list = result?.data || [];

    if (!list.length) {
        return null;
    }

    const wanted =
        title.toLocaleLowerCase("tr-TR").trim();

    const exact = list.find(anime => {
        const titles = [
            anime.title,
            anime.title_english,
            anime.title_japanese
        ].filter(Boolean);

        return titles.some(
            value =>
                String(value)
                    .toLocaleLowerCase("tr-TR")
                    .trim() === wanted
        );
    });

    return exact || list[0];
}

async function getAnime(id) {
    const result = await request(
        `/anime/${id}/full`
    );

    return result?.data || null;
}

function getTitle(anime, fallback) {
    return (
        anime?.title ||
        anime?.title_english ||
        anime?.title_japanese ||
        fallback
    );
}

async function sendDM(
    client,
    userId,
    anime,
    episode
) {
    try {
        const user =
            await client.users.fetch(userId);

        const title =
            getTitle(anime, "Bilinmeyen Anime");

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🎬 Anime Bölümü Yayında!")
            .setDescription(
                `**${title}**\n\n` +
                `Yeni bölüm: **${episode}**`
            )
            .addFields(
                {
                    name: "🎬 Anime",
                    value: title,
                    inline: true
                },
                {
                    name: "📺 Bölüm",
                    value: String(episode),
                    inline: true
                },
                {
                    name: "🌐 Kaynak",
                    value: anime.url
                        ? `[MyAnimeList](${anime.url})`
                        : "MyAnimeList",
                    inline: true
                }
            )
            .setFooter({
                text: "Bankai Anime Takip Sistemi"
            })
            .setTimestamp();

        const image =
            anime.images?.jpg?.large_image_url ||
            anime.images?.jpg?.image_url;

        if (image) {
            embed.setThumbnail(image);
        }

        if (anime.url) {
            embed.setURL(anime.url);
        }

        await user.send({
            embeds: [embed]
        });

        return true;

    } catch (error) {
        console.log(
            `⚠️ Anime DM gönderilemedi (${userId}):`,
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
                        follow.type !== "anime"
                    ) {
                        continue;
                    }

                    try {
                        let anime = null;

                        // ID kayıtlıysa direkt kullan
                        if (follow.mediaId) {
                            try {
                                anime = await getAnime(
                                    follow.mediaId
                                );
                            } catch {
                                anime = null;
                            }
                        }

                        // ID yoksa veya bozuksa ara
                        if (!anime) {
                            anime =
                                await findAnime(
                                    follow.title
                                );

                            if (!anime) {
                                console.log(
                                    `⚠️ Anime bulunamadı: ${follow.title}`
                                );

                                await sleep(1500);
                                continue;
                            }

                            follow.mediaId =
                                anime.mal_id;

                            changed = true;
                        }

                        const episode =
                            Number(anime.episodes);

                        // Bölüm sayısı henüz bilinmiyorsa
                        if (
                            !Number.isFinite(episode) ||
                            episode <= 0
                        ) {
                            await sleep(1500);
                            continue;
                        }

                        // İlk senkronizasyon
                        if (
                            follow.lastEpisode === null ||
                            follow.lastEpisode === undefined
                        ) {
                            follow.lastEpisode =
                                episode;

                            follow.lastChecked =
                                Date.now();

                            changed = true;

                            console.log(
                                `🎬 ${getTitle(anime, follow.title)} → mevcut bölüm ${episode} kaydedildi.`
                            );

                            await sleep(1500);
                            continue;
                        }

                        const oldEpisode =
                            Number(
                                follow.lastEpisode
                            );

                        // Yeni bölüm
                        if (
                            episode > oldEpisode
                        ) {
                            follow.lastEpisode =
                                episode;

                            follow.lastChecked =
                                Date.now();

                            changed = true;

                            await sendDM(
                                client,
                                userId,
                                anime,
                                episode
                            );

                        } else {
                            follow.lastChecked =
                                Date.now();

                            changed = true;
                        }

                    } catch (error) {
                        console.error(
                            `❌ Anime kontrol hatası (${follow.title}):`,
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

module.exports = function startAnimeTracker(client) {
    console.log(
        "🎬 Anime takip sistemi başlatıldı."
    );

    setTimeout(() => {
        checkAll(client).catch(console.error);
    }, 20000);

    setInterval(() => {
        checkAll(client).catch(console.error);
    }, CHECK_INTERVAL);
};

