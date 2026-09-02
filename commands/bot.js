
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const os = require("os");

module.exports = {
    name: "botbilgi",

    aliases: [
        "botinfo",
        "botbilgisi",
        "botistatistik",
        "istatistik"
    ],

    async execute(message, args, client) {
        try {
            const bot = client.user;

            // =====================================================
            // ⏱️ UPTIME
            // =====================================================

            const uptime = client.uptime || 0;

            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor(uptime / 3600000) % 24;
            const minutes = Math.floor(uptime / 60000) % 60;
            const seconds = Math.floor(uptime / 1000) % 60;

            const uptimeText =
                `${days}g ${hours}s ${minutes}d ${seconds}sn`;

            // =====================================================
            // 📊 İSTATİSTİKLER
            // =====================================================

            const guildCount = client.guilds.cache.size;
            const userCount = client.users.cache.size;

            const channelCount = client.channels.cache.size;

            const textChannels = client.channels.cache.filter(
                channel => channel.isTextBased()
            ).size;

            const voiceChannels = client.channels.cache.filter(
                channel => channel.isVoiceBased()
            ).size;

            const commandCount = client.commands
                ? client.commands.size
                : 0;

            // =====================================================
            // 💾 RAM
            // =====================================================

            const memory = process.memoryUsage();

            const ramUsed =
                (memory.rss / 1024 / 1024).toFixed(2);

            const heapUsed =
                (memory.heapUsed / 1024 / 1024).toFixed(2);

            const heapTotal =
                (memory.heapTotal / 1024 / 1024).toFixed(2);

            // =====================================================
            // 🖥️ CPU
            // =====================================================

            const cpuModel = os.cpus()[0]?.model || "Bilinmiyor";

            const cpuCores = os.cpus().length;

            const load = os.loadavg()[0];

            const cpuUsage = Math.min(
                100,
                ((load / cpuCores) * 100)
            ).toFixed(1);

            // =====================================================
            // 📡 DISCORD
            // =====================================================

            const ping = Math.round(client.ws.ping);

            let pingStatus;

            if (ping < 50) {
                pingStatus = "🟢 Mükemmel";
            } else if (ping < 100) {
                pingStatus = "🟢 Çok iyi";
            } else if (ping < 200) {
                pingStatus = "🟡 İyi";
            } else if (ping < 400) {
                pingStatus = "🟠 Normal";
            } else {
                pingStatus = "🔴 Yüksek";
            }

            const wsStatus = client.ws.status;

            const wsStatusText = {
                0: "🟢 READY",
                1: "🟡 CONNECTING",
                2: "🟡 RECONNECTING",
                3: "🔴 IDLE",
                4: "🔴 NEARLY",
                5: "🔴 DISCONNECTED"
            };

            const websocket =
                wsStatusText[wsStatus] ||
                "⚪ BİLİNMİYOR";

            // =====================================================
            // 📦 SÜRÜMLER
            // =====================================================

            const discordVersion =
                require("discord.js").version;

            const nodeVersion =
                process.version;

            // =====================================================
            // 📅 BOT YAŞI
            // =====================================================

            const createdTimestamp =
                Math.floor(bot.createdTimestamp / 1000);

            // =====================================================
            // 🧩 SHARD
            // =====================================================

            let shardInfo = "Tek shard";

            if (client.ws.shards?.size) {
                shardInfo =
                    `${client.ws.shards.size} shard`;
            }

            // =====================================================
            // 🟢 DURUM
            // =====================================================

            const status = bot.presence?.status || "online";

            const statusText = {
                online: "🟢 Online",
                idle: "🟡 Boşta",
                dnd: "🔴 Rahatsız Etmeyin",
                offline: "⚫ Çevrimdışı"
            };

            // =====================================================
            // 📋 EMBED
            // =====================================================

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${bot.username} • Bot Bilgileri`,
                    iconURL: bot.displayAvatarURL({
                        size: 256
                    })
                })

                .setThumbnail(
                    bot.displayAvatarURL({
                        size: 512
                    })
                )

                .setDescription(
                    `🤖 **${bot.username}** botunun detaylı sistem ve istatistik bilgileri.`
                )

                // =================================================
                // 🤖 BOT
                // =================================================

                .addFields({
                    name: "🤖 Bot Bilgileri",
                    value:
                        `> **İsim:** \`${bot.tag}\`\n` +
                        `> **ID:** \`${bot.id}\`\n` +
                        `> **Durum:** ${statusText[status] || "🟢 Online"}\n` +
                        `> **Oluşturulma:** <t:${createdTimestamp}:R>`,
                    inline: false
                })

                // =================================================
                // 📊 İSTATİSTİKLER
                // =================================================

                .addFields(
                    {
                        name: "🏠 Sunucular",
                        value: `\`${guildCount}\``,
                        inline: true
                    },
                    {
                        name: "👥 Kullanıcılar",
                        value: `\`${userCount}\``,
                        inline: true
                    },
                    {
                        name: "📺 Kanallar",
                        value: `\`${channelCount}\``,
                        inline: true
                    },
                    {
                        name: "💬 Yazı Kanalları",
                        value: `\`${textChannels}\``,
                        inline: true
                    },
                    {
                        name: "🔊 Ses Kanalları",
                        value: `\`${voiceChannels}\``,
                        inline: true
                    },
                    {
                        name: "📦 Komut/Alias",
                        value: `\`${commandCount}\``,
                        inline: true
                    }
                )

                // =================================================
                // 📡 PERFORMANS
                // =================================================

                .addFields({
                    name: "📡 Performans",
                    value:
                        `> **Discord Ping:** \`${ping}ms\`\n` +
                        `> **Değerlendirme:** ${pingStatus}\n` +
                        `> **WebSocket:** ${websocket}\n` +
                        `> **Uptime:** \`${uptimeText}\``,
                    inline: false
                })

                // =================================================
                // 💾 SİSTEM
                // =================================================

                .addFields({
                    name: "💾 Sistem",
                    value:
                        `> **RAM:** \`${ramUsed} MB\`\n` +
                        `> **Heap:** \`${heapUsed} / ${heapTotal} MB\`\n` +
                        `> **CPU:** \`${cpuUsage}%\`\n` +
                        `> **CPU Çekirdeği:** \`${cpuCores}\``,
                    inline: false
                })

                // =================================================
                // ⚙️ YAZILIM
                // =================================================

                .addFields({
                    name: "⚙️ Yazılım",
                    value:
                        `> **Node.js:** \`${nodeVersion}\`\n` +
                        `> **Discord.js:** \`v${discordVersion}\`\n` +
                        `> **Platform:** \`${process.platform}\`\n` +
                        `> **Mimari:** \`${process.arch}\`\n` +
                        `> **Shard:** \`${shardInfo}\``,
                    inline: false
                })

                .setFooter({
                    text: "Bankai • Gelişmiş Bot Sistemi"
                })

                .setTimestamp();

            // =====================================================
            // 🔘 BUTONLAR
            // =====================================================

            const row = new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setLabel("🤖 Bot Davet")
                        .setStyle(ButtonStyle.Link)
                        .setURL(
                            `https://discord.com/oauth2/authorize?client_id=${bot.id}&permissions=8&scope=bot%20applications.commands`
                        ),

                    new ButtonBuilder()
                        .setLabel("🆔 Bot ID")
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId("bot_id")
                );

            // =====================================================
            // 📤 GÖNDER
            // =====================================================

            const sentMessage = await message.reply({
                embeds: [embed],
                components: [row]
            });

            // =====================================================
            // 🔘 BOT ID BUTONU
            // =====================================================

            const collector =
                sentMessage.createMessageComponentCollector({
                    time: 60000
                });

            collector.on("collect", async interaction => {

                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content:
                            "❌ Bu butonu sadece komutu kullanan kişi kullanabilir.",
                        ephemeral: true
                    });
                }

                if (interaction.customId === "bot_id") {
                    await interaction.reply({
                        content:
                            `🆔 **${bot.username}** Bot ID:\n\`${bot.id}\``,
                        ephemeral: true
                    });
                }
            });

        } catch (error) {
            console.error(
                "❌ Bot bilgi komutunda hata:",
                error
            );

            await message.reply(
                "❌ Bot bilgileri alınırken bir hata oluştu."
            );
        }
    }
};

