
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const takipFile = path.join(process.cwd(), "mangatakip.json");

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 dakika

function loadData() {
    if (!fs.existsSync(takipFile)) {
        fs.writeFileSync(
            takipFile,
            JSON.stringify({}, null, 2),
            "utf8"
        );
    }

    try {
        return JSON.parse(
            fs.readFileSync(takipFile, "utf8")
        );
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        takipFile,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

async function searchManga(title) {
    const url =
        `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Jikan API: ${response.status}`);
    }

    const result = await response.json();

    return result.data?.[0] || null;
}

async function checkManga(title) {
    const manga = await searchManga(title);

    if (!manga) {
        return null;
    }

    return {
        id: manga.mal_id,
        title: manga.title || title,
        chapters: manga.chapters || null,
        url: manga.url || null,
        image:
            manga.images?.jpg?.large_image_url ||
            manga.images?.jpg?.image_url ||
            null
    };
}

async function checkAll(client) {
    const data = loadData();

    for (const userId of Object.keys(data)) {
        const userData = data[userId];

        if (!userData || !Array.isArray(userData.manga)) {
            continue;
        }

        for (const follow of userData.manga) {
            try {
                const manga = await checkManga(follow.title);

                if (!manga) {
                    continue;
                }

                const currentChapter = manga.chapters;

                /*
                 * İlk kontrol:
                 * Kullanıcı takip ettiğinde mevcut bölümü kaydet.
                 * Böylece eski bölümleri bildirim olarak göndermez.
                 */
                if (
                    follow.lastChapter === null ||
                    follow.lastChapter === undefined
                ) {
                    follow.lastChapter = currentChapter;
                    follow.malId = manga.id;
                    saveData(data);
                    continue;
                }

                /*
                 * Yeni bölüm kontrolü
                 */
                if (
                    currentChapter !== null &&
                    currentChapter > follow.lastChapter
                ) {
                    const oldChapter = follow.lastChapter;

                    follow.lastChapter = currentChapter;
                    follow.malId = manga.id;

                    saveData(data);

                    const embed = new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("📖 Manga Bölümü Yayında!")
                        .setDescription(
                            `**${manga.title}**\n\n` +
                            `Yeni bölüm: **${currentChapter}**`
                        )
                        .addFields({
                            name: "📚 Önceki Bölüm",
                            value: String(oldChapter),
                            inline: true
                        })
                        .addFields({
                            name: "🆕 Yeni Bölüm",
                            value: String(currentChapter),
                            inline: true
                        })
                        .setFooter({
                            text: "Bankai Manga Takip Sistemi"
                        });

                    if (manga.image) {
                        embed.setThumbnail(manga.image);
                    }

                    if (manga.url) {
                        embed.setURL(manga.url);
                    }

                    try {
                        const user = await client.users.fetch(userId);

                        await user.send({
                            embeds: [embed]
                        });

                        console.log(
                            `📖 ${manga.title} - Bölüm ${currentChapter} bildirimi gönderildi.`
                        );
                    } catch (dmError) {
                        console.log(
                            `⚠️ ${userId} kullanıcısına DM gönderilemedi.`
                        );
                    }
                }

            } catch (error) {
                console.error(
                    `❌ ${follow.title} kontrol edilemedi:`,
                    error.message
                );

                /*
                 * Jikan rate limit'e takılmamak için
                 * hata durumunda kısa bekleme.
                 */
                await new Promise(resolve =>
                    setTimeout(resolve, 1500)
                );
            }

            /*
             * Her manga arasında küçük bekleme.
             */
            await new Promise(resolve =>
                setTimeout(resolve, 1000)
            );
        }
    }

    saveData(data);
}

module.exports = function startMangaTracker(client) {
    console.log("📖 Manga takip sistemi başlatıldı.");

    /*
     * Bot açılır açılmaz kontrol etme.
     * API'nin rate limitine takılmamak için biraz bekliyoruz.
     */
    setTimeout(() => {
        checkAll(client).catch(error => {
            console.error(
                "❌ Manga takip kontrol hatası:",
                error
            );
        });
    }, 15000);

    setInterval(() => {
        checkAll(client).catch(error => {
            console.error(
                "❌ Manga takip kontrol hatası:",
                error
            );
        });
    }, CHECK_INTERVAL);
};

