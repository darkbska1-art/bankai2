
const {
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(process.cwd(), "davetler.json");

// =====================================================
// 📁 VERİ SİSTEMİ
// =====================================================

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, "{}", "utf8");
        }

        return JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
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
            JSON.stringify(data, null, 2),
            "utf8"
        );

    } catch (error) {

        console.error(
            "❌ davetler.json kaydedilemedi:",
            error
        );
    }
}

function getGuildData(data, guildId) {

    if (!data[guildId]) {

        data[guildId] = {
            users: {},
            members: {},
            rewards: {},
            channelId: null
        };
    }

    if (!data[guildId].users) {
        data[guildId].users = {};
    }

    if (!data[guildId].members) {
        data[guildId].members = {};
    }

    if (!data[guildId].rewards) {
        data[guildId].rewards = {};
    }

    if (!("channelId" in data[guildId])) {
        data[guildId].channelId = null;
    }

    return data[guildId];
}

function getUserData(guildData, userId) {

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
// 👤 ÜYE GETİR
// =====================================================

async function getMember(message) {

    if (message.member) {
        return message.member;
    }

    if (!message.guild) {
        return null;
    }

    return await message.guild.members
        .fetch(message.author.id)
        .catch(() => null);
}

// =====================================================
// 🎁 MEVCUT ÖDÜLLERİ KONTROL ET
// =====================================================

async function giveRewardToEligibleUsers(
    guild,
    guildData,
    amount,
    role
) {

    const botMember = guild.members.me;

    if (!botMember) {

        return {
            success: false,
            reason: "Bot üyesi bulunamadı.",
            given: 0
        };
    }

    // Botun rolü hedef rolden aşağıdaysa veremez
    if (
        role.position >=
        botMember.roles.highest.position
    ) {

        return {
            success: false,
            reason:
                `Botun en yüksek rolü ${role} rolünden yukarıda olmalı.`,
            given: 0
        };
    }

    let given = 0;

    for (
        const [userId, userData]
        of Object.entries(guildData.users)
    ) {

        const valid =
            Number(userData.valid || 0);

        if (valid < amount) {
            continue;
        }

        const member =
            await guild.members
                .fetch(userId)
                .catch(() => null);

        if (!member) {
            continue;
        }

        // Bot / kendisi gibi kullanıcıları atla
        if (member.user.bot) {
            continue;
        }

        if (member.roles.cache.has(role.id)) {
            continue;
        }

        try {

            await member.roles.add(
                role,
                `Davet ödülü: ${amount} geçerli davet`
            );

            given++;

            console.log(
                `🎁 ÖDÜL VERİLDİ | ${guild.name} | ${member.user.tag} | ${role.name}`
            );

        } catch (error) {

            console.error(
                `❌ ${member.user.tag} kullanıcısına ${role.name} rolü verilemedi:`,
                error.message
            );
        }
    }

    return {
        success: true,
        reason: null,
        given
    };
}

// =====================================================
// 🎨 ANA DAVET EMBEDİ
// =====================================================

function createInviteEmbed(
    guild,
    user,
    userData
) {

    const total =
        userData.total || 0;

    const valid =
        userData.valid || 0;

    const left =
        userData.left || 0;

    return new EmbedBuilder()
        .setColor("Blue")
        .setAuthor({
            name:
                `${user.username} • Davet İstatistikleri`,
            iconURL:
                user.displayAvatarURL({
                    size: 256
                })
        })
        .setTitle("📨 Davet Bilgilerin")
        .setDescription(
            `**${user}** kullanıcısının davet istatistikleri aşağıda gösteriliyor.`
        )
        .addFields(
            {
                name: "📨 Toplam Davet",
                value: `**${total}**`,
                inline: true
            },
            {
                name: "✅ Geçerli",
                value: `**${valid}**`,
                inline: true
            },
            {
                name: "📤 Ayrılan",
                value: `**${left}**`,
                inline: true
            }
        )
        .addFields({
            name: "📊 Durum",
            value:
                `👥 Toplam: **${total}**\n` +
                `✅ Geçerli: **${valid}**\n` +
                `📤 Ayrılan: **${left}**`,
            inline: false
        })
        .setThumbnail(
            user.displayAvatarURL({
                size: 512
            })
        )
        .setFooter({
            text:
                `${guild.name} • Davet Sistemi`
        })
        .setTimestamp();
}

// =====================================================
// 🏆 SIRALAMA EMBEDİ
// =====================================================

async function createLeaderboardEmbed(
    guild,
    guildData
) {

    const users =
        Object.entries(guildData.users)
            .filter(([, data]) => {
                return (
                    data.valid || 0
                ) > 0;
            })
            .sort((a, b) => {

                return (
                    b[1].valid || 0
                ) - (
                    a[1].valid || 0
                );

            })
            .slice(0, 10);

    if (!users.length) {

        return new EmbedBuilder()
            .setColor("Gold")
            .setTitle("🏆 Davet Sıralaması")
            .setDescription(
                "📭 Henüz sıralamada gösterilecek davet verisi bulunmuyor."
            )
            .setFooter({
                text:
                    `${guild.name} • Davet Sistemi`
            });
    }

    let description = "";

    for (
        let i = 0;
        i < users.length;
        i++
    ) {

        const [
            userId,
            userData
        ] = users[i];

        let medal;

        if (i === 0) {
            medal = "🥇";
        } else if (i === 1) {
            medal = "🥈";
        } else if (i === 2) {
            medal = "🥉";
        } else {
            medal =
                `**${i + 1}.**`;
        }

        description +=
            `${medal} <@${userId}> — ` +
            `✅ **${userData.valid || 0}** geçerli davet\n`;
    }

    return new EmbedBuilder()
        .setColor("Gold")
        .setTitle("🏆 Davet Sıralaması")
        .setDescription(description)
        .addFields({
            name: "📊 Sıralama",
            value:
                "Sunucudaki en fazla **geçerli davete** sahip ilk 10 kişi gösteriliyor.",
            inline: false
        })
        .setFooter({
            text:
                `${guild.name} • İlk 10`
        })
        .setTimestamp();
}

// =====================================================
// 🎁 ÖDÜLLER EMBEDİ
// =====================================================

function createRewardsEmbed(
    guild,
    guildData
) {

    const rewards =
        Object.entries(
            guildData.rewards
        )
            .sort(
                (a, b) =>
                    Number(a[0]) -
                    Number(b[0])
            );

    if (!rewards.length) {

        return new EmbedBuilder()
            .setColor("Orange")
            .setTitle("🎁 Davet Ödülleri")
            .setDescription(
                "📭 Bu sunucuda henüz davet ödülü ayarlanmamış."
            )
            .setFooter({
                text:
                    `${guild.name} • Davet Sistemi`
            });
    }

    let description = "";

    for (
        const [amount, roleId]
        of rewards
    ) {

        description +=
            `🎟️ **${amount} davet** → <@&${roleId}>\n`;
    }

    return new EmbedBuilder()
        .setColor("Green")
        .setTitle("🎁 Davet Ödülleri")
        .setDescription(description)
        .addFields({
            name: "ℹ️ Bilgi",
            value:
                "Belirtilen geçerli davet sayısına ulaşıldığında ödül rolü otomatik verilir.",
            inline: false
        })
        .setFooter({
            text:
                `${guild.name} • Davet Sistemi`
        })
        .setTimestamp();
}

// =====================================================
// 📋 YARDIM EMBEDİ
// =====================================================

function createHelpEmbed(guild) {

    return new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📨 Davet Sistemi")
        .setDescription(
            "Davet sistemini aşağıdaki komutlarla kullanabilirsin."
        )
        .addFields(
            {
                name: "👤 Kullanıcı Komutları",
                value:
                    "`B!davet` → Kendi davetlerini gösterir\n" +
                    "`B!davet @Üye` → Bir üyenin davetlerini gösterir\n" +
                    "`B!davet sıralama` → Davet sıralamasını gösterir\n" +
                    "`B!davet ödüller` → Davet ödüllerini gösterir",
                inline: false
            },
            {
                name: "⚙️ Yönetici Komutları",
                value:
                    "`B!davet ödül 10 @Rol` → Ödül ekler\n" +
                    "`B!davet ödülsil 10` → Ödül siler\n" +
                    "`B!davet kanal #kanal` → Bildirim kanalı ayarlar\n" +
                    "`B!davet kanalkapat` → Bildirim kanalını kapatır\n" +
                    "`B!davet sıfırla @Üye` → Üyenin davetlerini sıfırlar",
                inline: false
            }
        )
        .setFooter({
            text:
                `${guild.name} • Davet Sistemi`
        })
        .setTimestamp();
}

// =====================================================
// 📨 KOMUT
// =====================================================

module.exports = {

    name: "davet",

    aliases: [
        "invite",
        "invites"
    ],

    data:
        new SlashCommandBuilder()
            .setName("davet")
            .setDescription(
                "Davet istatistiklerini görüntüler"
            )
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName("bilgi")
                        .setDescription(
                            "Kendi davet bilgilerini gösterir"
                        )
            )
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName("siralama")
                        .setDescription(
                            "Davet sıralamasını gösterir"
                        )
            ),

    async execute(
        message,
        args
    ) {

        if (!message.guild) {

            return message.reply(
                "❌ Bu komut sadece sunucularda kullanılabilir."
            );
        }

        const data =
            loadData();

        const guildData =
            getGuildData(
                data,
                message.guild.id
            );

        // =================================================
        // 👤 B!davet
        // =================================================

        if (!args[0]) {

            const userData =
                getUserData(
                    guildData,
                    message.author.id
                );

            return message.reply({
                embeds: [
                    createInviteEmbed(
                        message.guild,
                        message.author,
                        userData
                    )
                ]
            });
        }

        // =================================================
        // 👤 B!davet @Üye
        // =================================================

        const mentionedUser =
            message.mentions?.users?.first?.();

        if (mentionedUser) {

            const userData =
                getUserData(
                    guildData,
                    mentionedUser.id
                );

            return message.reply({
                embeds: [
                    createInviteEmbed(
                        message.guild,
                        mentionedUser,
                        userData
                    )
                ]
            });
        }

        const command =
            args[0].toLowerCase();

        // =================================================
        // 🏆 SIRALAMA
        // =================================================

        if (
            command === "sıralama" ||
            command === "sirala" ||
            command === "leaderboard"
        ) {

            const embed =
                await createLeaderboardEmbed(
                    message.guild,
                    guildData
                );

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 🎁 ÖDÜLLER
        // =================================================

        if (
            command === "ödüller" ||
            command === "oduller"
        ) {

            return message.reply({
                embeds: [
                    createRewardsEmbed(
                        message.guild,
                        guildData
                    )
                ]
            });
        }

        // =================================================
        // 🎁 ÖDÜL EKLE
        // =================================================

        if (
            command === "ödül" ||
            command === "odul"
        ) {

            const member =
                await getMember(message);

            if (
                !member ||
                !member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
                );
            }

            const amount =
                Number(args[1]);

            const role =
                message.mentions?.roles?.first?.();

            if (
                !Number.isInteger(amount) ||
                amount <= 0 ||
                !role
            ) {

                return message.reply(
                    "❌ Kullanım:\n`B!davet ödül 10 @Rol`"
                );
            }

            // Bot üyesi
            const botMember =
                message.guild.members.me;

            if (!botMember) {

                return message.reply(
                    "❌ Botun sunucu üyesi bilgisi alınamadı."
                );
            }

            // Botun Manage Roles yetkisi
            if (
                !botMember.permissions.has(
                    PermissionFlagsBits.ManageRoles
                )
            ) {

                return message.reply(
                    "❌ Botun **Rolleri Yönet** yetkisi yok."
                );
            }

            // @everyone kontrolü
            if (
                role.id ===
                message.guild.id
            ) {

                return message.reply(
                    "❌ @everyone rolü ödül olarak kullanılamaz."
                );
            }

            // Yönetilen entegrasyon rolleri
            if (role.managed) {

                return message.reply(
                    "❌ Bu rol bir entegrasyon tarafından yönetiliyor ve bot tarafından verilemez."
                );
            }

            // Rol hiyerarşisi
            if (
                role.position >=
                botMember.roles.highest.position
            ) {

                return message.reply(
                    `❌ **${role.name}** rolü botun en yüksek rolünden yukarıda/eşit.\n` +
                    `Botun rolünü Discord'da bu rolün **üstüne** taşımalısın.`
                );
            }

            // Ödülü kaydet
            guildData.rewards[amount] =
                role.id;

            saveData(data);

            // Daha önceden bu sayıya ulaşmış üyeleri kontrol et
            const result =
                await giveRewardToEligibleUsers(
                    message.guild,
                    guildData,
                    amount,
                    role
                );

            let description =
                `**${amount} geçerli davete** ulaşanlara ${role} rolü verilecek.`;

            if (
                result.success &&
                result.given > 0
            ) {

                description +=
                    `\n\n🎉 Şu anda şartı sağlayan **${result.given} kişiye** rol verildi.`;

            } else if (
                result.success &&
                result.given === 0
            ) {

                description +=
                    `\n\nℹ️ Şu anda bu ödül şartını sağlayan yeni bir üye bulunamadı.`;

            } else if (!result.success) {

                description +=
                    `\n\n⚠️ Ödül kaydedildi fakat mevcut üyeler kontrol edilirken sorun oluştu:\n${result.reason}`;
            }

            const embed =
                new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(
                        "🎁 Davet Ödülü Ayarlandı"
                    )
                    .setDescription(
                        description
                    )
                    .addFields(
                        {
                            name:
                                "🎟️ Gereken Davet",
                            value:
                                `**${amount}**`,
                            inline: true
                        },
                        {
                            name:
                                "🏷️ Ödül Rolü",
                            value:
                                `${role}`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            `${message.guild.name} • Davet Sistemi`
                    })
                    .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 🗑️ ÖDÜL SİL
        // =================================================

        if (
            command === "ödülsil" ||
            command === "odulsil"
        ) {

            const member =
                await getMember(message);

            if (
                !member ||
                !member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
                );
            }

            const amount =
                Number(args[1]);

            if (
                !Number.isInteger(amount)
            ) {

                return message.reply(
                    "❌ Kullanım: `B!davet ödülsil 10`"
                );
            }

            if (
                !guildData.rewards[amount]
            ) {

                return message.reply(
                    "❌ Bu sayıda davet için ayarlanmış bir ödül bulunamadı."
                );
            }

            const roleId =
                guildData.rewards[amount];

            delete guildData.rewards[amount];

            saveData(data);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(
                            "🗑️ Davet Ödülü Silindi"
                        )
                        .setDescription(
                            `**${amount} davet** ödülü başarıyla kaldırıldı.\n\n` +
                            `🏷️ Rol: <@&${roleId}>`
                        )
                        .setFooter({
                            text:
                                `${message.guild.name} • Davet Sistemi`
                        })
                        .setTimestamp()
                ]
            });
        }

        // =================================================
        // 📢 KANAL AYARLA
        // =================================================

        if (
            command === "kanal"
        ) {

            const member =
                await getMember(message);

            if (
                !member ||
                !member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
                );
            }

            const channel =
                message.mentions?.channels?.first?.();

            if (!channel) {

                return message.reply(
                    "❌ Kullanım:\n`B!davet kanal #kanal`"
                );
            }

            if (
                !channel.isTextBased()
            ) {

                return message.reply(
                    "❌ Bu kanal mesaj gönderilebilir bir kanal değil."
                );
            }

            const botMember =
                message.guild.members.me;

            if (!botMember) {

                return message.reply(
                    "❌ Botun sunucu üyesi bilgisi alınamadı."
                );
            }

            // Kanal izinlerini kontrol et
            const permissions =
                channel.permissionsFor(
                    botMember
                );

            if (
                !permissions?.has(
                    PermissionFlagsBits.ViewChannel
                )
            ) {

                return message.reply(
                    `❌ Botun ${channel} kanalını **Görüntüleme** izni yok.`
                );
            }

            if (
                !permissions?.has(
                    PermissionFlagsBits.SendMessages
                )
            ) {

                return message.reply(
                    `❌ Botun ${channel} kanalında **Mesaj Gönderme** izni yok.`
                );
            }

            // Kanalı kaydet
            guildData.channelId =
                channel.id;

            saveData(data);

            // =================================================
            // 📢 KANALA TEST MESAJI
            // =================================================

            try {

                await channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setTitle(
                                "📨 Davet Sistemi Aktif"
                            )
                            .setDescription(
                                "Bu kanal artık davet bildirimleri için kullanılacak."
                            )
                            .addFields({
                                name: "📢 Bildirim Türü",
                                value:
                                    "Sunucuya yeni bir üye katıldığında kullanılan davet ve davet eden kişi burada gösterilecek.",
                                inline: false
                            })
                            .setFooter({
                                text:
                                    `${message.guild.name} • Davet Sistemi`
                            })
                            .setTimestamp()
                    ]
                });

            } catch (error) {

                console.error(
                    `❌ ${channel.name} kanalına test mesajı gönderilemedi:`,
                    error
                );

                return message.reply(
                    `⚠️ Kanal kaydedildi fakat ${channel} kanalına test mesajı gönderilemedi.\n` +
                    `Hata: \`${error.message}\``
                );
            }

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(
                            "📢 Davet Bildirim Kanalı Ayarlandı"
                        )
                        .setDescription(
                            `Yeni davet bildirimleri artık ${channel} kanalına gönderilecek.\n\n` +
                            `✅ Test mesajı kanala gönderildi.`
                        )
                        .addFields({
                            name: "📍 Kanal",
                            value:
                                `${channel}`,
                            inline: true
                        })
                        .setFooter({
                            text:
                                `${message.guild.name} • Davet Sistemi`
                        })
                        .setTimestamp()
                ]
            });
        }

        // =================================================
        // 🔕 KANAL KAPAT
        // =================================================

        if (
            command === "kanalkapat" ||
            command === "kanal-kapat"
        ) {

            const member =
                await getMember(message);

            if (
                !member ||
                !member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
                );
            }

            guildData.channelId =
                null;

            saveData(data);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(
                            "🔕 Davet Bildirimleri Kapatıldı"
                        )
                        .setDescription(
                            "Davet bildirimleri için ayarlanmış kanal kaldırıldı."
                        )
                        .setFooter({
                            text:
                                `${message.guild.name} • Davet Sistemi`
                        })
                        .setTimestamp()
                ]
            });
        }

        // =================================================
        // 🗑️ KULLANICI SIFIRLA
        // =================================================

        if (
            command === "sıfırla" ||
            command === "sifirla"
        ) {

            const member =
                await getMember(message);

            if (
                !member ||
                !member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
                );
            }

            const user =
                message.mentions?.users?.first?.();

            if (!user) {

                return message.reply(
                    "❌ Kullanıcı belirtmelisin.\n`B!davet sıfırla @Kullanıcı`"
                );
            }

            delete guildData.users[user.id];

            for (
                const memberId
                of Object.keys(
                    guildData.members
                )
            ) {

                if (
                    guildData
                        .members[memberId]
                        .inviterId ===
                    user.id
                ) {

                    delete guildData.members[
                        memberId
                    ];
                }
            }

            saveData(data);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(
                            "🗑️ Davet Verileri Sıfırlandı"
                        )
                        .setDescription(
                            `${user} kullanıcısının davet verileri sıfırlandı.`
                        )
                        .setFooter({
                            text:
                                `${message.guild.name} • Davet Sistemi`
                        })
                        .setTimestamp()
                ]
            });
        }

        // =================================================
        // ❓ YARDIM
        // =================================================

        return message.reply({
            embeds: [
                createHelpEmbed(
                    message.guild
                )
            ]
        });
    }
};


