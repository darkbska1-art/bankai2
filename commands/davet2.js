
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

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
            fs.readFileSync(
                DATA_PATH,
                "utf8"
            )
        );

    } catch {

        return {};
    }
}

function saveData(data) {

    fs.writeFileSync(
        DATA_PATH,
        JSON.stringify(
            data,
            null,
            4
        ),
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

    if (
        !Array.isArray(
            data[guildId].settings.rewards
        )
    ) {

        data[guildId].settings.rewards = [];
    }

    return data[guildId];
}

// =====================================================
// 🔐 YETKİ
// =====================================================

function isAdmin(message) {

    return message.member.permissions.has(
        PermissionFlagsBits.ManageGuild
    );
}

// =====================================================
// 📊 ANA KOMUT
// =====================================================

module.exports = {

    name: "davet",

    aliases: [
        "invite",
        "invites"
    ],

    async execute(message, args) {

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

        const sub =
            args[0]?.toLowerCase();

        // =================================================
        // 🏆 SIRALAMA
        // B!davet sıralama
        // =================================================

        if (
            sub === "sıralama" ||
            sub === "sirala" ||
            sub === "leaderboard"
        ) {

            const users =
                Object.entries(
                    guildData.users
                )
                .sort(
                    (a, b) =>
                        (b[1].valid || 0) -
                        (a[1].valid || 0)
                )
                .slice(0, 10);

            const lines = [];

            for (
                let i = 0;
                i < users.length;
                i++
            ) {

                const [
                    userId,
                    stats
                ] = users[i];

                const member =
                    await message.guild.members
                        .fetch(userId)
                        .catch(() => null);

                const username =
                    member
                        ? member.user.username
                        : `<@${userId}>`;

                let medal = "🔹";

                if (i === 0) medal = "🥇";
                if (i === 1) medal = "🥈";
                if (i === 2) medal = "🥉";

                lines.push(
                    `${medal} **${i + 1}. ${username}** — \`${stats.valid || 0}\` davet`
                );
            }

            if (!lines.length) {

                lines.push(
                    "Henüz davet verisi bulunmuyor."
                );
            }

            const embed =
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle(
                        "🏆 Sunucu Davet Sıralaması"
                    )
                    .setDescription(
                        lines.join("\n")
                    )
                    .setFooter({
                        text:
                            `${message.guild.name} • İlk 10`
                    })
                    .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 🎁 ÖDÜL EKLE
        // B!davet ödül 10 @Rol
        // =================================================

        if (sub === "ödül" || sub === "odul") {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Bu ayarı değiştirmek için **Sunucuyu Yönet** yetkisine sahip olmalısın."
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
                    "❌ Kullanım:\n`B!davet ödül 10 @Rol`"
                );
            }

            const rewards =
                guildData.settings.rewards;

            const existing =
                rewards.find(
                    reward =>
                        reward.invites === amount
                );

            if (existing) {

                existing.roleId =
                    role.id;

            } else {

                rewards.push({
                    invites: amount,
                    roleId: role.id
                });
            }

            rewards.sort(
                (a, b) =>
                    a.invites -
                    b.invites
            );

            saveData(data);

            return message.reply(
                `✅ **${amount} davet** ödülü ${role} olarak ayarlandı.`
            );
        }

        // =================================================
        // 🎁 ÖDÜLLERİ GÖSTER
        // B!davet ödüller
        // =================================================

        if (
            sub === "ödüller" ||
            sub === "oduller"
        ) {

            const rewards =
                guildData.settings.rewards;

            if (!rewards.length) {

                return message.reply(
                    "📭 Henüz ayarlanmış bir davet ödülü yok."
                );
            }

            const lines = [];

            for (
                const reward
                of rewards
            ) {

                lines.push(
                    `🎁 **${reward.invites} davet** → <@&${reward.roleId}>`
                );
            }

            const embed =
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle(
                        "🎁 Davet Ödülleri"
                    )
                    .setDescription(
                        lines.join("\n")
                    );

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // ❌ ÖDÜL SİL
        // B!davet ödülsil 10
        // =================================================

        if (
            sub === "ödülsil" ||
            sub === "odulsil"
        ) {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Bu ayarı değiştirmek için **Sunucuyu Yönet** yetkisine sahip olmalısın."
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

            const oldLength =
                guildData.settings.rewards.length;

            guildData.settings.rewards =
                guildData.settings.rewards.filter(
                    reward =>
                        reward.invites !== amount
                );

            if (
                oldLength ===
                guildData.settings.rewards.length
            ) {

                return message.reply(
                    "❌ Bu davet sayısına ait ödül bulunamadı."
                );
            }

            saveData(data);

            return message.reply(
                `✅ **${amount} davet** ödülü silindi.`
            );
        }

        // =================================================
        // 📢 DUYURU KANALI
        // B!davet kanal #kanal
        // =================================================

        if (sub === "kanal") {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Bu ayarı değiştirmek için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            const channel =
                message.mentions.channels.first();

            if (!channel) {

                return message.reply(
                    "❌ Kullanım: `B!davet kanal #kanal`"
                );
            }

            guildData.settings.channelId =
                channel.id;

            saveData(data);

            return message.reply(
                `✅ Davet duyuru kanalı ${channel} olarak ayarlandı.`
            );
        }

        // =================================================
        // ❌ KANAL KAPAT
        // B!davet kanalkapat
        // =================================================

        if (
            sub === "kanalkapat"
        ) {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Bu ayarı değiştirmek için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            guildData.settings.channelId =
                null;

            saveData(data);

            return message.reply(
                "✅ Davet duyuru sistemi kapatıldı."
            );
        }

        // =================================================
        // 🔄 SIFIRLA
        // B!davet sıfırla @üye
        // =================================================

        if (sub === "sıfırla" || sub === "sifirla") {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Bu işlemi yapmak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {

                return message.reply(
                    "❌ Kullanım: `B!davet sıfırla @Üye`"
                );
            }

            guildData.users[member.id] = {
                total: 0,
                valid: 0,
                left: 0
            };

            saveData(data);

            return message.reply(
                `✅ ${member} davet istatistikleri sıfırlandı.`
            );
        }

        // =================================================
        // 📊 KİŞİSEL DAVET
        // B!davet
        // B!davet @üye
        // =================================================

        const member =
            message.mentions.members.first() ||
            message.member;

        const stats =
            guildData.users[member.id] || {
                total: 0,
                valid: 0,
                left: 0
            };

        const embed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle(
                    "🎟️ Davet İstatistikleri"
                )
                .setThumbnail(
                    member.user.displayAvatarURL({
                        size: 256
                    })
                )
                .addFields(
                    {
                        name: "👤 Kullanıcı",
                        value:
                            `${member}`,
                        inline: false
                    },
                    {
                        name: "📨 Toplam",
                        value:
                            `\`${stats.total}\``,
                        inline: true
                    },
                    {
                        name: "✅ Geçerli",
                        value:
                            `\`${stats.valid}\``,
                        inline: true
                    },
                    {
                        name: "❌ Ayrılan",
                        value:
                            `\`${stats.left}\``,
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
};

