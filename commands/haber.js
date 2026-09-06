const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const Parser = require("rss-parser");

const parser = new Parser({
    timeout: 10000
});

// =====================================================
// HABER KATEGORİLERİ
// =====================================================

const categories = {
    turkiye: {
        name: "🇹🇷 Türkiye",
        description: "Türkiye gündeminden son haberler",
        url: "https://news.google.com/rss/headlines/section/topic/NATION?hl=tr&gl=TR&ceid=TR:tr"
    },

    dunya: {
        name: "🌍 Dünya",
        description: "Dünya gündeminden son haberler",
        url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=tr&gl=TR&ceid=TR:tr"
    },

    spor: {
        name: "⚽ Spor",
        description: "Spor dünyasından son haberler",
        url: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=tr&gl=TR&ceid=TR:tr"
    },

    teknoloji: {
        name: "💻 Teknoloji",
        description: "Teknoloji dünyasından son haberler",
        url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=tr&gl=TR&ceid=TR:tr"
    },

    magazin: {
        name: "🎬 Magazin",
        description: "Magazin dünyasından son haberler",
        url: "https://news.google.com/rss/search?q=magazin&hl=tr&gl=TR&ceid=TR:tr"
    },

    oyun: {
        name: "🎮 Oyun",
        description: "Oyun dünyasından son haberler",
        url: "https://news.google.com/rss/search?q=oyun&hl=tr&gl=TR&ceid=TR:tr"
    }
};

// =====================================================
// HABERLERİ AL
// =====================================================

async function getNews(category) {
    const selected = categories[category];

    if (!selected) {
        throw new Error("Geçersiz haber kategorisi.");
    }

    const feed = await parser.parseURL(selected.url);

    return {
        title: selected.name,
        items: feed.items || []
    };
}

// =====================================================
// KATEGORİ SELECT MENU
// =====================================================

function createCategoryMenu(category) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId("haber_category")
        .setPlaceholder("📰 Haber kategorisi seç...")
        .addOptions(
            Object.entries(categories).map(([key, data]) => ({
                label: data.name.replace(/^[^\s]+\s/, ""),
                description: data.description,
                value: key,
                emoji: data.name.match(/^\S+/)?.[0] || "📰",
                default: key === category
            }))
        );

    return new ActionRowBuilder().addComponents(menu);
}

// =====================================================
// SAYFALAMA BUTONLARI
// =====================================================

function createButtons(category, page, totalPages) {
    const row = new ActionRowBuilder();

    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`haber_prev_${category}_${page}`)
            .setEmoji("◀️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 0),

        new ButtonBuilder()
            .setCustomId(`haber_refresh_${category}_${page}`)
            .setEmoji("🔄")
            .setLabel("Yenile")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`haber_next_${category}_${page}`)
            .setEmoji("▶️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
    );

    return row;
}

// =====================================================
// HABER EMBED
// =====================================================

function createNewsEmbed(news, category, page, totalPages) {
    const start = page * 10;

    const items = news.items.slice(
        start,
        start + 10
    );

    let description = "";

    if (items.length === 0) {
        description =
            "❌ Bu kategoride gösterilecek haber bulunamadı.";
    } else {
        items.forEach((haber, index) => {
            const number = start + index + 1;

            let title =
                haber.title ||
                "Başlık bulunamadı";

            if (title.length > 150) {
                title =
                    title.substring(0, 147) +
                    "...";
            }

            const link =
                haber.link || "#";

            description +=
                `**${number}. [${title}](${link})**\n`;

            if (haber.pubDate) {
                const date =
                    new Date(haber.pubDate);

                if (!isNaN(date.getTime())) {
                    description +=
                        `🕐 <t:${Math.floor(
                            date.getTime() / 1000
                        )}:R>\n`;
                }
            }

            description += "\n";
        });
    }

    return new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`📰 ${news.title}`)
        .setDescription(description)
        .addFields(
            {
                name: "📄 Sayfa",
                value: `${page + 1} / ${totalPages}`,
                inline: true
            },
            {
                name: "🗞️ Haber Sayısı",
                value: `${news.items.length}`,
                inline: true
            }
        )
        .setFooter({
            text: "Bankai • Güncel Haberler"
        })
        .setTimestamp();
}

// =====================================================
// HABER GÖSTER
// =====================================================

async function showNews(
    interaction,
    category,
    page = 0
) {
    const news =
        await getNews(category);

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                news.items.length / 10
            )
        );

    if (page < 0) {
        page = 0;
    }

    if (page >= totalPages) {
        page = totalPages - 1;
    }

    const embed =
        createNewsEmbed(
            news,
            category,
            page,
            totalPages
        );

    const categoryMenu =
        createCategoryMenu(category);

    const navigationRow =
        createButtons(
            category,
            page,
            totalPages
        );

    await interaction.update({
        embeds: [embed],
        components: [
            categoryMenu,
            navigationRow
        ]
    });
}

// =====================================================
// KOMUT
// =====================================================

module.exports = {
    name: "haber",

    aliases: [
        "haberler",
        "gündem"
    ],

    async execute(message) {
        try {
            const category =
                "turkiye";

            const news =
                await getNews(category);

            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        news.items.length / 10
                    )
                );

            const embed =
                createNewsEmbed(
                    news,
                    category,
                    0,
                    totalPages
                );

            const categoryMenu =
                createCategoryMenu(
                    category
                );

            const navigationRow =
                createButtons(
                    category,
                    0,
                    totalPages
                );

            await message.reply({
                embeds: [embed],
                components: [
                    categoryMenu,
                    navigationRow
                ]
            });

        } catch (error) {
            console.error(
                "❌ Haber sistemi hatası:",
                error
            );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle(
                            "❌ Haberler Alınamadı"
                        )
                        .setDescription(
                            "Haber kaynağına şu anda ulaşılamıyor.\n\n" +
                            "Birkaç saniye sonra tekrar deneyin."
                        )
                ]
            });
        }
    },

    showNews
};