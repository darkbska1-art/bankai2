const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const Parser = require("rss-parser");

const parser = new Parser({
    timeout: 15000,
    headers: {
        "User-Agent": "Mozilla/5.0"
    }
});

// =====================================================
// KATEGORİLER
// =====================================================

const categories = {
    turkiye: {
        name: "Türkiye",
        emoji: "🇹🇷",
        description: "Türkiye gündeminden haberler",
        url: "https://news.google.com/rss/headlines/section/topic/NATION?hl=tr&gl=TR&ceid=TR:tr"
    },

    dunya: {
        name: "Dünya",
        emoji: "🌍",
        description: "Dünya gündeminden haberler",
        url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=tr&gl=TR&ceid=TR:tr"
    },

    spor: {
        name: "Spor",
        emoji: "⚽",
        description: "Spor dünyasından haberler",
        url: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=tr&gl=TR&ceid=TR:tr"
    },

    teknoloji: {
        name: "Teknoloji",
        emoji: "💻",
        description: "Teknoloji dünyasından haberler",
        url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=tr&gl=TR&ceid=TR:tr"
    },

    magazin: {
        name: "Magazin",
        emoji: "🎬",
        description: "Magazin dünyasından haberler",
        url: "https://news.google.com/rss/search?q=magazin&hl=tr&gl=TR&ceid=TR:tr"
    },

    oyun: {
        name: "Oyun",
        emoji: "🎮",
        description: "Oyun dünyasından haberler",
        url: "https://news.google.com/rss/search?q=oyun&hl=tr&gl=TR&ceid=TR:tr"
    }
};

// =====================================================
// RSS HABERLERİNİ AL
// =====================================================

async function getNews(category) {
    const selected = categories[category];

    if (!selected) {
        throw new Error("Geçersiz kategori.");
    }

    try {
        const feed = await parser.parseURL(selected.url);

        return {
            title: selected.name,
            emoji: selected.emoji,
            items: feed.items || []
        };

    } catch (error) {
        console.error(
            `❌ ${category} RSS hatası:`,
            error.message
        );

        throw error;
    }
}

// =====================================================
// KATEGORİ SELECT MENU
// =====================================================

function createCategoryMenu(category) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId("haber_category")
        .setPlaceholder("📰 Haber kategorisi seç...");

    for (const [key, data] of Object.entries(categories)) {
        menu.addOptions({
            label: data.name,
            description: data.description,
            value: key,
            emoji: data.emoji,
            default: key === category
        });
    }

    return new ActionRowBuilder()
        .addComponents(menu);
}

// =====================================================
// NAVİGASYON BUTONLARI
// =====================================================

function createNavigationButtons(
    category,
    page,
    totalPages
) {
    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(
                    `haber_prev_${category}_${page}`
                )
                .setEmoji("◀️")
                .setLabel("Önceki")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page <= 0),

            new ButtonBuilder()
                .setCustomId(
                    `haber_refresh_${category}_${page}`
                )
                .setEmoji("🔄")
                .setLabel("Yenile")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(
                    `haber_next_${category}_${page}`
                )
                .setEmoji("▶️")
                .setLabel("Sonraki")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(
                    page >= totalPages - 1
                )
        );
}

// =====================================================
// EMBED OLUŞTUR
// =====================================================

function createNewsEmbed(
    news,
    category,
    page,
    totalPages
) {
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

            const number =
                start + index + 1;

            let title =
                haber.title ||
                "Başlık bulunamadı";

            if (title.length > 140) {
                title =
                    title.substring(0, 137) +
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
        .setTitle(
            `${news.emoji} ${news.title} Haberleri`
        )
        .setDescription(description)
        .addFields(
            {
                name: "📄 Sayfa",
                value:
                    `\`${page + 1} / ${totalPages}\``,
                inline: true
            },
            {
                name: "🗞️ Toplam Haber",
                value:
                    `\`${news.items.length}\``,
                inline: true
            }
        )
        .setFooter({
            text: "Bankai • Güncel Haberler"
        })
        .setTimestamp();
}

// =====================================================
// HABER PANELİNİ GÖSTER
// =====================================================

async function showNews(
    interaction,
    category,
    page = 0
) {
    try {

        const news =
            await getNews(category);

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    news.items.length / 10
                )
            );

        page = Math.max(
            0,
            Math.min(
                page,
                totalPages - 1
            )
        );

        const embed =
            createNewsEmbed(
                news,
                category,
                page,
                totalPages
            );

        const categoryMenu =
            createCategoryMenu(category);

        const navigation =
            createNavigationButtons(
                category,
                page,
                totalPages
            );

        await interaction.update({
            embeds: [embed],
            components: [
                categoryMenu,
                navigation
            ]
        });

    } catch (error) {

        console.error(
            "❌ Haber gösterme hatası:",
            error
        );

        const errorEmbed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle(
                    "❌ Haberler Alınamadı"
                )
                .setDescription(
                    "Haber kaynağına şu anda ulaşılamıyor.\n\n" +
                    "Birkaç saniye sonra tekrar deneyin."
                );

        if (interaction.deferred) {
            return interaction.editReply({
                embeds: [errorEmbed],
                components: []
            });
        }

        return interaction.update({
            embeds: [errorEmbed],
            components: []
        });
    }
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

            const navigation =
                createNavigationButtons(
                    category,
                    0,
                    totalPages
                );

            await message.reply({
                embeds: [embed],
                components: [
                    categoryMenu,
                    navigation
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