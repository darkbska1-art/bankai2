
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const ANILIST_API = "https://graphql.anilist.co";

module.exports = {
    name: "anime",

    aliases: [
        "animebilgi",
        "animesearch"
    ],

    async execute(message, args) {

        const query = args.join(" ").trim();

        if (!query) {
            return message.reply(
                "❌ Anime adı yazmalısın.\n\n" +
                "`B!anime Bleach`\n" +
                "`B!anime Naruto`\n" +
                "`B!anime One Piece`"
            );
        }

        const loading = await message.reply(
            "🔎 **Anime aranıyor...**"
        );

        try {

            const graphql = {
                query: `
                    query ($search: String) {
                        Page(page: 1, perPage: 10) {
                            media(
                                search: $search
                                type: ANIME
                                isAdult: false
                            ) {
                                id
                                title {
                                    romaji
                                    english
                                    native
                                }
                                description(asHtml: false)
                                episodes
                                status
                                season
                                seasonYear
                                averageScore
                                popularity
                                genres
                                format
                                duration
                                coverImage {
                                    large
                                    extraLarge
                                }
                                siteUrl
                                studios {
                                    nodes {
                                        name
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: {
                    search: query
                }
            };

            const response = await fetch(
                ANILIST_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify(graphql)
                }
            );

            if (!response.ok) {
                throw new Error(
                    `AniList HTTP ${response.status}`
                );
            }

            const json =
                await response.json();

            if (
                json.errors ||
                !json.data?.Page?.media
            ) {
                console.error(
                    "AniList:",
                    json.errors
                );

                throw new Error(
                    "AniList geçerli veri göndermedi."
                );
            }

            const results =
                json.data.Page.media;

            if (!results.length) {
                return loading.edit(
                    "❌ Bu isimle anime bulunamadı."
                );
            }

            let index = 0;

            // =========================================
            // 🎨 EMBED
            // =========================================

            function createEmbed(anime) {

                const title =
                    anime.title?.english ||
                    anime.title?.romaji ||
                    anime.title?.native ||
                    "Bilinmiyor";

                const romaji =
                    anime.title?.romaji ||
                    "Bilinmiyor";

                const native =
                    anime.title?.native ||
                    "Bilinmiyor";

                const description =
                    anime.description
                        ? anime.description
                            .replace(
                                /<[^>]*>/g,
                                ""
                            )
                            .replace(
                                /\n+/g,
                                " "
                            )
                            .slice(0, 900)
                        : "Açıklama bulunamadı.";

                const score =
                    anime.averageScore != null
                        ? `${anime.averageScore}/100`
                        : "Bilinmiyor";

                const popularity =
                    anime.popularity != null
                        ? Number(
                            anime.popularity
                        ).toLocaleString("tr-TR")
                        : "Bilinmiyor";

                const episodes =
                    anime.episodes ??
                    "Bilinmiyor";

                const duration =
                    anime.duration
                        ? `${anime.duration} dk`
                        : "Bilinmiyor";

                const genres =
                    anime.genres?.length
                        ? anime.genres
                            .map(
                                genre =>
                                    `\`${genre}\``
                            )
                            .join(" ")
                        : "Bilinmiyor";

                const studios =
                    anime.studios?.nodes?.length
                        ? anime.studios.nodes
                            .map(
                                studio =>
                                    studio.name
                            )
                            .join(", ")
                        : "Bilinmiyor";

                const year =
                    anime.seasonYear ||
                    "Bilinmiyor";

                const format =
                    anime.format ||
                    "Bilinmiyor";

                const status =
                    anime.status ||
                    "Bilinmiyor";

                const embed =
                    new EmbedBuilder()
                        .setColor(0x000000)

                        .setTitle(
                            `🎌 ${title}`
                        )

                        .setDescription(
                            `> ${description}`
                        )

                        .addFields(

                            {
                                name: "🇯🇵 Romaji",
                                value: romaji,
                                inline: true
                            },

                            {
                                name: "🈶 Japonca",
                                value: native,
                                inline: true
                            },

                            {
                                name: "⭐ Puan",
                                value: score,
                                inline: true
                            },

                            {
                                name: "🎬 Bölüm",
                                value: String(
                                    episodes
                                ),
                                inline: true
                            },

                            {
                                name: "📺 Durum",
                                value: status,
                                inline: true
                            },

                            {
                                name: "🎞️ Format",
                                value: format,
                                inline: true
                            },

                            {
                                name: "📅 Yıl",
                                value: String(
                                    year
                                ),
                                inline: true
                            },

                            {
                                name: "⏱️ Bölüm Süresi",
                                value: duration,
                                inline: true
                            },

                            {
                                name: "👥 Popülerlik",
                                value: popularity,
                                inline: true
                            },

                            {
                                name: "🏷️ Türler",
                                value: genres,
                                inline: false
                            },

                            {
                                name: "🏢 Stüdyo",
                                value: studios,
                                inline: false
                            }
                        )

                        .setFooter({
                            text:
                                `🎌 Anime Sistemi • ${index + 1}/${results.length}`
                        })

                        .setTimestamp();

                const image =
                    anime.coverImage?.extraLarge ||
                    anime.coverImage?.large;

                if (image) {
                    embed.setImage(image);
                }

                return embed;
            }

            // =========================================
            // 🔘 BUTONLAR
            // =========================================

            function createButtons(anime) {

                const previous =
                    new ButtonBuilder()
                        .setCustomId(
                            "anime_previous"
                        )
                        .setEmoji("⬅️")
                        .setLabel("Önceki")
                        .setStyle(
                            ButtonStyle.Secondary
                        );

                const next =
                    new ButtonBuilder()
                        .setCustomId(
                            "anime_next"
                        )
                        .setEmoji("➡️")
                        .setLabel("Sonraki")
                        .setStyle(
                            ButtonStyle.Secondary
                        );

                const info =
                    new ButtonBuilder()
                        .setLabel(
                            "AniList"
                        )
                        .setEmoji("🌐")
                        .setStyle(
                            ButtonStyle.Link
                        );

                if (anime.siteUrl) {
                    info.setURL(
                        anime.siteUrl
                    );
                } else {
                    info.setDisabled(true);
                }

                return new ActionRowBuilder()
                    .addComponents(
                        previous,
                        next,
                        info
                    );
            }

            // =========================================
            // 📤 PANEL
            // =========================================

            await loading.edit({
                content: null,

                embeds: [
                    createEmbed(
                        results[index]
                    )
                ],

                components: [
                    createButtons(
                        results[index]
                    )
                ]
            });

            // =========================================
            // 🖱️ BUTON SİSTEMİ
            // =========================================

            const collector =
                loading.createMessageComponentCollector({
                    time: 120000
                });

            collector.on(
                "collect",
                async interaction => {

                    if (
                        interaction.user.id !==
                        message.author.id
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Bu paneli sadece komutu kullanan kişi kullanabilir.",
                            ephemeral: true
                        });
                    }

                    if (
                        interaction.customId ===
                        "anime_previous"
                    ) {

                        index--;

                        if (index < 0) {
                            index =
                                results.length - 1;
                        }
                    }

                    if (
                        interaction.customId ===
                        "anime_next"
                    ) {

                        index++;

                        if (
                            index >=
                            results.length
                        ) {
                            index = 0;
                        }
                    }

                    const anime =
                        results[index];

                    await interaction.update({
                        embeds: [
                            createEmbed(anime)
                        ],

                        components: [
                            createButtons(anime)
                        ]
                    });
                }
            );

            // =========================================
            // ⏰ PANELİ KAPAT
            // =========================================

            collector.on(
                "end",
                async () => {

                    try {

                        const anime =
                            results[index];

                        const previous =
                            new ButtonBuilder()
                                .setCustomId(
                                    "anime_previous_disabled"
                                )
                                .setEmoji("⬅️")
                                .setLabel(
                                    "Önceki"
                                )
                                .setStyle(
                                    ButtonStyle.Secondary
                                )
                                .setDisabled(true);

                        const next =
                            new ButtonBuilder()
                                .setCustomId(
                                    "anime_next_disabled"
                                )
                                .setEmoji("➡️")
                                .setLabel(
                                    "Sonraki"
                                )
                                .setStyle(
                                    ButtonStyle.Secondary
                                )
                                .setDisabled(true);

                        const info =
                            new ButtonBuilder()
                                .setLabel(
                                    "AniList"
                                )
                                .setEmoji("🌐")
                                .setStyle(
                                    ButtonStyle.Link
                                );

                        if (anime.siteUrl) {
                            info.setURL(
                                anime.siteUrl
                            );
                        } else {
                            info.setDisabled(true);
                        }

                        await loading.edit({
                            components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        previous,
                                        next,
                                        info
                                    )
                            ]
                        });

                    } catch {}
                }
            );

        } catch (error) {

            console.error(
                "━━━━━━━━━━━━━━━━━━━━"
            );

            console.error(
                "❌ ANİLIST API HATASI"
            );

            console.error(error);

            console.error(
                "━━━━━━━━━━━━━━━━━━━━"
            );

            try {
                await loading.edit(
                    "❌ Anime servisine şu anda ulaşılamıyor. Birkaç saniye sonra tekrar dene."
                );
            } catch {}
        }
    }
};

