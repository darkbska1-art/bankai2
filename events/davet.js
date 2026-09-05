
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(process.cwd(), "davetler.json");

let data = {};
const inviteCache = new Map();
const processingGuilds = new Set();

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, "{}", "utf8");
            return {};
        }

        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
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
        console.error("❌ davetler.json kaydedilemedi:", error);
    }
}

function getGuildData(guildId) {
    if (!data[guildId]) {
        data[guildId] = {
            users: {},
            members: {},
            rewards: {},
            channelId: null
        };
    }

    if (!data[guildId].users) data[guildId].users = {};
    if (!data[guildId].members) data[guildId].members = {};
    if (!data[guildId].rewards) data[guildId].rewards = {};
    if (!("channelId" in data[guildId])) {
        data[guildId].channelId = null;
    }

    return data[guildId];
}

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
            `❌ ${guild.name} sunucusunun davetleri alınamadı:`,
            error.message
        );

        return null;
    }
}

async function cacheGuildInvites(guild) {
    const invites = await fetchInvites(guild);

    if (invites) {
        inviteCache.set(guild.id, invites);
        console.log(`📨 ${guild.name}: ${invites.size} davet önbelleğe alındı.`);
    }
}

function getUsedInvite(oldInvites, newInvites) {
    // Önce kullanım sayısı artan daveti bul
    for (const [code, newInvite] of newInvites.entries()) {
        const oldInvite = oldInvites.get(code);

        if (!oldInvite) continue;

        if (newInvite.uses > oldInvite.uses) {
            return newInvite;
        }
    }

    // Eski listede olmayan ama yeni listede bulunan davet
    // bazı durumlarda kullanılan davet olabilir.
    for (const [code, newInvite] of newInvites.entries()) {
        if (!oldInvites.has(code) && newInvite.uses > 0) {
            return newInvite;
        }
    }

    return null;
}

function ensureUser(guildData, userId) {
    if (!guildData.users[userId]) {
        guildData.users[userId] = {
            total: 0,
            valid: 0,
            left: 0
        };
    }

    return guildData.users[userId];
}

async function giveRewards(guild, inviterId, guildData) {
    const userData = guildData.users[inviterId];

    if (!userData) return;

    const member = await guild.members
        .fetch(inviterId)
        .catch(() => null);

    if (!member) return;

    const rewards = Object.entries(guildData.rewards);

    for (const [inviteAmount, roleId] of rewards) {
        const amount = Number(inviteAmount);

        if (!Number.isFinite(amount)) continue;
        if (userData.valid < amount) continue;

        const role = guild.roles.cache.get(roleId);

        if (!role) continue;

        if (role.position >= guild.members.me.roles.highest.position) {
            console.log(
                `⚠️ ${guild.name}: ${role.name} rolü botun rolünden yukarıda.`
            );
            continue;
        }

        if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role).catch(error => {
                console.error(
                    `❌ ${guild.name}: ${member.user.tag} kişisine rol verilemedi:`,
                    error.message
                );
            });
        }
    }
}

module.exports = {
    name: "ready",
    once: true,

    async execute(client) {
        data = loadData();

        console.log("📨 Davet takip sistemi başlatılıyor...");

        // Bot açıldığında bütün sunucuların davetlerini al
        for (const guild of client.guilds.cache.values()) {
            await cacheGuildInvites(guild);
        }

        // =====================================================
        // YENİ ÜYE
        // =====================================================

        client.on("guildMemberAdd", async member => {
            const guild = member.guild;

            // Aynı sunucuda aynı anda işlemleri karıştırma
            if (processingGuilds.has(guild.id)) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            processingGuilds.add(guild.id);

            try {
                // Discord'un davet kullanımını güncellemesi için bekle
                await new Promise(resolve => setTimeout(resolve, 1000));

                const oldInvites = inviteCache.get(guild.id);

                if (!oldInvites) {
                    await cacheGuildInvites(guild);
                    return;
                }

                const newInvites = await fetchInvites(guild);

                if (!newInvites) return;

                const usedInvite = getUsedInvite(
                    oldInvites,
                    newInvites
                );

                // Cache'i her durumda güncelle
                inviteCache.set(guild.id, newInvites);

                if (!usedInvite) {
                    console.log(
                        `❓ ${guild.name}: ${member.user.tag} katıldı fakat kullanılan davet bulunamadı.`
                    );
                    return;
                }

                if (!usedInvite.inviterId) {
                    console.log(
                        `❓ ${guild.name}: ${usedInvite.code} davetinin sahibi bulunamadı.`
                    );
                    return;
                }

                const guildData = getGuildData(guild.id);

                const inviter = ensureUser(
                    guildData,
                    usedInvite.inviterId
                );

                // Davet istatistikleri
                inviter.total++;
                inviter.valid++;

                // Bu üyeyi hangi kişi davet etti?
                guildData.members[member.id] = {
                    inviterId: usedInvite.inviterId,
                    inviteCode: usedInvite.code,
                    joinedAt: Date.now()
                };

                saveData();

                console.log(
                    `✅ ${member.user.tag} → ${usedInvite.inviterId} tarafından davet edildi.`
                );

                console.log(
                    `📊 ${guild.name}: ${inviter.valid} geçerli davet`
                );

                // Ödülleri kontrol et
                await giveRewards(
                    guild,
                    usedInvite.inviterId,
                    guildData
                );

                // Bildirim kanalı
                if (guildData.channelId) {
                    const channel = guild.channels.cache.get(
                        guildData.channelId
                    );

                    if (channel && channel.isTextBased()) {
                        const inviterMember = await guild.members
                            .fetch(usedInvite.inviterId)
                            .catch(() => null);

                        const inviterName =
                            inviterMember?.user?.tag ||
                            `<@${usedInvite.inviterId}>`;

                        await channel.send(
                            `🎉 **Yeni Davet!**\n` +
                            `👤 ${member.user.tag}\n` +
                            `📨 Davet eden: ${inviterName}\n` +
                            `📈 Geçerli davet: **${inviter.valid}**`
                        ).catch(() => {});
                    }
                }

            } catch (error) {
                console.error(
                    `❌ Davet takip hatası (${guild.name}):`,
                    error
                );
            } finally {
                processingGuilds.delete(guild.id);
            }
        });

        // =====================================================
        // ÜYE AYRILDI
        // =====================================================

        client.on("guildMemberRemove", async member => {
            try {
                const guildData = getGuildData(member.guild.id);

                const inviteInfo =
                    guildData.members[member.id];

                if (!inviteInfo) return;

                const inviterId = inviteInfo.inviterId;

                const inviter = guildData.users[inviterId];

                if (inviter) {
                    if (inviter.valid > 0) {
                        inviter.valid--;
                    }

                    inviter.left++;
                }

                delete guildData.members[member.id];

                saveData();

                console.log(
                    `📤 ${member.user.tag} çıktı. Daveti ${inviterId} → geçerli davet güncellendi.`
                );

            } catch (error) {
                console.error(
                    "❌ Davet çıkış takip hatası:",
                    error
                );
            }
        });

        // =====================================================
        // YENİ DAVET
        // =====================================================

        client.on("inviteCreate", async invite => {
            await cacheGuildInvites(invite.guild);
        });

        // =====================================================
        // DAVET SİLİNDİ
        // =====================================================

        client.on("inviteDelete", async invite => {
            await cacheGuildInvites(invite.guild);
        });

        // =====================================================
        // BOT YENİ SUNUCUYA EKLENDİ
        // =====================================================

        client.on("guildCreate", async guild => {
            console.log(
                `🆕 Yeni sunucu: ${guild.name}`
            );

            await cacheGuildInvites(guild);
        });

        console.log("✅ Davet takip sistemi aktif!");
    }
};


 `commands/davet.js`


const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "davet",
    aliases: ["invite", "invites"],

    async execute(message, args, client) {

        const guildDataFile = require("../davetler.json");

        const fs = require("fs");
        const path = require("path");

        const DATA_FILE = path.join(
            process.cwd(),
            "davetler.json"
        );

        function loadData() {
            try {
                return JSON.parse(
                    fs.readFileSync(DATA_FILE, "utf8")
                );
            } catch {
                return {};
            }
        }

        function saveData(data) {
            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(data, null, 2),
                "utf8"
            );
        }

        const data = loadData();

        if (!data[message.guild.id]) {
            data[message.guild.id] = {
                users: {},
                members: {},
                rewards: {},
                channelId: null
            };
        }

        const guildData = data[message.guild.id];

        if (!guildData.users) guildData.users = {};
        if (!guildData.members) guildData.members = {};
        if (!guildData.rewards) guildData.rewards = {};
        if (!("channelId" in guildData)) {
            guildData.channelId = null;
        }

        // =====================================================
        // B!DAVET
        // =====================================================

        if (!args[0]) {
            const target =
                message.mentions.users.first() ||
                message.author;

            const userData =
                guildData.users[target.id] || {
                    total: 0,
                    valid: 0,
                    left: 0
                };

            const embed = new EmbedBuilder()
                .setTitle("📨 Davet İstatistikleri")
                .setDescription(
                    `👤 **Kullanıcı:** ${target}\n\n` +
                    `📨 **Toplam davet:** **${userData.total}**\n` +
                    `✅ **Geçerli davet:** **${userData.valid}**\n` +
                    `📤 **Ayrılan:** **${userData.left}**`
                )
                .setColor("Blurple")
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // =====================================================
        // B!DAVET @ÜYE
        // =====================================================

        if (message.mentions.users.first()) {
            const target =
                message.mentions.users.first();

            const userData =
                guildData.users[target.id] || {
                    total: 0,
                    valid: 0,
                    left: 0
                };

            const embed = new EmbedBuilder()
                .setTitle("📨 Davet İstatistikleri")
                .setDescription(
                    `👤 **Kullanıcı:** ${target}\n\n` +
                    `📨 **Toplam:** **${userData.total}**\n` +
                    `✅ **Geçerli:** **${userData.valid}**\n` +
                    `📤 **Ayrılan:** **${userData.left}**`
                )
                .setColor("Blurple")
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        const command = args[0].toLowerCase();

        // =====================================================
        // SIRALAMA
        // =====================================================

        if (
            command === "sıralama" ||
            command === "sirala" ||
            command === "leaderboard"
        ) {
            const users = Object.entries(guildData.users)
                .sort(
                    (a, b) =>
                        (b[1].valid || 0) -
                        (a[1].valid || 0)
                )
                .slice(0, 10);

            if (!users.length) {
                return message.reply(
                    "📭 Henüz davet verisi bulunmuyor."
                );
            }

            let description = "";

            for (let i = 0; i < users.length; i++) {
                const [userId, stats] = users[i];

                const member =
                    await message.guild.members
                        .fetch(userId)
                        .catch(() => null);

                const username =
                    member?.user?.tag ||
                    `Bilinmeyen Kullanıcı`;

                const medals = [
                    "🥇",
                    "🥈",
                    "🥉"
                ];

                const rank =
                    medals[i] ||
                    `**${i + 1}.**`;

                description +=
                    `${rank} ${username}\n` +
                    `> ✅ **${stats.valid || 0}** geçerli • ` +
                    `📨 **${stats.total || 0}** toplam\n\n`;
            }

            const embed = new EmbedBuilder()
                .setTitle("🏆 Sunucu Davet Sıralaması")
                .setDescription(description)
                .setFooter({
                    text: "En fazla geçerli davete sahip üyeler"
                })
                .setColor("Gold")
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // =====================================================
        // ÖDÜL AYARLA
        // B!davet ödül 10 @Rol
        // =====================================================

        if (command === "ödül" || command === "odul") {

            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {
                return message.reply(
                    "❌ Bu ayarı kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            const amount = Number(args[1]);
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

            guildData.rewards[String(amount)] =
                role.id;

            saveData(data);

            return message.reply(
                `✅ **${amount} davet** ödülü olarak ${role} ayarlandı.`
            );
        }

        // =====================================================
        // ÖDÜLLER
        // =====================================================

        if (
            command === "ödüller" ||
            command === "oduller"
        ) {
            const rewards =
                Object.entries(guildData.rewards)
                    .sort(
                        (a, b) =>
                            Number(a[0]) -
                            Number(b[0])
                    );

            if (!rewards.length) {
                return message.reply(
                    "📭 Henüz ödül ayarlanmamış."
                );
            }

            let text = "";

            for (const [amount, roleId] of rewards) {
                text +=
                    `🎯 **${amount} davet** → <@&${roleId}>\n`;
            }

            const embed = new EmbedBuilder()
                .setTitle("🎁 Davet Ödülleri")
                .setDescription(text)
                .setColor("Green");

            return message.reply({
                embeds: [embed]
            });
        }

        // =====================================================
        // ÖDÜL SİL
        // =====================================================

        if (
            command === "ödülsil" ||
            command === "odulsil"
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {
                return message.reply(
                    "❌ Bu ayarı kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            const amount = Number(args[1]);

            if (!Number.isInteger(amount)) {
                return message.reply(
                    "❌ Kullanım: `B!davet ödülsil 10`"
                );
            }

            if (!guildData.rewards[String(amount)]) {
                return message.reply(
                    "❌ Bu seviyede bir ödül bulunamadı."
                );
            }

            delete guildData.rewards[String(amount)];

            saveData(data);

            return message.reply(
                `✅ **${amount} davet** ödülü silindi.`
            );
        }

        // =====================================================
        // KANAL AYARLA
        // =====================================================

        if (
            command === "kanal"
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {
                return message.reply(
                    "❌ Bu ayarı kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            const channel =
                message.mentions.channels.first();

            if (!channel) {
                return message.reply(
                    "❌ Kullanım: `B!davet kanal #kanal`"
                );
            }

            guildData.channelId = channel.id;

            saveData(data);

            return message.reply(
                `✅ Davet bildirim kanalı ${channel} olarak ayarlandı.`
            );
        }

        // =====================================================
        // KANAL KAPAT
        // =====================================================

        if (
            command === "kanalkapat"
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {
                return message.reply(
                    "❌ Bu ayarı kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            guildData.channelId = null;

            saveData(data);

            return message.reply(
                "✅ Davet bildirimleri kapatıldı."
            );
        }

        // =====================================================
        // SIFIRLA
        // =====================================================

        if (
            command === "sıfırla" ||
            command === "sifirla"
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {
                return message.reply(
                    "❌ Bu ayarı kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            const target =
                message.mentions.users.first();

            if (!target) {
                return message.reply(
                    "❌ Kullanım: `B!davet sıfırla @Üye`"
                );
            }

            delete guildData.users[target.id];

            // O kişinin davet ettiği üyeleri de temizle
            for (const [memberId, info] of Object.entries(
                guildData.members
            )) {
                if (info.inviterId === target.id) {
                    delete guildData.members[memberId];
                }
            }

            saveData(data);

            return message.reply(
                `✅ ${target} kullanıcısının davet istatistikleri sıfırlandı.`
            );
        }

        // =====================================================
        // YARDIM
        // =====================================================

        return message.reply(
            `📨 **Davet Komutları**\n\n` +
            `\`B!davet\` → Kendi davetlerini gösterir\n` +
            `\`B!davet @Üye\` → Üyenin davetlerini gösterir\n` +
            `\`B!davet sıralama\` → Sunucu sıralaması\n` +
            `\`B!davet ödül 10 @Rol\` → Davet ödülü ayarlar\n` +
            `\`B!davet ödüller\` → Ödülleri gösterir\n` +
            `\`B!davet ödülsil 10\` → Ödül siler\n` +
            `\`B!davet kanal #kanal\` → Bildirim kanalı\n` +
            `\`B!davet kanalkapat\` → Bildirimleri kapatır\n` +
            `\`B!davet sıfırla @Üye\` → İstatistik sıfırlar`
        );
    }
};


