
const {
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "ticket.json");

function load() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    try {
        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch {
        return {};
    }
}

module.exports = {
    name: "ticketkur",
    aliases: ["ticketpanel"],

    async execute(message) {

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply(
                "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
            );
        }

        const channel =
            message.mentions.channels.first();

        if (!channel) {
            return message.reply(
                "❌ Panelin gönderileceği kanalı etiketle.\n\n" +
                "Örnek: `B!ticketkur #destek`"
            );
        }

        const data = load();
        const settings = data[message.guild.id];

        if (!settings?.categoryId || !settings?.staffRoleId) {
            return message.reply(
                "❌ Önce ticket ayarlarını yapmalısın.\n\n" +
                "`B!ticketayar #kategori @Yetkili`"
            );
        }

        const category =
            message.guild.channels.cache.get(
                settings.categoryId
            );

        const staffRole =
            message.guild.roles.cache.get(
                settings.staffRoleId
            );

        if (!category) {
            return message.reply(
                "❌ Ticket kategorisi bulunamadı."
            );
        }

        if (!staffRole) {
            return message.reply(
                "❌ Yetkili rolü bulunamadı."
            );
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF69B4)
            .setTitle("🎫 DESTEK SİSTEMİ")
            .setDescription(
                "Destek almak için aşağıdaki butona tıklayarak ticket oluşturabilirsin.\n\n" +
                "🛡️ Yetkili ekibi açılan ticket üzerinden seninle ilgilenecektir."
            )
            .setFooter({
                text: "🏦 Bankai • Destek Sistemi"
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_destek")
                    .setLabel("Destek Aç")
                    .setEmoji("🎫")
                    .setStyle(ButtonStyle.Primary)
            );

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        return message.reply(
            `✅ Destek paneli ${channel} kanalına gönderildi.`
        );
    }
};

