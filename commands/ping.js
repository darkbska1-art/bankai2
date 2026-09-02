
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ping",
    aliases: ["p", "gecikme"],

    async execute(message, args, client) {
        // Handler client göndermiyorsa message.client üzerinden al
        client = client || message.client;

        const start = Date.now();

        try {
            // İlk mesaj
            const msg = await message.reply({
                content: "🏓 Ping ölçülüyor..."
            });

            const messageLatency =
                msg.createdTimestamp - message.createdTimestamp;

            const apiLatency = Math.round(client.ws.ping);

            // Uptime
            const uptime = client.uptime || 0;

            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor(uptime / 3600000) % 24;
            const minutes = Math.floor(uptime / 60000) % 60;
            const seconds = Math.floor(uptime / 1000) % 60;

            const uptimeText =
                `${days}g ${hours}s ${minutes}d ${seconds}sn`;

            // WebSocket durumu
            const wsStatus = client.ws.status;

            const wsStatusText = {
                0: "🟢 READY",
                1: "🟡 CONNECTING",
                2: "🟡 RECONNECTING",
                3: "🔴 IDLE",
                4: "🔴 NEARLY",
                5: "🔴 DISCONNECTED"
            };

            const status =
                wsStatusText[wsStatus] || "⚪ BİLİNMİYOR";

            // Komutun toplam işlem süresi
            const totalLatency = Date.now() - start;

            // Performans
            let performance;

            if (apiLatency < 50) {
                performance = "🚀 Mükemmel";
            } else if (apiLatency < 100) {
                performance = "🟢 Çok iyi";
            } else if (apiLatency < 200) {
                performance = "🟡 İyi";
            } else if (apiLatency < 400) {
                performance = "🟠 Normal";
            } else {
                performance = "🔴 Yüksek";
            }

            const embed = new EmbedBuilder()
                .setTitle("🏓 Bankai • Ping Sistemi")
                .setDescription(
                    "Botun bağlantı ve performans bilgileri aşağıda gösteriliyor."
                )
                .addFields(
                    {
                        name: "📡 Mesaj Gecikmesi",
                        value: `\`${messageLatency}ms\``,
                        inline: true
                    },
                    {
                        name: "🌐 API Gecikmesi",
                        value: `\`${apiLatency}ms\``,
                        inline: true
                    },
                    {
                        name: "⚡ İşlem Süresi",
                        value: `\`${totalLatency}ms\``,
                        inline: true
                    },
                    {
                        name: "📶 WebSocket",
                        value: status,
                        inline: true
                    },
                    {
                        name: "📊 Performans",
                        value: performance,
                        inline: true
                    },
                    {
                        name: "⏱️ Uptime",
                        value: `\`${uptimeText}\``,
                        inline: true
                    },
                    {
                        name: "🏠 Sunucular",
                        value: `\`${client.guilds.cache.size}\``,
                        inline: true
                    },
                    {
                        name: "👥 Kullanıcılar",
                        value: `\`${client.users.cache.size}\``,
                        inline: true
                    },
                    {
                        name: "🤖 Bot",
                        value: `\`${client.user?.tag || "Bilinmiyor"}\``,
                        inline: true
                    }
                )
                .setFooter({
                    text: "Bankai • Sistem Durumu"
                })
                .setTimestamp();

            await msg.edit({
                content: "",
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ Ping komutunda hata:", error);

            // İlk mesaj gönderilebildiyse hata mesajı göster
            try {
                await message.reply(
                    "❌ Ping komutu çalıştırılırken bir hata oluştu."
                );
            } catch {}
        }
    }
};

