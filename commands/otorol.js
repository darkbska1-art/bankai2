const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../autorole.json");

function loadData() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }

    try {
        return JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 4)
    );
}

module.exports = {
    name: "otorol",

    aliases: [
        "autorole"
    ],

    description: "Üye ve bot otorolünü ayarlar.",

    async execute(message) {

        // Kullanıcı yetkisi
        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Yetkin Yok")
                        .setDescription(
                            "Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                        )
                ]
            });
        }

        // Botun Manage Roles yetkisi
        const botMember = message.guild.members.me;

        if (!botMember) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bot sunucu bilgilerine erişemedi."
                        )
                ]
            });
        }

        if (!botMember.permissions.has(
            PermissionFlagsBits.ManageRoles
        )) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Bot Yetkisi Eksik")
                        .setDescription(
                            "Botun **Rolleri Yönet** yetkisine sahip olması gerekiyor."
                        )
                ]
            });
        }

        /*
        ============================================
        ROLLERİ MESAJDAKİ SIRAYA GÖRE AL
        @Üye @Bot
        ============================================
        */

        const roleIds = [
            ...message.content.matchAll(/<@&(\d+)>/g)
        ].map(match => match[1]);

        if (roleIds.length < 2) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("⚙️ Otorol Ayarlama")
                        .setDescription(
                            "Hem **üye rolünü** hem de **bot rolünü** belirtmelisin."
                        )
                        .addFields({
                            name: "Kullanım",
                            value: "`B!otorol @ÜyeRolü @BotRolü`"
                        })
                ]
            });
        }

        // Mesajdaki sırayı KESİN olarak koruyoruz
        const memberRole = message.guild.roles.cache.get(
            roleIds[0]
        );

        const botRole = message.guild.roles.cache.get(
            roleIds[1]
        );

        if (!memberRole || !botRole) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Rol Bulunamadı")
                        .setDescription(
                            "Belirtilen rollerden biri bulunamadı."
                        )
                ]
            });
        }

        // @everyone kontrolü
        if (
            memberRole.id === message.guild.id ||
            botRole.id === message.guild.id
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Geçersiz Rol")
                        .setDescription(
                            "**@everyone** rolü otorol olarak kullanılamaz."
                        )
                ]
            });
        }

        // Aynı rol kontrolü
        if (memberRole.id === botRole.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Aynı Rol")
                        .setDescription(
                            "Üye rolü ve bot rolü aynı olamaz."
                        )
                ]
            });
        }

        // Üye rolü botun altında mı?
        if (
            memberRole.position >=
            botMember.roles.highest.position
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Rol Hatası")
                        .setDescription(
                            `**${memberRole.name}** rolü botun en yüksek rolünün altında olmalı.`
                        )
                ]
            });
        }

        // Bot rolü botun altında mı?
        if (
            botRole.position >=
            botMember.roles.highest.position
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Rol Hatası")
                        .setDescription(
                            `**${botRole.name}** rolü botun en yüksek rolünün altında olmalı.`
                        )
                ]
            });
        }

        // Kaydet
        const data = loadData();

        data[message.guild.id] = {
            memberRole: memberRole.id,
            botRole: botRole.id
        };

        saveData(data);

        // Başarı mesajı
        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("⚙️ Otorol Ayarlandı")
            .setDescription(
                "Otorol sistemi başarıyla ayarlandı."
            )
            .addFields(
                {
                    name: "👤 Üye Rolü",
                    value: `<@&${memberRole.id}>`,
                    inline: true
                },
                {
                    name: "🤖 Bot Rolü",
                    value: `<@&${botRole.id}>`,
                    inline: true
                }
            )
            .setFooter({
                text: "Bankai • Otorol Sistemi"
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};