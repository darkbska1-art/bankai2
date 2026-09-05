

const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    AttachmentBuilder,
    SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");


module.exports = {

data: new SlashCommandBuilder()
    .setName("yardım")
    .setDescription("Bankai yardım menüsünü gösterir."),

    name: "yardım",

    aliases: [
        "help",
        "h",
        "komutlar"
    ],

    async execute(message, args, client) {

        // mevcut yardım kodunun geri kalanı


        // =====================================================
        // ⚙️ AYARLAR
        // =====================================================

        const config = require("../config.js");

        const prefix =
            Array.isArray(config.prefixes)
                ? config.prefixes[0]
                : config.prefix || "B!";

        // Ichigo / Bankai görseli
        const bankaiPath = path.join(
            __dirname,
            "..",
            "images",
            "bankai.png"
        );

        // =====================================================
        // 📚 KATEGORİLER
        // =====================================================

        const categories = {

            ana: {
                name: "Ana Sayfa",
                emoji: "🏠",
                description:
                    `**${client.user.username}** yardım menüsüne hoş geldin!`
            },

            moderasyon: {
                name: "Moderasyon",
                emoji: "🛡️",
                commands: [
                    ["ban", "Üyeyi sunucudan yasaklar."],
                    ["kick", "Üyeyi sunucudan atar."],
                    ["timeout", "Üyeye zaman aşımı verir."],
                    ["warn", "Üyeyi uyarır."],
                    ["sil", "Mesajları temizler."],
                    ["lock", "Kanalı kilitler."],
                    ["unlock", "Kanalın kilidini açar."],
                    ["unban", "Üyenin yasağını kaldırır."],
                    ["slowmode", "kanalın yavaş modunu ayarlar."],
                    ["poll", "Anket başlatır."]



                ]
            },

            Ayarlanabilir: {
                name: "Ayarlanabilir Komutlar",
                emoji: "📝",
                commands: [
                    ["ticketkur", "Destek panelini gönderir."],
                    ["ticketayarla", "Ticket sistemini ayarlar."],
                    ["boostkanal", "boost kanalını ayarlar."],
                    ["boostkapat", "boost mesajını devre dışı bırakır."],
                    ["seviyesistem", "seviye sistemini ayarlar."],
                ]
            },

            eglence: {
                name: "Eğlence",
                emoji: "🎉",
                commands: [
                    ["çekiliş", "Çekiliş başlatır."],
                    ["avatar", "Avatar görüntüler."],
                    ["banner", "Banner görüntüler."],
                    ["say", "botu konuşturursun."],
                    ["ship", "iki kullanıcı arasındaki uyumu gösterir."]
            
                    
                ]
            },

            anime: {
                name: "Anime",
                emoji: "🎌",
                commands: [
                    ["anime", "Anime arar."],
                    ["animehaber", "Anime haber kanalını ayarlarsınız ."],
                    ["animehbaerkapat", "Anime haberi kapatır."]
                ]
            },

            sistem: {
                name: "Sistem",
                emoji: "⚙️",
                commands: [
                    ["ping", "Botun gecikmesini gösterir."],
                    ["sunucu", "Sunucu bilgilerini gösterir."],
                    ["istatistik", "Bot istatistiklerini gösterir."],
                    
                ]
            }
        };

        // =====================================================
        // 📊 KOMUT SAYISI
        // =====================================================

        const uniqueCommands = new Set();

        for (const command of client.commands.values()) {
            if (command.name) {
                uniqueCommands.add(
                    command.name.toLowerCase()
                );
            }
        }

        // =====================================================
        // 📄 SAYFA SİSTEMİ
        // =====================================================

        let currentCategory = "ana";
        let currentPage = 0;

        const commandsPerPage = 5;

        function getPages(category) {

            const data = categories[category];

            if (!data?.commands?.length) {
                return [[]];
            }

            const pages = [];

            for (
                let i = 0;
                i < data.commands.length;
                i += commandsPerPage
            ) {
                pages.push(
                    data.commands.slice(
                        i,
                        i + commandsPerPage
                    )
                );
            }

            return pages;
        }

        // =====================================================
        // 🎨 EMBED
        // =====================================================

        function createEmbed() {

            const data =
                categories[currentCategory];

            const embed =
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle(
                        `${data.emoji} ${data.name}`
                    )
                    .setFooter({
                        text:
                            `${client.user.username} • Bankai Yardım Sistemi`
                    })
                    .setTimestamp();

            // =================================================
            // 🏠 ANA SAYFA
            // =================================================

            if (currentCategory === "ana") {

                embed.setDescription(
                    `> **${data.description}**\n\n` +
                    "📚 Aşağıdaki menüden bir kategori seçerek komutları görüntüleyebilirsin."
                );

                embed.addFields(
                    {
                        name: "🤖 Bot",
                        value:
                            `${client.user}\n` +
                            `\`${client.user.username}\``,
                        inline: true
                    },
                    {
                        name: "🌐 Sunucu",
                        value:
                            `\`${client.guilds.cache.size}\``,
                        inline: true
                    },
                    {
                        name: "📦 Komut",
                        value:
                            `\`${uniqueCommands.size}\``,
                        inline: true
                    },
                    {
                        name: "👥 Kullanıcı",
                        value:
                            `\`${client.users.cache.size}\``,
                        inline: true
                    },
                    {
                        name: "⚡ Prefix",
                        value:
                            `\`${prefix}\``,
                        inline: true
                    },
                    {
                        name: "📡 Durum",
                        value:
                            "🟢 Çevrimiçi",
                        inline: true
                    }
                );

                embed.addFields({
                    name: "📚 Kategoriler",
                    value:
                        "🛡️ Moderasyon\n" +
                        "📝 Ayarlanabilir komutlar\n" +
                        "🎉 Eğlence\n" +
                        "🎌 Anime\n" +
                        "⚙️ Sistem\n" +
                        "📨 Diğer yardım komudu B!davet yardım\n",
                    inline: false
                });

                if (fs.existsSync(bankaiPath)) {
                    embed.setImage(
                        "attachment://bankai.png"
                    );
                }

                return embed;
            }

            // =================================================
            // 📋 KATEGORİ SAYFASI
            // =================================================

            const pages =
                getPages(currentCategory);

            const page =
                pages[currentPage] || [];

            embed.setDescription(
                `> ${data.emoji} **${data.description}**`
            );

            if (page.length) {

                embed.addFields({
                    name:
                        `📋 ${data.name} Komutları`,
                    value:
                        page
                            .map(
                                ([name, description]) =>
                                    `**${prefix}${name}**\n└─ ${description}`
                            )
                            .join("\n\n"),
                    inline: false
                });
            }

            embed.addFields({
                name: "📖 Sayfa",
                value:
                    `\`${currentPage + 1}/${pages.length}\``,
                inline: true
            });

            embed.addFields({
                name: "📦 Toplam",
                value:
                    `\`${data.commands.length} komut\``,
                inline: true
            });

            return embed;
        }

        // =====================================================
        // 🔽 SELECT MENÜ
        // =====================================================

        const menu =
            new StringSelectMenuBuilder()
                .setCustomId(
                    "bankai_yardim_kategori"
                )
                .setPlaceholder(
                    "📚 Kategori seç..."
                )
                .addOptions(

                    new StringSelectMenuOptionBuilder()
                        .setLabel("Ana Sayfa")
                        .setDescription(
                            "Yardım ana sayfasına dön"
                        )
                        .setEmoji("🏠")
                        .setValue("ana"),

                    new StringSelectMenuOptionBuilder()
                        .setLabel("Moderasyon")
                        .setDescription(
                            "Moderasyon komutları"
                        )
                        .setEmoji("🛡️")
                        .setValue("moderasyon"),

                    new StringSelectMenuOptionBuilder()
                        .setLabel("Ayarlanabilir ")
                        .setDescription(
                            "Sistem komutları"
                        )
                        .setEmoji("📝")
                        .setValue("Ayarlanabilir "),

                    new StringSelectMenuOptionBuilder()
                        .setLabel("Eğlence")
                        .setDescription(
                            "Eğlence komutları"
                        )
                        .setEmoji("🎉")
                        .setValue("eglence"),

                    new StringSelectMenuOptionBuilder()
                        .setLabel("Anime")
                        .setDescription(
                            "Anime komutları"
                        )
                        .setEmoji("🎌")
                        .setValue("anime"),

                    new StringSelectMenuOptionBuilder()
                        .setLabel("Sistem")
                        .setDescription(
                            "Sistem komutları"
                        )
                        .setEmoji("⚙️")
                        .setValue("sistem")
                );

        // =====================================================
        // ◀️ ▶️ SAYFA BUTONLARI
        // =====================================================

        const previousButton =
            new ButtonBuilder()
                .setCustomId(
                    "bankai_yardim_previous"
                )
                .setEmoji("◀️")
                .setStyle(
                    ButtonStyle.Secondary
                );

        const nextButton =
            new ButtonBuilder()
                .setCustomId(
                    "bankai_yardim_next"
                )
                .setEmoji("▶️")
                .setStyle(
                    ButtonStyle.Secondary
                );

        const closeButton =
            new ButtonBuilder()
                .setCustomId(
                    "bankai_yardim_close"
                )
                .setEmoji("🗑️")
                .setLabel("Kapat")
                .setStyle(
                    ButtonStyle.Danger
                );

        const selectRow =
            new ActionRowBuilder()
                .addComponents(menu);

        const buttonRow =
            new ActionRowBuilder()
                .addComponents(
                    previousButton,
                    nextButton,
                    closeButton
                );

        // =====================================================
        // 🔄 BUTON DURUMU
        // =====================================================

        function updateButtons() {

            const pages =
                getPages(currentCategory);

            previousButton.setDisabled(
                currentCategory === "ana" ||
                currentPage <= 0
            );

            nextButton.setDisabled(
                currentCategory === "ana" ||
                currentPage >= pages.length - 1
            );
        }

        updateButtons();

        // =====================================================
        // 📎 DOSYA
        // =====================================================

        const files = [];

        if (fs.existsSync(bankaiPath)) {

            files.push(
                new AttachmentBuilder(
                    bankaiPath,
                    {
                        name: "bankai.png"
                    }
                )
            );
        }

        // =====================================================
        // 📤 MESAJ
        // =====================================================

        const panel =
            await message.reply({
                embeds: [
                    createEmbed()
                ],
                components: [
                    selectRow,
                    buttonRow
                ],
                files
            });

        // =====================================================
        // 🖱️ COLLECTOR
        // =====================================================


const collector =
    panel.createMessageComponentCollector({
        filter: interaction =>
            interaction.user.id === message.author.id,
        time: 300000
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
                            "❌ Bu yardım menüsünü sadece komutu kullanan kişi kullanabilir.",
                        ephemeral: true
                    });
                }

                // =============================================
                // 🔽 KATEGORİ
                // =============================================

                if (
                    interaction.isStringSelectMenu() &&
                    interaction.customId ===
                    "bankai_yardim_kategori"
                ) {

                    currentCategory =
                        interaction.values[0];

                    currentPage = 0;

                    updateButtons();

                    return interaction.update({
                        embeds: [
                            createEmbed()
                        ],
                        components: [
                            selectRow,
                            buttonRow
                        ]
                    });
                }

                // =============================================
                // ◀️ ÖNCEKİ
                // =============================================

                if (
                    interaction.customId ===
                    "bankai_yardim_previous"
                ) {

                    if (currentPage > 0) {
                        currentPage--;
                    }

                    updateButtons();

                    return interaction.update({
                        embeds: [
                            createEmbed()
                        ],
                        components: [
                            selectRow,
                            buttonRow
                        ]
                    });
                }

                // =============================================
                // ▶️ SONRAKİ
                // =============================================

                if (
                    interaction.customId ===
                    "bankai_yardim_next"
                ) {

                    const pages =
                        getPages(
                            currentCategory
                        );

                    if (
                        currentPage <
                        pages.length - 1
                    ) {
                        currentPage++;
                    }

                    updateButtons();

                    return interaction.update({
                        embeds: [
                            createEmbed()
                        ],
                        components: [
                            selectRow,
                            buttonRow
                        ]
                    });
                }

                // =============================================
                // 🗑️ KAPAT
                // =============================================

                if (
                    interaction.customId ===
                    "bankai_yardim_close"
                ) {

                    collector.stop(
                        "closed"
                    );

                    return interaction.update({
                        content:
                            "🗑️ **Yardım menüsü kapatıldı.**",
                        embeds: [],
                        components: [],
                        files: []
                    });
                }
            }
        );

        // =====================================================
        // ⏰ SÜRE DOLUNCA
        // =====================================================

        collector.on(
            "end",
            async (_, reason) => {

                if (reason === "closed") {
                    return;
                }

                try {

                    menu.setDisabled(true);

                    menu.setPlaceholder(
                        "⏰ Yardım menüsünün süresi doldu."
                    );

                    previousButton.setDisabled(true);
                    nextButton.setDisabled(true);
                    closeButton.setDisabled(true);

                    await panel.edit({
                        components: [
                            selectRow,
                            buttonRow
                        ]
                    });

                } catch {}
            }
        );
    }
};

