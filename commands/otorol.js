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

        const roles = message.mentions.roles;

        if (roles.size < 2) {
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
                            value:
                                "`B!otorol @ÜyeRolü @BotRolü`"
                        })
                ]
            });
        }

        const roleArray = [...roles.values()];

        const memberRole = roleArray[0];
        const botRole = roleArray[1];

        // Botun kendi en yüksek rolünü kontrol et
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

        if (memberRole.position >= botMember.roles.highest.position) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Rol Hatası")
                        .setDescription(
                            `**${memberRole.name}** rolü benim en yüksek rolümün altında olmalı.`
                        )
                ]
            });
        }

        if (botRole.position >= botMember.roles.highest.position) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Rol Hatası")
                        .setDescription(
                            `**${botRole.name}** rolü benim en yüksek rolümün altında olmalı.`
                        )
                ]
            });
        }

        const data = loadData();

        if (!data[message.guild.id]) {
            data[message.guild.id] = {};
        }

        data[message.guild.id].memberRole = memberRole.id;
        data[message.guild.id].botRole = botRole.id;

        saveData(data);

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