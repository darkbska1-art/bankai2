
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const DATA_FILE = path.join(process.cwd(), "davetler.json");

let data = {};
const inviteCache = new Map();
const guildQueues = new Map();

// =====================================================
// 💾 VERİ
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

function saveData() {
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

// =====================================================
// 🏠 SUNUCU VERİSİ
// =====================================================

function getGuildData(guildId) {

    if (!data[guildId]) {

        data[guildId] = {
            users: {},
            members: {},
            rewards: {},
            channelId: null
        };
    }

    if (!data[guildId].users)
        data[guildId].users = {};

    if (!data[guildId].members)
        data[guildId].members = {};

    if (!data[guildId].rewards)
        data[guildId].rewards = {};

    if (!("channelId" in data[guildId]))
        data[guildId].channelId = null;

    return data[guildId];
}

// =====================================================
// 👤 KULLANICI VERİSİ
// =====================================================

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
// 📨 DAVETLERİ ÇEK
// =====================================================

async function fetchInvites(guild) {

    try {

        const invites =
            await guild.invites.fetch();

        const result = new Map();

        for (const invite of invites.values()) {

            result.set(
                invite.code,
                {
                    code: invite.code,
                    uses: invite.uses || 0,
                    inviterId:
                        invite.inviter?.id || null
                }
            );
        }

        return result;

    } catch (error) {

        console.error(
            `❌ ${guild.name} davetleri alınamadı:`,
            error.message
        );

        return null;
    }
}

// =====================================================
// 🔄 CACHE GÜNCELLE
// =====================================================

async function updateInviteCache(guild) {

    const invites =
        await fetchInvites(guild);

    if (!invites)
        return false;

    inviteCache.set(
        guild.id,
        invites
    );

    console.log(
        `📨 ${guild.name}: ${invites.size} davet cache'lendi.`
    );

    return true;
}

// =====================================================
// 🔎 KULLANILAN DAVETİ BUL
// =====================================================

function findUsedInvite(
    oldInvites,
    newInvites
) {

    for (
        const [code, newInvite]
        of newInvites
    ) {

        const oldInvite =
            oldInvites.get(code);

        if (!oldInvite)
            continue;

        if (
            newInvite.uses >
            oldInvite.uses
        ) {

            return newInvite;
        }
    }

    return null;
}

// =====================================================
// 🔒 SUNUCU KUYRUĞU
// =====================================================

function queueGuild(
    guildId,
    task
) {

    const previous =
        guildQueues.get(guildId) ||
        Promise.resolve();

    const current =
        previous
            .catch(() => {})
            .then(task);

    guildQueues.set(
        guildId,
        current
    );

    current.finally(() => {

        if (
            guildQueues.get(guildId) ===
            current
        ) {

            guildQueues.delete(
                guildId
            );
        }

    });

    return current;
}

// =====================================================
// 📢 BİLDİRİM KANALINI BUL
// =====================================================

async function getNotificationChannel(
    guild,
    guildData
) {

    if (!guildData.channelId) {

        console.log(
            `⚠️ ${guild.name}: Davet bildirim kanalı ayarlanmamış.`
        );

        return null;
    }

    console.log(
        `📢 Davet kanalı aranıyor: ${guildData.channelId}`
    );

    const channel =
        await guild.channels
            .fetch(guildData.channelId)
            .catch(error => {

                console.error(
                    `❌ Kanal fetch edilemedi:`,
                    error.message
                );

                return null;
            });

    if (!channel) {

        console.log(
            "❌ Davet bildirim kanalı bulunamadı."
        );

        return null;
    }

    if (!channel.isTextBased()) {

        console.log(
            "❌ Davet bildirim kanalı mesaj gönderilebilir değil."
        );

        return null;
    }

    console.log(
        `✅ Davet bildirim kanalı bulundu: #${channel.name}`
    );

    return channel;
}

// =====================================================
// 🎁 ÖDÜL KONTROL
// =====================================================

async function checkRewards(
    guild,
    inviterId,
    guildData
) {

    const userData =
        guildData.users[inviterId];

    if (!userData)
        return;

    const member =
        await guild.members
            .fetch(inviterId)
            .catch(() => null);

    if (!member)
        return;

    const me =
        guild.members.me;

    if (!me)
        return;

    for (
        const [amountString, roleId]
        of Object.entries(
            guildData.rewards
        )
    ) {

        const amount =
            Number(amountString);

        if (!Number.isFinite(amount))
            continue;

        if (
            userData.valid <
            amount
        )
            continue;

        const role =
            guild.roles.cache.get(
                roleId
            );

        if (!role)
            continue;

        if (
            role.position >=
            me.roles.highest.position
        ) {

            console.log(
                `⚠️ ${guild.name}: ${role.name} botun rolünden yukarıda.`
            );

            continue;
        }

        if (
            !member.roles.cache.has(
                role.id
            )
        ) {

            await member.roles
                .add(role)
                .then(() => {

                    console.log(
                        `🎁 ${guild.name}: ${member.user.tag} → ${role.name}`
                    );

                })
                .catch(error => {

                    console.error(
                        "❌ Rol verilemedi:",
                        error.message
                    );
                });
        }
    }
}

// =====================================================
// 👤 ÜYE KATILDI
// =====================================================

async function handleMemberAdd(member) {

    const guild =
        member.guild;

    return queueGuild(
        guild.id,
        async () => {

            console.log(
                `👤 ${member.user.tag} sunucuya katıldı.`
            );

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        2000
                    )
            );

            const oldInvites =
                inviteCache.get(
                    guild.id
                );

            const newInvites =
                await fetchInvites(
                    guild
                );

            if (!newInvites) {

                console.log(
                    "❌ Yeni davetler alınamadı."
                );

                return;
            }

            inviteCache.set(
                guild.id,
                newInvites
            );

            if (!oldInvites) {

                console.log(
                    "⚠️ Eski davet cache'i bulunamadı."
                );

                return;
            }

            const usedInvite =
                findUsedInvite(
                    oldInvites,
                    newInvites
                );

            if (!usedInvite) {

                console.log(
                    `❓ ${member.user.tag} için kullanılan davet bulunamadı.`
                );

                return;
            }

            if (!usedInvite.inviterId) {

                console.log(
                    "❓ Davetin sahibi bulunamadı."
                );

                return;
            }

            const guildData =
                getGuildData(
                    guild.id
                );

            const inviter =
                getUserData(
                    guildData,
                    usedInvite.inviterId
                );

            inviter.total++;
            inviter.valid++;

            guildData.members[
                member.id
            ] = {

                inviterId:
                    usedInvite.inviterId,

                inviteCode:
                    usedInvite.code,

                joinedAt:
                    Date.now()
            };

            saveData();

            console.log(
                "🎉 DAVET TESPİT EDİLDİ"
            );

            console.log(
                `👤 Katılan: ${member.user.tag}`
            );

            console.log(
                `📨 Kod: ${usedInvite.code}`
            );

            console.log(
                `👑 Davet eden: ${usedInvite.inviterId}`
            );

            console.log(
                `📈 Geçerli davet: ${inviter.valid}`
            );

            // =================================================
            // 🎁 ÖDÜL
            // =================================================

            await checkRewards(
                guild,
                usedInvite.inviterId,
                guildData
            );

            // =================================================
            // 📢 MESAJ
            // =================================================

            const channel =
                await getNotificationChannel(
                    guild,
                    guildData
                );

            if (!channel)
                return;

            const inviterMember =
                await guild.members
                    .fetch(
                        usedInvite.inviterId
                    )
                    .catch(() => null);

            const inviterName =
                inviterMember?.user?.tag ||
                `<@${usedInvite.inviterId}>`;

            try {

                await channel.send({

                    content:
                        `🎉 **Yeni Davet!**\n\n` +
                        `👤 **Katılan:** ${member.user}\n` +
                        `📨 **Davet Eden:** ${inviterName}\n` +
                        `🔗 **Davet Kodu:** \`${usedInvite.code}\`\n` +
                        `📈 **Toplam Geçerli Davet:** **${inviter.valid}**`
                });

                console.log(
                    `✅ Yeni davet mesajı gönderildi: #${channel.name}`
                );

            } catch (error) {

                console.error(
                    "❌ Yeni davet mesajı gönderilemedi:"
                );

                console.error(error);
            }
        }
    );
}

// =====================================================
// 📤 ÜYE AYRILDI
// =====================================================

async function handleMemberRemove(member) {

    console.log(
        "🚨 GUILD MEMBER REMOVE ÇALIŞTI!"
    );

    console.log(
        `👤 Kullanıcı: ${member.user.tag}`
    );

    console.log(
        `🏠 Sunucu: ${member.guild.name}`
    );

    try {

        const guild =
            member.guild;

        const guildData =
            getGuildData(
                guild.id
            );

        const inviteInfo =
            guildData.members[
                member.id
            ];

        let inviter = null;

        // =================================================
        // 📊 DAVET SAYISINI GÜNCELLE
        // =================================================

        if (inviteInfo) {

            inviter =
                guildData.users[
                    inviteInfo.inviterId
                ];

            if (inviter) {

                if (
                    inviter.valid > 0
                ) {

                    inviter.valid--;
                }

                inviter.left++;
            }

            delete guildData.members[
                member.id
            ];

            saveData();
        }

        console.log(
            `📤 ${member.user.tag} sunucudan ayrıldı.`
        );

        // =================================================
        // 📢 KANAL
        // =================================================

        const channel =
            await getNotificationChannel(
                guild,
                guildData
            );

        if (!channel)
            return;

        const inviterName =
            inviteInfo
                ? `<@${inviteInfo.inviterId}>`
                : "Bilinmiyor";

        const currentValid =
            inviter?.valid || 0;

        const currentLeft =
            inviter?.left || 0;

        // =================================================
        // 📨 MESAJ
        // =================================================

        await channel.send({

            embeds: [

                new EmbedBuilder()

                    .setColor("Red")

                    .setTitle(
                        "📤 Üye Ayrıldı"
                    )

                    .setDescription(
                        `**${member.user.tag}** sunucudan ayrıldı.`
                    )

                    .addFields(

                        {
                            name:
                                "👤 Ayrılan Üye",

                            value:
                                `<@${member.id}>`,

                            inline: true
                        },

                        {
                            name:
                                "📨 Davet Eden",

                            value:
                                inviterName,

                            inline: true
                        },

                        {
                            name:
                                "📊 Geçerli Davet",

                            value:
                                `**${currentValid}**`,

                            inline: true
                        },

                        {
                            name:
                                "📤 Ayrılan",

                            value:
                                `**${currentLeft}**`,

                            inline: true
                        }
                    )

                    .setFooter({
                        text:
                            `${guild.name} • Davet Sistemi`
                    })

                    .setTimestamp()
            ]
        });

        console.log(
            "✅ ÇIKIŞ MESAJI BAŞARIYLA GÖNDERİLDİ!"
        );

    } catch (error) {

        console.error(
            "❌ Çıkış eventinde hata:"
        );

        console.error(error);
    }
}

// =====================================================
// 🚀 SİSTEMİ BAŞLAT
// =====================================================

module.exports = function startInviteSystem(
    client
) {

    data = loadData();

    console.log(
        "📨 Davet takip sistemi başlatılıyor..."
    );

    // =================================================
    // 🟢 BOT HAZIR
    // =================================================

    client.once(
        "clientReady",
        async () => {

            console.log(
                "🔄 Davetler hazırlanıyor..."
            );

            for (
                const guild
                of client.guilds.cache.values()
            ) {

                await updateInviteCache(
                    guild
                );
            }

            console.log(
                "✅ Davet takip sistemi aktif!"
            );
        }
    );

    // =================================================
    // 👤 KATILMA
    // =================================================

    client.on(
        "guildMemberAdd",
        handleMemberAdd
    );

    // =================================================
    // 📤 AYRILMA
    // =================================================

    client.on(
        "guildMemberRemove",
        handleMemberRemove
    );

    // =================================================
    // 📨 YENİ DAVET
    // =================================================

    client.on(
        "inviteCreate",
        async invite => {

            console.log(
                `📨 Yeni davet oluşturuldu: ${invite.code}`
            );

            await updateInviteCache(
                invite.guild
            );
        }
    );

    // =================================================
    // 🗑️ DAVET SİLİNDİ
    // =================================================

    client.on(
        "inviteDelete",
        async invite => {

            console.log(
                `🗑️ Davet silindi: ${invite.code}`
            );

            await updateInviteCache(
                invite.guild
            );
        }
    );

    // =================================================
    // 🏠 BOT YENİ SUNUCUYA GİRDİ
    // =================================================

    client.on(
        "guildCreate",
        async guild => {

            await updateInviteCache(
                guild
            );
        }
    );
};

