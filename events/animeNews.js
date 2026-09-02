
const Parser = require("rss-parser");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const parser = new Parser();

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "animeNews.json");

const CHECK_INTERVAL = 5 * 60 * 1000;

// RSS kaynakları
const FEEDS = [
    {
        name: "Anime News Network",
        url: "https://www.animenewsnetwork.com/news/rss.xml"
    }
];

function loadData() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, "{}");
    }

    try {
        return JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(data, null, 2)
    );
}

async function checkNews(client) {
    console.log("📰 Anime haberleri kontrol ediliyor...");

    const data = loadData();

    for (const feedInfo of FEEDS) {
        try {
            const feed = await parser.parseURL(feedInfo.url);

            if (!feed.items?.length) {
                console.log(`⚠️ ${feedInfo.name}: Haber bulunamadı.`);
                continue;
            }

            // En yeni haberleri sırala
            const news = [...feed.items]
                .filter(item => item.link && item.title)
                .sort((a, b) => {
                    return new Date(a.isoDate || a.pubDate || 0) -
                        new Date(b.isoDate || b.pubDate || 0);
                });

            // Her sunucuyu kontrol et
            for (const guild of client.guilds.cache.values()) {
                const settings = data[guild.id];

                if (!settings?.enabled || !settings.channelId) {
                    continue;
                }

                const channel = guild.channels.cache.get(
                    settings.channelId
                );

                if (!channel?.isTextBased()) {
                    continue;
                }

                // Kanalın haber kayıtlarını oluştur
                if (!settings.sent) {
                    settings.sent = [];
                }

                // En yeni 1 haberi kontrol et
                const latestNews = news.slice(-1);

                for (const item of latestNews) {
                    const newsId = item.guid || item.id || item.link;

                    if (settings.sent.includes(newsId)) {
                        continue;
                    }

                    const description =
                        item.contentSnippet ||
                        item.content ||
                        "Yeni anime haberi yayınlandı.";

                    const cleanDescription = description
                        .replace(/<[^>]*>/g, "")
                        .replace(/\s+/g, " ")
                        .trim()
                        .slice(0, 500);

                    const embed = new EmbedBuilder()
                        .setTitle(`📰 ${item.title}`)
                        .setDescription(
                            cleanDescription ||
                            "Yeni anime haberi yayınlandı."
                        )
                        .addFields({
                            name: "📰 Kaynak",
                            value: feedInfo.name,
                            inline: true
                        })
                        .setFooter({
                            text: "Bankai • Anime Haber Sistemi"
                        })
                        .setTimestamp(
                            item.isoDate
                                ? new Date(item.isoDate)
                                : new Date()
                        );

                    // Görsel varsa ekle
                    const image =
                        item.enclosure?.url ||
                        item.media?.content?.url;

                    if (image && /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(image)) {
                        embed.setImage(image);
                    }

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Habere Git")
                            .setStyle(ButtonStyle.Link)
                            .setURL(item.link)
                    );

                    await channel.send({
                        embeds: [embed],
                        components: [row]
                    });

                    settings.sent.push(newsId);

                    // Çok fazla kayıt birikmesini önle
                    if (settings.sent.length > 100) {
                        settings.sent = settings.sent.slice(-100);
                    }

                    console.log(
                        `📢 Haber gönderildi: ${guild.name} → ${item.title}`
                    );
                }
            }

            saveData(data);

        } catch (error) {
            console.error(
                `❌ ${feedInfo.name} kontrol edilirken hata:`,
                error.message
            );
        }
    }
}

function startAnimeNews(client) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📰 Anime Haber Sistemi başlatıldı.");
    console.log(`🔄 Kontrol aralığı: ${CHECK_INTERVAL / 60000} dakika`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Bot açıldığında kontrol et
    checkNews(client);

    // Daha sonra düzenli kontrol et
    setInterval(() => {
        checkNews(client);
    }, CHECK_INTERVAL);
}

module.exports = {
    startAnimeNews
};

