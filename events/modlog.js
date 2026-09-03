
const {
    AuditLogEvent
} = require("discord.js");

const {
    sendModLog
} = require("./modlog");

module.exports = (client) => {

    if (client.draysModLogEventsLoaded) {
        console.log("⚠️ DRAYS ModLog eventleri zaten yüklü.");
        return;
    }

    client.draysModLogEventsLoaded = true;

    // =====================================================
    // 🛠️ YARDIMCI FONKSİYONLAR
    // =====================================================

    function cut(text, max = 1000) {
        if (!text) {
            return "Yok";
        }

        text = String(text);

        if (text.length <= max) {
            return text;
        }

        return text.substring(0, max - 3) + "...";
    }

    function userInfo(user) {
        if (!user) {
            return "Bilinmiyor";
        }

        return `${user} \nID: \`${user.id}\``;
    }

    function channelInfo(channel) {
        if (!channel) {
            return "Bilinmiyor";
        }

        return `${channel} \nID: \`${channel.id}\``;
    }

    function roleInfo(role) {
        if (!role) {
            return "Bilinmiyor";
        }

        return `${role} \nID: \`${role.id}\``;
    }

    async function getExecutor(
        guild,
        type,
        targetId = null
    ) {
        try {
            const logs =
                await guild.fetchAuditLogs({
                    type,
                    limit: 10
                });

            const entry =
                logs.entries.find(entry => {

                    if (
                        targetId &&
                        entry.target?.id !== targetId
                    ) {
                        return false;
                    }

                    return (
                        Date.now() -
                        entry.createdTimestamp <
                        10000
                    );
                });

            return entry?.executor || null;

        } catch (error) {
            return null;
        }
    }

    // =====================================================
    // 🗑️ MESAJ SİLİNDİ
    // =====================================================

    client.on(
        "messageDelete",
        async (message) => {

            try {

                if (
                    !message.guild ||
                    message.author?.bot
                ) {
                    return;
                }

                const attachments =
                    message.attachments?.size
                        ? [...message.attachments.values()]
                            .map(
                                attachment =>
                                    attachment.url
                            )
                            .join("\n")
                        : "Yok";

                await sendModLog(
                    client,
                    message.guild.id,
                    "messages",
                    {
                        title: "Mesaj Silindi",
                        emoji: "🗑️",
                        color: 0xED4245,

                        description:
                            `**${message.author?.username || "Bilinmeyen Kullanıcı"}** adlı kullanıcının mesajı silindi.`,

                        fields: [
                            {
                                name: "👤 Kullanıcı",
                                value:
                                    message.author
                                        ? userInfo(message.author)
                                        : "Bilinmiyor",
                                inline: true
                            },

                            {
                                name: "📺 Kanal",
                                value:
                                    channelInfo(
                                        message.channel
                                    ),
                                inline: true
                            },

                            {
                                name: "📝 Mesaj",
                                value:
                                    `\`\`\`\n${cut(
                                        message.content ||
                                        "Mesaj içeriği alınamadı."
                                    )}\n\`\`\``,
                                inline: false
                            },

                            {
                                name: "📎 Ekler",
                                value:
                                    cut(
                                        attachments,
                                        1000
                                    ),
                                inline: false
                            }
                        ],

                        thumbnail:
                            message.author
                                ?.displayAvatarURL({
                                    size: 256
                                })
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Mesaj silme ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // ✏️ MESAJ DÜZENLENDİ
    // =====================================================

    client.on(
        "messageUpdate",
        async (
            oldMessage,
            newMessage
        ) => {

            try {

                if (
                    !newMessage.guild ||
                    newMessage.author?.bot
                ) {
                    return;
                }

                if (
                    oldMessage.content ===
                    newMessage.content
                ) {
                    return;
                }

                await sendModLog(
                    client,
                    newMessage.guild.id,
                    "messages",
                    {
                        title: "Mesaj Düzenlendi",
                        emoji: "✏️",
                        color: 0xFEE75C,

                        description:
                            `**${newMessage.author?.username || "Bilinmeyen Kullanıcı"}** adlı kullanıcı mesajını düzenledi.`,

                        fields: [
                            {
                                name: "👤 Kullanıcı",
                                value:
                                    userInfo(
                                        newMessage.author
                                    ),
                                inline: true
                            },

                            {
                                name: "📺 Kanal",
                                value:
                                    channelInfo(
                                        newMessage.channel
                                    ),
                                inline: true
                            },

                            {
                                name: "⬅️ Eski Mesaj",
                                value:
                                    `\`\`\`\n${cut(
                                        oldMessage.content ||
                                        "İçerik alınamadı."
                                    )}\n\`\`\``,
                                inline: false
                            },

                            {
                                name: "➡️ Yeni Mesaj",
                                value:
                                    `\`\`\`\n${cut(
                                        newMessage.content ||
                                        "İçerik alınamadı."
                                    )}\n\`\`\``,
                                inline: false
                            },

                            {
                                name: "🔗 Mesaj",
                                value:
                                    newMessage.url ||
                                    "Yok",
                                inline: false
                            }
                        ],

                        thumbnail:
                            newMessage.author
                                ?.displayAvatarURL({
                                    size: 256
                                })
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Mesaj düzenleme ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 👋 ÜYE GİRDİ
    // =====================================================

    client.on(
        "guildMemberAdd",
        async (member) => {

            try {

                await sendModLog(
                    client,
                    member.guild.id,
                    "members",
                    {
                        title:
                            member.user.bot
                                ? "Bot Sunucuya Katıldı"
                                : "Üye Sunucuya Katıldı",

                        emoji:
                            member.user.bot
                                ? "🤖"
                                : "📥",

                        color: 0x57F287,

                        description:
                            `${member} sunucuya katıldı.`,

                        fields: [
                            {
                                name: "👤 Kullanıcı",
                                value:
                                    userInfo(
                                        member.user
                                    ),
                                inline: true
                            },

                            {
                                name: "🤖 Bot",
                                value:
                                    member.user.bot
                                        ? "Evet"
                                        : "Hayır",
                                inline: true
                            },

                            {
                                name: "📊 Üye Sayısı",
                                value:
                                    `\`${member.guild.memberCount}\``,
                                inline: true
                            },

                            {
                                name: "📅 Hesap Oluşturulma",
                                value:
                                    `<t:${Math.floor(
                                        member.user.createdTimestamp /
                                        1000
                                    )}:F>`,
                                inline: false
                            }
                        ],

                        thumbnail:
                            member.user
                                .displayAvatarURL({
                                    size: 256
                                })
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Üye giriş ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 👋 ÜYE ÇIKTI
    // =====================================================

    client.on(
        "guildMemberRemove",
        async (member) => {

            try {

                await sendModLog(
                    client,
                    member.guild.id,
                    "members",
                    {
                        title: "Üye Sunucudan Ayrıldı",
                        emoji: "📤",
                        color: 0xED4245,

                        description:
                            `**${member.user.username}** sunucudan ayrıldı.`,

                        fields: [
                            {
                                name: "👤 Kullanıcı",
                                value:
                                    userInfo(
                                        member.user
                                    ),
                                inline: true
                            },

                            {
                                name: "🆔 ID",
                                value:
                                    `\`${member.id}\``,
                                inline: true
                            },

                            {
                                name: "📊 Kalan Üye",
                                value:
                                    `\`${member.guild.memberCount}\``,
                                inline: true
                            }
                        ],

                        thumbnail:
                            member.user
                                .displayAvatarURL({
                                    size: 256
                                })
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Üye çıkış ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 🏷️ KULLANICI / NICKNAME DEĞİŞTİ
    // =====================================================

    client.on(
        "userUpdate",
        async (oldUser, newUser) => {

            try {

                if (
                    oldUser.username ===
                    newUser.username
                ) {
                    return;
                }

                for (
                    const guild
                    of client.guilds.cache.values()
                ) {

                    const member =
                        guild.members.cache.get(
                            newUser.id
                        );

                    if (!member) {
                        continue;
                    }

                    await sendModLog(
                        client,
                        guild.id,
                        "members",
                        {
                            title:
                                "Kullanıcı Adı Değiştirildi",
                            emoji: "🏷️",
                            color: 0x5865F2,

                            fields: [
                                {
                                    name: "👤 Kullanıcı",
                                    value:
                                        userInfo(
                                            newUser
                                        ),
                                    inline: true
                                },

                                {
                                    name: "⬅️ Eski Kullanıcı Adı",
                                    value:
                                        `\`${cut(
                                            oldUser.username,
                                            100
                                        )}\``,
                                    inline: true
                                },

                                {
                                    name: "➡️ Yeni Kullanıcı Adı",
                                    value:
                                        `\`${cut(
                                            newUser.username,
                                            100
                                        )}\``,
                                    inline: true
                                }
                            ],

                            thumbnail:
                                newUser
                                    .displayAvatarURL({
                                        size: 256
                                    })
                        }
                    );
                }

            } catch (error) {
                console.error(
                    "❌ Kullanıcı adı ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 🏷️ NICKNAME DEĞİŞTİ
    // =====================================================

    client.on(
        "guildMemberUpdate",
        async (
            oldMember,
            newMember
        ) => {

            try {

                // =================================================
                // NICKNAME
                // =================================================

                if (
                    oldMember.nickname !==
                    newMember.nickname
                ) {

                    await sendModLog(
                        client,
                        newMember.guild.id,
                        "members",
                        {
                            title:
                                "Nickname Değiştirildi",
                            emoji: "🏷️",
                            color: 0x5865F2,

                            fields: [
                                {
                                    name: "👤 Kullanıcı",
                                    value:
                                        userInfo(
                                            newMember.user
                                        ),
                                    inline: true
                                },

                                {
                                    name: "⬅️ Eski",
                                    value:
                                        `\`${oldMember.nickname || "Yok"}\``,
                                    inline: true
                                },

                                {
                                    name: "➡️ Yeni",
                                    value:
                                        `\`${newMember.nickname || "Yok"}\``,
                                    inline: true
                                }
                            ]
                        }
                    );
                }

                // =================================================
                // ROL EKLEME / ÇIKARMA
                // =================================================

                const oldRoles =
                    new Set(
                        oldMember.roles.cache.keys()
                    );

                const newRoles =
                    new Set(
                        newMember.roles.cache.keys()
                    );

                const addedRoles =
                    [...newRoles]
                        .filter(
                            id =>
                                !oldRoles.has(id) &&
                                id !== newMember.guild.id
                        );

                const removedRoles =
                    [...oldRoles]
                        .filter(
                            id =>
                                !newRoles.has(id) &&
                                id !== newMember.guild.id
                        );

                for (const roleId of addedRoles) {

                    const role =
                        newMember.guild.roles.cache.get(
                            roleId
                        );

                    if (!role) {
                        continue;
                    }

                    const executor =
                        await getExecutor(
                            newMember.guild,
                            AuditLogEvent.MemberRoleUpdate,
                            newMember.id
                        );

                    await sendModLog(
                        client,
                        newMember.guild.id,
                        "moderation",
                        {
                            title: "Rol Verildi",
                            emoji: "➕",
                            color: 0x57F287,

                            fields: [
                                {
                                    name: "👤 Kullanıcı",
                                    value:
                                        userInfo(
                                            newMember.user
                                        ),
                                    inline: true
                                },

                                {
                                    name: "🎭 Rol",
                                    value:
                                        roleInfo(role),
                                    inline: true
                                },

                                {
                                    name: "🛡️ Yetkili",
                                    value:
                                        executor
                                            ? userInfo(
                                                executor
                                            )
                                            : "Bilinmiyor",
                                    inline: false
                                }
                            ]
                        }
                    );
                }

                for (const roleId of removedRoles) {

                    const role =
                        oldMember.guild.roles.cache.get(
                            roleId
                        );

                    if (!role) {
                        continue;
                    }

                    const executor =
                        await getExecutor(
                            newMember.guild,
                            AuditLogEvent.MemberRoleUpdate,
                            newMember.id
                        );

                    await sendModLog(
                        client,
                        newMember.guild.id,
                        "moderation",
                        {
                            title: "Rol Alındı",
                            emoji: "➖",
                            color: 0xED4245,

                            fields: [
                                {
                                    name: "👤 Kullanıcı",
                                    value:
                                        userInfo(
                                            newMember.user
                                        ),
                                    inline: true
                                },

                                {
                                    name: "🎭 Rol",
                                    value:
                                        roleInfo(role),
                                    inline: true
                                },

                                {
                                    name: "🛡️ Yetkili",
                                    value:
                                        executor
                                            ? userInfo(
                                                executor
                                            )
                                            : "Bilinmiyor",
                                    inline: false
                                }
                            ]
                        }
                    );
                }

            } catch (error) {
                console.error(
                    "❌ Üye güncelleme ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 🔨 BAN
    // =====================================================

    client.on(
        "guildBanAdd",
        async (ban) => {

            try {

                const executor =
                    await getExecutor(
                        ban.guild,
                        AuditLogEvent.MemberBanAdd,
                        ban.user.id
                    );

                await sendModLog(
                    client,
                    ban.guild.id,
                    "moderation",
                    {
                        title: "Üye Yasaklandı",
                        emoji: "🔨",
                        color: 0xED4245,

                        fields: [
                            {
                                name: "👤 Yasaklanan",
                                value:
                                    userInfo(
                                        ban.user
                                    ),
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            },

                            {
                                name: "📝 Sebep",
                                value:
                                    cut(
                                        ban.reason ||
                                        "Sebep belirtilmedi."
                                    ),
                                inline: false
                            }
                        ],

                        thumbnail:
                            ban.user
                                .displayAvatarURL({
                                    size: 256
                                })
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Ban ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 🔓 UNBAN
    // =====================================================

    client.on(
        "guildBanRemove",
        async (ban) => {

            try {

                const executor =
                    await getExecutor(
                        ban.guild,
                        AuditLogEvent.MemberBanRemove,
                        ban.user.id
                    );

                await sendModLog(
                    client,
                    ban.guild.id,
                    "moderation",
                    {
                        title: "Yasak Kaldırıldı",
                        emoji: "🔓",
                        color: 0x57F287,

                        fields: [
                            {
                                name: "👤 Kullanıcı",
                                value:
                                    userInfo(
                                        ban.user
                                    ),
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Unban ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // ⏱️ TIMEOUT
    // =====================================================

    client.on(
        "guildMemberUpdate",
        async (
            oldMember,
            newMember
        ) => {

            try {

                const oldTimeout =
                    oldMember.communicationDisabledUntilTimestamp;

                const newTimeout =
                    newMember.communicationDisabledUntilTimestamp;

                if (
                    oldTimeout ===
                    newTimeout
                ) {
                    return;
                }

                const executor =
                    await getExecutor(
                        newMember.guild,
                        AuditLogEvent.MemberUpdate,
                        newMember.id
                    );

                if (newTimeout) {

                    await sendModLog(
                        client,
                        newMember.guild.id,
                        "moderation",
                        {
                            title: "Timeout Verildi",
                            emoji: "⏱️",
                            color: 0xFEE75C,

                            fields: [
                                {
                                    name: "👤 Kullanıcı",
                                    value:
                                        userInfo(
                                            newMember.user
                                        ),
                                    inline: true
                                },

                                {
                                    name: "🛡️ Yetkili",
                                    value:
                                        executor
                                            ? userInfo(
                                                executor
                                            )
                                            : "Bilinmiyor",
                                    inline: true
                                },

                                {
                                    name: "⏰ Bitiş",
                                    value:
                                        `<t:${Math.floor(
                                            newTimeout / 1000
                                        )}:F>`,
                                    inline: false
                                }
                            ]
                        }
                    );

                } else {

                    await sendModLog(
                        client,
                        newMember.guild.id,
                        "moderation",
                        {
                            title: "Timeout Kaldırıldı",
                            emoji: "✅",
                            color: 0x57F287,

                            fields: [
                                {
                                    name: "👤 Kullanıcı",
                                    value:
                                        userInfo(
                                            newMember.user
                                        ),
                                    inline: true
                                },

                                {
                                    name: "🛡️ Yetkili",
                                    value:
                                        executor
                                            ? userInfo(
                                                executor
                                            )
                                            : "Bilinmiyor",
                                    inline: true
                                }
                            ]
                        }
                    );
                }

            } catch (error) {
                console.error(
                    "❌ Timeout ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 📁 KANAL OLUŞTURULDU
    // =====================================================

    client.on(
        "channelCreate",
        async (channel) => {

            try {

                if (!channel.guild) {
                    return;
                }

                const executor =
                    await getExecutor(
                        channel.guild,
                        AuditLogEvent.ChannelCreate,
                        channel.id
                    );

                await sendModLog(
                    client,
                    channel.guild.id,
                    "server",
                    {
                        title: "Kanal Oluşturuldu",
                        emoji: "📁",
                        color: 0x57F287,

                        fields: [
                            {
                                name: "📺 Kanal",
                                value:
                                    channelInfo(
                                        channel
                                    ),
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            },

                            {
                                name: "📂 Tür",
                                value:
                                    `\`${channel.type}\``,
                                inline: true
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Kanal oluşturma ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 🗑️ KANAL SİLİNDİ
    // =====================================================

    client.on(
        "channelDelete",
        async (channel) => {

            try {

                if (!channel.guild) {
                    return;
                }

                const executor =
                    await getExecutor(
                        channel.guild,
                        AuditLogEvent.ChannelDelete,
                        channel.id
                    );

                await sendModLog(
                    client,
                    channel.guild.id,
                    "server",
                    {
                        title: "Kanal Silindi",
                        emoji: "🗑️",
                        color: 0xED4245,

                        fields: [
                            {
                                name: "📺 Kanal",
                                value:
                                    `#${channel.name}\nID: \`${channel.id}\``,
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Kanal silme ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // ✏️ KANAL DEĞİŞTİ
    // =====================================================

    client.on(
        "channelUpdate",
        async (
            oldChannel,
            newChannel
        ) => {

            try {

                if (!newChannel.guild) {
                    return;
                }

                const changes = [];

                if (
                    oldChannel.name !==
                    newChannel.name
                ) {
                    changes.push(
                        `**İsim:** \`${oldChannel.name}\` → \`${newChannel.name}\``
                    );
                }

                if (
                    oldChannel.parentId !==
                    newChannel.parentId
                ) {
                    changes.push(
                        `**Kategori:** \`${oldChannel.parentId || "Yok"}\` → \`${newChannel.parentId || "Yok"}\``
                    );
                }

                if (
                    oldChannel.rateLimitPerUser !==
                    newChannel.rateLimitPerUser
                ) {
                    changes.push(
                        `**Slowmode:** \`${oldChannel.rateLimitPerUser || 0}s\` → \`${newChannel.rateLimitPerUser || 0}s\``
                    );
                }

                if (!changes.length) {
                    return;
                }

                const executor =
                    await getExecutor(
                        newChannel.guild,
                        AuditLogEvent.ChannelUpdate,
                        newChannel.id
                    );

                await sendModLog(
                    client,
                    newChannel.guild.id,
                    "server",
                    {
                        title: "Kanal Güncellendi",
                        emoji: "✏️",
                        color: 0xFEE75C,

                        fields: [
                            {
                                name: "📺 Kanal",
                                value:
                                    channelInfo(
                                        newChannel
                                    ),
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            },

                            {
                                name: "📝 Değişiklikler",
                                value:
                                    changes.join("\n"),
                                inline: false
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Kanal güncelleme ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 🎭 ROL OLUŞTURULDU
    // =====================================================

    client.on(
        "roleCreate",
        async (role) => {

            try {

                const executor =
                    await getExecutor(
                        role.guild,
                        AuditLogEvent.RoleCreate,
                        role.id
                    );

                await sendModLog(
                    client,
                    role.guild.id,
                    "server",
                    {
                        title: "Rol Oluşturuldu",
                        emoji: "🎭",
                        color: 0x57F287,

                        fields: [
                            {
                                name: "🎭 Rol",
                                value:
                                    roleInfo(role),
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Rol oluşturma ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 🗑️ ROL SİLİNDİ
    // =====================================================

    client.on(
        "roleDelete",
        async (role) => {

            try {

                const executor =
                    await getExecutor(
                        role.guild,
                        AuditLogEvent.RoleDelete,
                        role.id
                    );

                await sendModLog(
                    client,
                    role.guild.id,
                    "server",
                    {
                        title: "Rol Silindi",
                        emoji: "🗑️",
                        color: 0xED4245,

                        fields: [
                            {
                                name: "🎭 Rol",
                                value:
                                    `@${role.name}\nID: \`${role.id}\``,
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Rol silme ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // ✏️ ROL GÜNCELLENDİ
    // =====================================================

    client.on(
        "roleUpdate",
        async (
            oldRole,
            newRole
        ) => {

            try {

                const changes = [];

                if (
                    oldRole.name !==
                    newRole.name
                ) {
                    changes.push(
                        `**İsim:** \`${oldRole.name}\` → \`${newRole.name}\``
                    );
                }

                if (
                    oldRole.hexColor !==
                    newRole.hexColor
                ) {
                    changes.push(
                        `**Renk:** \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``
                    );
                }

                if (
                    oldRole.hoist !==
                    newRole.hoist
                ) {
                    changes.push(
                        `**Ayrı göster:** \`${oldRole.hoist}\` → \`${newRole.hoist}\``
                    );
                }

                if (!changes.length) {
                    return;
                }

                const executor =
                    await getExecutor(
                        newRole.guild,
                        AuditLogEvent.RoleUpdate,
                        newRole.id
                    );

                await sendModLog(
                    client,
                    newRole.guild.id,
                    "server",
                    {
                        title: "Rol Güncellendi",
                        emoji: "✏️",
                        color: 0xFEE75C,

                        fields: [
                            {
                                name: "🎭 Rol",
                                value:
                                    roleInfo(newRole),
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            },

                            {
                                name: "📝 Değişiklikler",
                                value:
                                    changes.join("\n"),
                                inline: false
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Rol güncelleme ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 😀 EMOJI OLAYLARI
    // =====================================================

    client.on(
        "emojiCreate",
        async (emoji) => {

            try {

                const executor =
                    await getExecutor(
                        emoji.guild,
                        AuditLogEvent.EmojiCreate,
                        emoji.id
                    );

                await sendModLog(
                    client,
                    emoji.guild.id,
                    "server",
                    {
                        title: "Emoji Oluşturuldu",
                        emoji: "😀",
                        color: 0x57F287,

                        fields: [
                            {
                                name: "😀 Emoji",
                                value:
                                    `${emoji} \`${emoji.name}\`\nID: \`${emoji.id}\``,
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Emoji oluşturma ModLog hatası:",
                    error
                );
            }
        }
    );

    client.on(
        "emojiDelete",
        async (emoji) => {

            try {

                const executor =
                    await getExecutor(
                        emoji.guild,
                        AuditLogEvent.EmojiDelete,
                        emoji.id
                    );

                await sendModLog(
                    client,
                    emoji.guild.id,
                    "server",
                    {
                        title: "Emoji Silindi",
                        emoji: "🗑️",
                        color: 0xED4245,

                        fields: [
                            {
                                name: "😀 Emoji",
                                value:
                                    `\`${emoji.name}\`\nID: \`${emoji.id}\``,
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Emoji silme ModLog hatası:",
                    error
                );
            }
        }
    );

    // =====================================================
    // 🌐 SUNUCU GÜNCELLENDİ
    // =====================================================

    client.on(
        "guildUpdate",
        async (
            oldGuild,
            newGuild
        ) => {

            try {

                const changes = [];

                if (
                    oldGuild.name !==
                    newGuild.name
                ) {
                    changes.push(
                        `**Sunucu adı:** \`${oldGuild.name}\` → \`${newGuild.name}\``
                    );
                }

                if (
                    oldGuild.verificationLevel !==
                    newGuild.verificationLevel
                ) {
                    changes.push(
                        `**Doğrulama seviyesi:** \`${oldGuild.verificationLevel}\` → \`${newGuild.verificationLevel}\``
                    );
                }

                if (!changes.length) {
                    return;
                }

                const executor =
                    await getExecutor(
                        newGuild,
                        AuditLogEvent.GuildUpdate,
                        newGuild.id
                    );

                await sendModLog(
                    client,
                    newGuild.id,
                    "server",
                    {
                        title: "Sunucu Güncellendi",
                        emoji: "🌐",
                        color: 0x5865F2,

                        fields: [
                            {
                                name: "🌐 Sunucu",
                                value:
                                    `**${newGuild.name}**\nID: \`${newGuild.id}\``,
                                inline: true
                            },

                            {
                                name: "🛡️ Yetkili",
                                value:
                                    executor
                                        ? userInfo(
                                            executor
                                        )
                                        : "Bilinmiyor",
                                inline: true
                            },

                            {
                                name: "📝 Değişiklikler",
                                value:
                                    changes.join("\n"),
                                inline: false
                            }
                        ]
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Sunucu güncelleme ModLog hatası:",
                    error
                );
            }
        }
    );

    console.log(
        "✅ DRAYS gelişmiş ModLog eventleri yüklendi."
    );
;



function saveData(data) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

function getModLog(guildId) {
    const data = loadData();

    return data[guildId] || {
        enabled: false,
        channels: {
            moderation: null,
            messages: null,
            members: null,
            server: null
        }
    };
}

function setModLog(guildId, type, channelId) {
    const data = loadData();

    if (!data[guildId]) {
        data[guildId] = {
            enabled: true,
            channels: {
                moderation: null,
                messages: null,
                members: null,
                server: null
            }
        };
    }

    if (!data[guildId].channels) {
        data[guildId].channels = {
            moderation: null,
            messages: null,
            members: null,
            server: null
        };
    }

    data[guildId].enabled = true;
    data[guildId].channels[type] = channelId;

    saveData(data);
}

function disableModLog(guildId) {
    const data = loadData();

    if (!data[guildId]) {
        data[guildId] = {
            enabled: false,
            channels: {
                moderation: null,
                messages: null,
                members: null,
                server: null
            }
        };
    }

    data[guildId].enabled = false;

    saveData(data);
}

async function sendModLog(client, guildId, type, options = {}) {
    try {
        const settings = getModLog(guildId);

        if (!settings.enabled) return;

        const channelId = settings.channels?.[type];

        if (!channelId) return;

        const guild = client.guilds.cache.get(guildId);

        if (!guild) return;

        const channel = guild.channels.cache.get(channelId);

        if (!channel || !channel.isTextBased()) return;

        const {
            title = "ModLog",
            emoji = "🛡️",
            description = null,
            color = 0x000000,
            fields = [],
            thumbnail = null
        } = options;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} ${title}`)
            .setTimestamp();

        if (description) {
            embed.setDescription(description);
        }

        if (fields.length > 0) {
            embed.addFields(
                fields.map(field => ({
                    name: field.name,
                    value: String(field.value).substring(0, 1024),
                    inline: field.inline ?? true
                }))
            );
        }

        if (thumbnail) {
            embed.setThumbnail(thumbnail);
        }

        embed.setFooter({
            text: `${guild.name} • ${type.toUpperCase()} LOG`
        });

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {
        console.error("❌ ModLog gönderme hatası:", error);
    }
}

module.exports = {
    loadData,
    saveData,
    getModLog,
    setModLog,
    disableModLog,
    sendModLog,
}
}

