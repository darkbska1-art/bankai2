
const fs = require("fs");
const path = require("path");

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
        console.error("❌ davetler.json okunamadı:", error);
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

    const guildData = data[guildId];

    if (!guildData.users) guildData.users = {};
    if (!guildData.members) guildData.members = {};
    if (!guildData.rewards) guildData.rewards = {};

    if (!("channelId" in guildData)) {
        guildData.channelId = null;
    }

    return guildData;
}

// =====================================================
// 📨 DAVETLERİ ÇEK
// =====================================================

async function fetchInvites(guild) {

    try {

        const invites = await guild.invites.fetch();

        const result = new Map();

        for (const invite of invites.values()) {

            result.set(invite.code, {
                code: invite.code,
                uses: invite.uses || 0,
                inviterId: invite.inviter?.id || null
            });

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
// 💾 DAVET CACHE
// =====================================================

async function updateInviteCache(guild) {

    const invites = await fetchInvites(guild);

    if (!invites) return false;

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
// 🔎 HANGİ DAVET KULLANILDI?
// =====================================================

function findUsedInvite(oldInvites, newInvites) {

    // Kullanım sayısı artan davet
    for (const [code, newInvite] of newInvites) {

        const oldInvite = oldInvites.get(code);

        if (!oldInvite) continue;

        if (newInvite.uses > oldInvite.uses) {
            return newInvite;
        }
    }

    // Yeni oluşturulmuş ve kullanılmış davet
    for (const [code, newInvite] of newInvites) {

        if (
            !oldInvites.has(code) &&
            newInvite.uses > 0
        ) {
            return newInvite;
        }
    }

    return null;
}

// =====================================================
// 👤 KULLANICI
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
// 🔒 SUNUCU SIRALAMA KUYRUĞU
// =====================================================

function queueGuild(guildId, task) {

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
            guildQueues.get(guildId) === current
        ) {
            guildQueues.delete(guildId);
        }

    });

    return current;
}

// =====================================================
// 🎁 ÖDÜL ROLLERİ
// =====================================================

async function checkRewards(
    guild,
    inviterId,
    guildData
) {

    const userData =
        guildData.users[inviterId];

    if (!userData) return;

    const member =
        await guild.members
            .fetch(inviterId)
            .catch(() => null);

    if (!member) return;

    const me =
        guild.members.me;

    if (!me) return;

    for (
        const [amountString, roleId]
        of Object.entries(guildData.rewards)
    ) {

        const amount =
            Number(amountString);

        if (!Number.isFinite(amount)) {
            continue;
        }

        if (userData.valid < amount) {
            continue;
        }

        const role =
            guild.roles.cache.get(roleId);

        if (!role) {
            continue;
        }

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
            !member.roles.cache.has(role.id)
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
                        `❌ Rol verilemedi:`,
                        error.message
                    );

                });
        }
    }
}

// =====================================================
// 🎉 ÜYE KATILDI
// =====================================================

async function handleMemberAdd(member) {

    const guild =
        member.guild;

    return queueGuild(
        guild.id,
        async () => {

            // Discord'un davet kullanımını güncellemesi için bekle
            await new Promise(
                resolve => setTimeout(resolve, 1500)
            );

            const oldInvites =
                inviteCache.get(guild.id);

            const newInvites =
                await fetchInvites(guild);

            if (!newInvites) {
                return;
            }

            // Cache'i hemen güncelle
            inviteCache.set(
                guild.id,
                newInvites
            );

            if (!oldInvites) {

                console.log(
                    `⚠️ ${guild.name}: Eski davet cache'i bulunamadı.`
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
                    `❓ ${guild.name}: ${member.user.tag} katıldı fakat kullanılan davet bulunamadı.`
                );

                return;
            }

            if (!usedInvite.inviterId) {

                console.log(
                    `❓ ${guild.name}: Davetin sahibi bulunamadı.`
                );

                return;
            }

            const guildData =
                getGuildData(guild.id);

            const inviter =
                getUserData(
                    guildData,
                    usedInvite.inviterId
                );

            // =================================================
            // 📊 DAVET SAY
            // =================================================

            inviter.total++;
            inviter.valid++;

            guildData.members[member.id] = {

                inviterId:
                    usedInvite.inviterId,

                inviteCode:
                    usedInvite.code,

                joinedAt:
                    Date.now()
            };

            saveData();

            console.log(
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
            );

            console.log(
                `🎉 YENİ DAVET`
            );

            console.log(
                `👤 Katılan: ${member.user.tag}`
            );

            console.log(
                `📨 Davet kodu: ${usedInvite.code}`
            );

            console.log(
                `👑 Davet eden: ${usedInvite.inviterId}`
            );

            console.log(
                `📈 Geçerli davet: ${inviter.valid}`
            );

            console.log(
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
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
            // 📢 KANAL MESAJI
            // =================================================

            if (guildData.channelId) {

                const channel =
                    guild.channels.cache.get(
                        guildData.channelId
                    );

                if (
                    channel &&
                    channel.isTextBased()
                ) {

                    const inviterMember =
                        await guild.members
                            .fetch(usedInvite.inviterId)
                            .catch(() => null);

                    const inviterName =
                        inviterMember?.user?.tag ||
                        `<@${usedInvite.inviterId}>`;

                    await channel.send({

                        content:
                            `🎉 **Yeni Davet!**\n\n` +
                            `👤 Katılan: **${member.user.tag}**\n` +
                            `📨 Davet eden: **${inviterName}**\n` +
                            `📈 Geçerli davet: **${inviter.valid}**`

                    }).catch(() => {});
                }
            }
        }
    );
}

// =====================================================
// 📤 ÜYE AYRILDI
// =====================================================

async function handleMemberRemove(member) {

    try {

        const guildData =
            getGuildData(
                member.guild.id
            );

        const inviteInfo =
            guildData.members[member.id];

        if (!inviteInfo) {
            return;
        }

        const inviter =
            guildData.users[
                inviteInfo.inviterId
            ];

        if (inviter) {

            if (inviter.valid > 0) {
                inviter.valid--;
            }

            inviter.left++;
        }

        delete guildData.members[
            member.id
        ];

        saveData();

        console.log(
            `📤 ${member.user.tag} çıktı. Davet geçerliliği güncellendi.`
        );

    } catch (error) {

        console.error(
            "❌ Davet çıkış hatası:",
            error
        );
    }
}

// =====================================================
// 🚀 BAŞLAT
// =====================================================

module.exports = function startInviteSystem(client) {

    data = loadData();

    console.log(
        "📨 Davet takip sistemi başlatılıyor..."
    );

    // Bot hazır olduğunda bütün davetleri cache'le
    client.once(
        "clientReady",
        async () => {

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

    // Üye katıldı
    client.on(
        "guildMemberAdd",
        handleMemberAdd
    );

    // Üye ayrıldı
    client.on(
        "guildMemberRemove",
        handleMemberRemove
    );

    // Yeni davet oluşturuldu
    client.on(
        "inviteCreate",
        async invite => {

            await updateInviteCache(
                invite.guild
            );
        }
    );

    // Davet silindi
    client.on(
        "inviteDelete",
        async invite => {

            await updateInviteCache(
                invite.guild
            );
        }
    );

    // Bot yeni sunucuya girdi
    client.on(
        "guildCreate",
        async guild => {

            await updateInviteCache(
                guild
            );
        }
    );
};

