
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(
    process.cwd(),
    "davetler.json"
);

// =====================================================
// 💾 VERİ
// =====================================================

function loadData() {

    try {

        if (!fs.existsSync(DATA_FILE)) {

            fs.writeFileSync(
                DATA_FILE,
                "{}",
                "utf8"
            );
        }

        return JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "❌ davetler.json okunamadı:",
            error
        );

        return {};
    }
}

function saveData(data) {

    try {

        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(
                data,
                null,
                2
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "❌ davetler.json kaydedilemedi:",
            error
        );
    }
}

// =====================================================
// 🏠 SUNUCU VERİSİ
// =====================================================

function getGuildData(data, guildId) {

    if (!data[guildId]) {

        data[guildId] = {
            users: {},
            members: {},
            rewards: {}
        };
    }

    if (!data[guildId].users)
        data[guildId].users = {};

    if (!data[guildId].members)
        data[guildId].members = {};

    if (!data[guildId].rewards)
        data[guildId].rewards = {};

    return data[guildId];
}

// =====================================================
// 👤 KULLANICI VERİSİ
// =====================================================

function getUserData(
    guildData,
    userId
) {

    if (!guildData.users[userId]) {

        guildData.users[userId] = {
            total: 0,
            valid: 0,
            left: 0
        };
    }

    return guildData.users[userId];
}

// =====================================================
// 🎨 SİYAH EMBED
// =====================================================

function createEmbed() {

    return new EmbedBuilder()
        .setColor("#000000")
        .setTimestamp();
}

// =====================================================
// 📊 ANA DAVET KOMUTU
// =====================================================

module.exports = {

    name: "davet",

    aliases: ["invite", "invites"],

    description:
        "Davet bilgilerini, sıralamayı ve ödülleri gösterir.",

    async execute(message, args) {

        const data =
            loadData();

        const guildData =
            getGuildData(
                data,
                message.guild.id
            );

        // =================================================
        // 📋 B!davet
        // =================================================

        if (!args[0]) {

            const userData =
                getUserData(
                    guildData,
                    message.author.id
                );

            const embed =
                createEmbed()
                    .setTitle(
                        "📨 Davet Bilgileri"
                    )
                    .setThumbnail(
                        message.author.displayAvatarURL({
                            dynamic: true,
                            size: 256
                        })
                    )
                    .setDescription(
                        `${message.author} **davet istatistiklerin:**`
                    )
                    .addFields(

                        {
                            name: "📨 Toplam Davet",
                            value:
                                `**${userData.total}**`,
                            inline: true
                        },

                        {
                            name: "✅ Geçerli Davet",
                            value:
                                `**${userData.valid}**`,
                            inline: true
                        },

                        {
                            name: "📤 Ayrılan",
                            value:
                                `**${userData.left}**`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            `${message.guild.name} • Davet Sistemi`
                    });

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 👤 B!davet @üye
        // =================================================

        if (
            message.mentions.users.size > 0
        ) {

            const user =
                message.mentions.users.first();

            const userData =
                getUserData(
                    guildData,
                    user.id
                );

            const embed =
                createEmbed()
                    .setTitle(
                        "📨 Davet Bilgileri"
                    )
                    .setThumbnail(
                        user.displayAvatarURL({
                            dynamic: true,
                            size: 256
                        })
                    )
                    .setDescription(
                        `${user} **davet istatistikleri:**`
                    )
                    .addFields(

                        {
                            name: "📨 Toplam Davet",
                            value:
                                `**${userData.total}**`,
                            inline: true
                        },

                        {
                            name: "✅ Geçerli Davet",
                            value:
                                `**${userData.valid}**`,
                            inline: true
                        },

                        {
                            name: "📤 Ayrılan",
                            value:
                                `**${userData.left}**`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            `${message.guild.name} • Davet Sistemi`
                    });

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 🏆 B!davet sıralama
        // =================================================

        if (
            args[0].toLowerCase() ===
            "sıralama"
        ) {

            const users =
                Object.entries(
                    guildData.users
                )
                    .map(
                        ([userId, stats]) => ({
                            userId,
                            ...stats
                        })
                    )
                    .sort(
                        (a, b) =>
                            b.valid - a.valid
                    );

            if (users.length === 0) {

                const embed =
                    createEmbed()
                        .setTitle(
                            "🏆 Davet Sıralaması"
                        )
                        .setDescription(
                            "Henüz davet istatistiği bulunmuyor."
                        );

                return message.reply({
                    embeds: [embed]
                });
            }

            const topUsers =
                users.slice(0, 10);

            let description = "";

            for (
                let i = 0;
                i < topUsers.length;
                i++
            ) {

                const user =
                    topUsers[i];

                let medal;

                if (i === 0)
                    medal = "🥇";
                else if (i === 1)
                    medal = "🥈";
                else if (i === 2)
                    medal = "🥉";
                else
                    medal = `**${i + 1}.**`;

                description +=
                    `${medal} <@${user.userId}> — **${user.valid}** geçerli davet\n`;
            }

            const embed =
                createEmbed()
                    .setTitle(
                        "🏆 Davet Sıralaması"
                    )
                    .setDescription(
                        description
                    )
                    .setFooter({
                        text:
                            `${message.guild.name} • İlk 10`
                    });

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 🎁 B!davet ödüller
        // =================================================

        if (
            args[0].toLowerCase() ===
            "ödüller"
        ) {

            const rewards =
                Object.entries(
                    guildData.rewards
                )
                    .sort(
                        ([a], [b]) =>
                            Number(a) -
                            Number(b)
                    );

            const embed =
                createEmbed()
                    .setTitle(
                        "🎁 Davet Ödülleri"
                    );

            if (rewards.length === 0) {

                embed.setDescription(
                    "Henüz ödül ayarlanmamış."
                );

                return message.reply({
                    embeds: [embed]
                });
            }

            let description = "";

            for (
                const [amount, roleId]
                of rewards
            ) {

                const role =
                    message.guild.roles.cache.get(
                        roleId
                    );

                description +=
                    `🎯 **${amount} geçerli davet** → ${role || `Rol bulunamadı`}\n`;
            }

            embed.setDescription(
                description
            );

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 🎁 B!davet ödül 10 @rol
        // =================================================

        if (
            args[0].toLowerCase() ===
            "ödül"
        ) {

            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            const amount =
                Number(args[1]);

            const role =
                message.mentions.roles.first();

            if (
                !Number.isInteger(amount) ||
                amount <= 0 ||
                !role
            ) {

                return message.reply(
                    "❌ Kullanım: `B!davet ödül 10 @Rol`"
                );
            }

            guildData.rewards[
                amount
            ] = role.id;

            saveData(data);

            const embed =
                createEmbed()
                    .setTitle(
                        "🎁 Davet Ödülü Eklendi"
                    )
                    .setDescription(
                        `**${amount} geçerli davet** yapanlara ${role} rolü verilecek.`
                    )
                    .addFields({
                        name: "🎯 Gereken Davet",
                        value:
                            `**${amount}**`,
                        inline: true
                    }, {
                        name: "🏷️ Ödül Rolü",
                        value:
                            `${role}`,
                        inline: true
                    });

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 🗑️ B!davet ödülsil 10
        // =================================================

        if (
            args[0].toLowerCase() ===
            "ödülsil"
        ) {

            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            const amount =
                Number(args[1]);

            if (
                !Number.isInteger(amount) ||
                amount <= 0
            ) {

                return message.reply(
                    "❌ Kullanım: `B!davet ödülsil 10`"
                );
            }

            if (
                !guildData.rewards[
                    amount
                ]
            ) {

                return message.reply(
                    `❌ **${amount}** davet için ayarlanmış bir ödül bulunamadı.`
                );
            }

            delete guildData.rewards[
                amount
            ];

            saveData(data);

            const embed =
                createEmbed()
                    .setTitle(
                        "🗑️ Davet Ödülü Silindi"
                    )
                    .setDescription(
                        `**${amount} geçerli davet** ödülü kaldırıldı.`
                    );

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 🔄 B!davet sıfırla @üye
        // =================================================

        if (
            args[0].toLowerCase() ===
            "sıfırla"
        ) {

            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            const user =
                message.mentions.users.first();

            if (!user) {

                return message.reply(
                    "❌ Kullanım: `B!davet sıfırla @Üye`"
                );
            }

            delete guildData.users[
                user.id
            ];

            for (
                const [memberId, info]
                of Object.entries(
                    guildData.members
                )
            ) {

                if (
                    info.inviterId ===
                    user.id
                ) {

                    delete guildData.members[
                        memberId
                    ];
                }
            }

            saveData(data);

            const embed =
                createEmbed()
                    .setTitle(
                        "🔄 Davet İstatistikleri Sıfırlandı"
                    )
                    .setDescription(
                        `${user} kullanıcısının davet istatistikleri sıfırlandı.`
                    );

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // ❓ YARDIM
        // =================================================

        const embed =
            createEmbed()
                .setTitle(
                    "📨 Davet Komutları"
                )
                .setDescription(
                    [
                        "`B!davet` → Kendi davetlerin",
                        "`B!davet @Üye` → Üyenin davetleri",
                        "`B!davet sıralama` → Davet sıralaması",
                        "`B!davet ödüller` → Davet ödülleri",
                        "`B!davet ödül 10 @Rol` → Ödül ekle",
                        "`B!davet ödülsil 10` → Ödül sil",
                        "`B!davet sıfırla @Üye` → İstatistik sıfırla"
                    ].join("\n")
                )
                .setFooter({
                    text:
                        `${message.guild.name} • Davet Sistemi`
                });

        return message.reply({
            embeds: [embed]
        });
    }
};

