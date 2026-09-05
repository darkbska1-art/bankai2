
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(
    __dirname,
    "..",
    "davetler.json"
);

// =====================================================
// 💾 VERİ
// =====================================================

function loadData() {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            fs.writeFileSync(
                DATA_PATH,
                "{}",
                "utf8"
            );
        }

        return JSON.parse(
            fs.readFileSync(DATA_PATH, "utf8")
        );
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        DATA_PATH,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

function getGuildData(data, guildId) {

    if (!data[guildId]) {
        data[guildId] = {
            users: {},
            members: {},
            settings: {
                channelId: null,
                rewards: []
            }
        };
    }

    if (!data[guildId].users) {
        data[guildId].users = {};
    }

    if (!data[guildId].members) {
        data[guildId].members = {};
    }

    if (!data[guildId].settings) {
        data[guildId].settings = {
            channelId: null,
            rewards: []
        };
    }

    if (!Array.isArray(data[guildId].settings.rewards)) {
        data[guildId].settings.rewards = [];
    }

    return data[guildId];
}

// =====================================================
// 🎟️ DAVET CACHE
// =====================================================

const inviteCache = new Map();

// =====================================================
// 🔄 SUNUCUNUN DAVETLERİNİ CACHELE
// =====================================================

async function cacheGuildInvites(guild) {

    try {

        const invites =
            await guild.invites.fetch();

        const cache =
            new Map();

        for (const invite of invites.values()) {

            cache.set(invite.code, {
                uses: invite.uses || 0,
                inviterId:
                    invite.inviter?.id || null
            });
        }

        inviteCache.set(
            guild.id,
            cache
        );

        return cache;

    } catch (error) {

        console.log(
            `⚠️ ${guild.name} davetleri alınamadı: ${error.message}`
        );

        return new Map();
    }
}

// =====================================================
// 🚀 EVENT
// =====================================================

module.exports = {

    name: "ready",
    once: true,

    async execute(client) {

        console.log(
            "🎟️ Gelişmiş davet sistemi başlatılıyor..."
        );

        // -------------------------------------------------
        // Başlangıçta bütün sunucuların davetlerini al
        // -------------------------------------------------

        for (const guild of client.guilds.cache.values()) {
            await cacheGuildInvites(guild);
        }

        console.log(
            "✅ Gelişmiş davet sistemi aktif."
        );

        // =================================================
        // 👤 ÜYE KATILDI
        // =================================================

        client.on(
            "guildMemberAdd",
            async member => {

                const guild =
                    member.guild;

                try {

                    const oldInvites =
                        inviteCache.get(guild.id) ||
                        new Map();

                    const newInvites =
                        await guild.invites.fetch();

                    let usedInvite = null;

                    // -----------------------------------------
                    // Hangi davet kullanılmış?
                    // -----------------------------------------

                    for (
                        const invite
                        of newInvites.values()
                    ) {

                        const oldInvite =
                            oldInvites.get(
                                invite.code
                            );

                        const oldUses =
                            oldInvite?.uses || 0;

                        const newUses =
                            invite.uses || 0;

                        if (
                            newUses >
                            oldUses
                        ) {

                            usedInvite =
                                invite;

                            break;
                        }
                    }

                    // -----------------------------------------
                    // Cache güncelle
                    // -----------------------------------------

                    const updatedCache =
                        new Map();

                    for (
                        const invite
                        of newInvites.values()
                    ) {

                        updatedCache.set(
                            invite.code,
                            {
                                uses:
                                    invite.uses || 0,

                                inviterId:
                                    invite.inviter?.id ||
                                    null
                            }
                        );
                    }

                    inviteCache.set(
                        guild.id,
                        updatedCache
                    );

                    // -----------------------------------------
                    // Davet bulunamadı
                    // -----------------------------------------

                    if (!usedInvite) {

                        console.log(
                            `📥 ${member.user.tag} katıldı → davet bulunamadı.`
                        );

                        return;
                    }

                    const inviter =
                        usedInvite.inviter;

                    if (!inviter) {
                        return;
                    }

                    // =================================================
                    // 💾 VERİ
                    // =================================================

                    const data =
                        loadData();

                    const guildData =
                        getGuildData(
                            data,
                            guild.id
                        );

                    if (
                        !guildData.users[
                            inviter.id
                        ]
                    ) {

                        guildData.users[
                            inviter.id
                        ] = {
                            total: 0,
                            valid: 0,
                            left: 0
                        };
                    }

                    const inviterData =
                        guildData.users[
                            inviter.id
                        ];

                    // Sınırsız sayı
                    inviterData.total++;
                    inviterData.valid++;

                    // Üyenin kim tarafından getirildiğini kaydet
                    guildData.members[
                        member.id
                    ] = {
                        inviterId:
                            inviter.id,

                        joinedAt:
                            Date.now()
                    };

                    saveData(data);

                    // =================================================
                    // 🎁 ÖDÜL SİSTEMİ
                    // =================================================

                    const rewards =
                        guildData.settings.rewards;

                    if (
                        Array.isArray(rewards) &&
                        rewards.length
                    ) {

                        const inviterMember =
                            await guild.members
                                .fetch(inviter.id)
                                .catch(() => null);

                        if (inviterMember) {

                            for (
                                const reward
                                of rewards
                            ) {

                                if (
                                    inviterData.valid >=
                                    reward.invites
                                ) {

                                    const role =
                                        guild.roles.cache.get(
                                            reward.roleId
                                        );

                                    if (
                                        role &&
                                        !inviterMember.roles.cache.has(
                                            role.id
                                        )
                                    ) {

                                        await inviterMember
                                            .roles
                                            .add(role)
                                            .catch(() => {});
                                    }
                                }
                            }
                        }
                    }

                    // =================================================
                    // 📢 DUYURU
                    // =================================================

                    const channelId =
                        guildData.settings.channelId;

                    if (channelId) {

                        const channel =
                            guild.channels.cache.get(
                                channelId
                            );

                        if (
                            channel &&
                            channel.isTextBased()
                        ) {

                            await channel.send({
                                content:
                                    `🎉 **Yeni üye katıldı!**\n\n` +
                                    `👤 Üye: ${member.user}\n` +
                                    `🎟️ Davet eden: **${inviter.tag}**\n` +
                                    `📨 Geçerli davet: **${inviterData.valid}**`
                            }).catch(() => {});
                        }
                    }

                    console.log(
                        `🎟️ ${member.user.tag} → ${inviter.tag} | ${inviterData.valid} davet`
                    );

                } catch (error) {

                    console.log(
                        "❌ Davet takip hatası:",
                        error
                    );
                }
            }
        );

        // =================================================
        // 👋 ÜYE AYRILDI
        // =================================================

        client.on(
            "guildMemberRemove",
            async member => {

                try {

                    const data =
                        loadData();

                    const guildData =
                        data[member.guild.id];

                    if (!guildData) {
                        return;
                    }

                    const memberData =
                        guildData.members[
                            member.id
                        ];

                    if (!memberData) {
                        return;
                    }

                    const inviterId =
                        memberData.inviterId;

                    const inviterData =
                        guildData.users[
                            inviterId
                        ];

                    if (inviterData) {

                        if (
                            inviterData.valid > 0
                        ) {
                            inviterData.valid--;
                        }

                        inviterData.left++;
                    }

                    delete guildData.members[
                        member.id
                    ];

                    saveData(data);

                    console.log(
                        `👋 ${member.user.tag} ayrıldı → ${inviterId}`
                    );

                } catch (error) {

                    console.log(
                        "❌ Davet ayrılma hatası:",
                        error.message
                    );
                }
            }
        );

        // =================================================
        // ➕ DAVET OLUŞTURULDU
        // =================================================

        client.on(
            "inviteCreate",
            async invite => {

                if (!invite.guild) {
                    return;
                }

                await cacheGuildInvites(
                    invite.guild
                );
            }
        );

        // =================================================
        // ❌ DAVET SİLİNDİ
        // =================================================

        client.on(
            "inviteDelete",
            async invite => {

                if (!invite.guild) {
                    return;
                }

                await cacheGuildInvites(
                    invite.guild
                );
            }
        );
    }
};
