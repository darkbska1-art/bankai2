const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require("discord.js");

module.exports = {
    name: "sunucubilgi",
    aliases: [
        "serverinfo",
        "sunucubilgisi",
        "sunucu",
        "server"
    ],

    async execute(message, args, client) {
        try {
            const guild = message.guild;

            if (!guild) {
                return message.reply("❌ Bu komut sadece sunucularda kullanılabilir.");
            }

            // =====================================================
            // 👑 SAHİP
            // =====================================================

            let ownerText = "Bilinmiyor";

            try {
                const owner = await guild.fetchOwner();

                ownerText =
                    `${owner.user.tag}\n` +
                    `\`${owner.id}\``;
            } catch {
                ownerText = `\`${guild.ownerId}\``;
            }

            // =====================================================
            // 👥 ÜYE İSTATİSTİKLERİ
            // =====================================================

            const members = guild.members.cache;

            const totalMembers = guild.memberCount;

            const humans = members.filter(
                member => !member.user.bot
            ).size;

            const bots = members.filter(
                member => member.user.bot
            ).size;

            const online = members.filter(
                member =>
                    member.presence?.status === "online"
            ).size;

            const idle = members.filter(
                member =>
                    member.presence?.status === "idle"
            ).size;

            const dnd = members.filter(
                member =>
                    member.presence?.status === "dnd"
            ).size;

            // =====================================================
            // 📺 KANAL İSTATİSTİKLERİ
            // =====================================================

            const channels = guild.channels.cache;

            const textChannels = channels.filter(
                channel =>
                    channel.type === ChannelType.GuildText
            ).size;

            const voiceChannels = channels.filter(
                channel =>
                    channel.type === ChannelType.GuildVoice
            ).size;

            const categoryChannels = channels.filter(
                channel =>
                    channel.type === ChannelType.GuildCategory
            ).size;

            const announcementChannels = channels.filter(
                channel =>
                    channel.type === ChannelType.GuildAnnouncement
            ).size;

            const forumChannels = channels.filter(
                channel =>
                    channel.type === ChannelType.GuildForum
            ).size;

            // =====================================================
            // 🎭 ROL
            // =====================================================

            const roleCount = guild.roles.cache.size - 1;

            // =====================================================
            // 😀 EMOJİ
            // =====================================================

            const emojiCount = guild.emojis.cache.size;

            const animatedEmojiCount =
                guild.emojis.cache.filter(
                    emoji => emoji.animated
                ).size;

            // =====================================================
            // 🚀 BOOST
            // =====================================================

            const boostCount = guild.premiumSubscriptionCount || 0;

            const boostLevel =
                guild.premiumTier || 0;

            const boostText =
                boostLevel === 0
                    ? "Yok"
                    : `Seviye ${boostLevel}`;

            // =====================================================
            // 🔐 DOĞRULAMA
            // =====================================================

            const verificationLevels = {
                0: "Yok",
                1: "Düşük",
                2: "Orta",
                3: "Yüksek",
                4: "Çok Yüksek"
            };

            const verification =
                verificationLevels[guild.verificationLevel] ||
                "Bilinmiyor";

            // =====================================================
            // 📅 OLUŞTURULMA
            // =====================================================

            const createdTimestamp =
                Math.floor(guild.createdTimestamp / 1000);

            // =====================================================
            // 📊 SUNUCU YAŞI
            // =====================================================

            const ageMs =
                Date.now() - guild.createdTimestamp;

            const ageDays =
                Math.floor(ageMs / 86400000);

            // =====================================================
            // 🖼️ SUNUCU İKON
            // =====================================================

            const icon =
                guild.iconURL({
                    size: 1024,
                    extension: "png"
                });

            // =====================================================
            // 🏠 SUNUCU BANNER
            // =====================================================

            const banner =
                guild.bannerURL({
                    size: 1024,
                    extension: "png"
                });

            // =====================================================
            // 📋 EMBED
            // =====================================================

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${guild.name} • Sunucu Bilgileri`,
                    iconURL: icon || undefined
                })
                .setTitle("🏠 Gelişmiş Sunucu Bilgileri")
                .setDescription(
                    `**${guild.name}** sunucusunun detaylı bilgileri aşağıda gösteriliyor.`
                )

                // =================================================
                // 🏠 GENEL
                // =================================================

                .addFields({
                    name: "🏠 Genel Bilgiler",
                    value:
                        `> **Sunucu:** \`${guild.name}\`\n` +
                        `> **Sunucu ID:** \`${guild.id}\`\n` +
                        `> **Sahip:** ${ownerText}\n` +
                        `> **Oluşturulma:** <t:${createdTimestamp}:F>\n` +
                        `> **Yaş:** \`${ageDays} gün\``,
                    inline: false
                })

                // =================================================
                // 👥 ÜYELER
                // =================================================

                .addFields(
                    {
                        name: "👥 Toplam Üye",
                        value: `\`${totalMembers}\``,
                        inline: true
                    },
                    {
                        name: "👤 İnsan",
                        value: `\`${humans}\``,
                        inline: true
                    },
                    {
                        name: "🤖 Bot",
                        value: `\`${bots}\``,
                        inline: true
                    },
                    {
                        name: "🟢 Çevrimiçi",
                        value: `\`${online}\``,
                        inline: true
                    },
                    {
                        name: "🌙 Boşta",
                        value: `\`${idle}\``,
                        inline: true
                    },
                    {
                        name: "⛔ Rahatsız Etmeyin",
                        value: `\`${dnd}\``,
                        inline: true
                    }
                )

                // =================================================
                // 📺 KANALLAR
                // =================================================

                .addFields(
                    {
                        name: "💬 Yazı",
                        value: `\`${textChannels}\``,
                        inline: true
                    },
                    {
                        name: "🔊 Ses",
                        value: `\`${voiceChannels}\``,
                        inline: true
                    },
                    {
                        name: "📁 Kategori",
                        value: `\`${categoryChannels}\``,
                        inline: true
                    },
                    {
                        name: "📢 Duyuru",
                        value: `\`${announcementChannels}\``,
                        inline: true
                    },
                    {
                        name: "💭 Forum",
                        value: `\`${forumChannels}\``,
                        inline: true
                    },
                    {
                        name: "📺 Toplam Kanal",
                        value: `\`${channels.size}\``,
                        inline: true
                    }
                )

                // =================================================
                // 🎭 ROL & EMOJİ
                // =================================================

                .addFields(
                    {
                        name: "🎭 Roller",
                        value: `\`${roleCount}\``,
                        inline: true
                    },
                    {
                        name: "😀 Emojiler",
                        value: `\`${emojiCount}\``,
                        inline: true
                    },
                    {
                        name: "🎞️ Hareketli Emoji",
                        value: `\`${animatedEmojiCount}\``,
                        inline: true
                    }
                )

                // =================================================
                // 🚀 BOOST
                // =================================================

                .addFields({
                    name: "🚀 Sunucu Boost",
                    value:
                        `> **Seviye:** \`${boostText}\`\n` +
                        `> **Boost Sayısı:** \`${boostCount}\``,
                    inline: false
                })

                // =================================================
                // 🔐 GÜVENLİK
                // =================================================

                .addFields({
                    name: "🔐 Güvenlik",
                    value:
                        `> **Doğrulama:** \`${verification}\``,
                    inline: false
                })

                .setFooter({
                    text: `Bankai • ${guild.name}`
                })
                .setTimestamp();

            if (icon) {
                embed.setThumbnail(icon);
            }

            if (banner) {
                embed.setImage(banner);
            }

            // =====================================================
            // 🔘 BUTONLAR
            // =====================================================

            const row = new ActionRowBuilder();

            if (icon) {
                row.addComponents(
                    new ButtonBuilder()
                        .setLabel("🖼️ Sunucu İkonu")
                        .setStyle(ButtonStyle.Link)
                        .setURL(icon)
                );
            }

            row.addComponents(
                new ButtonBuilder()
                    .setLabel("🆔 Sunucu ID")
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId("server_info_id")
            );

            const sent = await message.reply({
                embeds: [embed],
                components: [row]
            });

            // =====================================================
            // 🔘 BUTON
            // =====================================================

            const collector =
                sent.createMessageComponentCollector({
                    time: 60000
                });

            collector.on("collect", async interaction => {

                if (
                    interaction.user.id !==
                    message.author.id
                ) {
                    return interaction.reply({
                        content:
                            "❌ Bu butonu sadece komutu kullanan kişi kullanabilir.",
                        ephemeral: true
                    });
                }

                if (
                    interaction.customId ===
                    "server_info_id"
                ) {
                    await interaction.reply({
                        content:
                            `🆔 **${guild.name}** Sunucu ID:\n\`${guild.id}\``,
                        ephemeral: true
                    });
                }
            });

        } catch (error) {
            console.error(
                "❌ Sunucu bilgi komutunda hata:",
                error
            );

            await message.reply(
                "❌ Sunucu bilgileri alınırken bir hata oluştu."
            );
        }
    }
};

