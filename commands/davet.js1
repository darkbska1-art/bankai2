
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
// 💾 VERİ OKU
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

// =====================================================
// 💾 VERİ KAYDET
// =====================================================

function saveData(data) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}

// =====================================================
// 🏠 SUNUCU VERİSİ
// =====================================================

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

// =====================================================
// 📊 KULLANICI VERİSİ
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
// 📨 KOMUT
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

        const data = loadData();

        const guildData =
            getGuildData(
                data,
                message.guild.id
            );

        // =================================================
        // 📊 KENDİ DAVETLERİ
        // =================================================

        if (!args[0]) {

            const userData =
                getUserData(
                    guildData,
                    message.author.id
                );

            const embed =
                new EmbedBuilder()
                    .setTitle("📨 Davet Bilgilerin")
                    .setDescription(
                        `👤 **Kullanıcı:** ${message.author}\n\n` +
                        `📨 **Toplam:** ${userData.total}\n` +
                        `✅ **Geçerli:** ${userData.valid}\n` +
                        `📤 **Ayrılan:** ${userData.left}`
                    )
                    .setColor("Blue")
                    .setFooter({
                        text: message.guild.name
                    });

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 👤 BAŞKA KULLANICI
        // =================================================

        if (message.mentions.users.first()) {

            const user =
                message.mentions.users.first();

            const userData =
                getUserData(
                    guildData,
                    user.id
                );

            const embed =
                new EmbedBuilder()
                    .setTitle("📨 Davet Bilgileri")
                    .setDescription(
                        `👤 **Kullanıcı:** ${user}\n\n` +
                        `📨 **Toplam:** ${userData.total}\n` +
                        `✅ **Geçerli:** ${userData.valid}\n` +
                        `📤 **Ayrılan:** ${userData.left}`
                    )
                    .setColor("Blue");

            return message.reply({
                embeds: [embed]
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

            const users =
                Object.entries(
                    guildData.users
                )
                    .sort(
                        (a, b) =>
                            b[1].valid -
                            a[1].valid
                    )
                    .slice(0, 10);

            if (!users.length) {

                return message.reply(
                    "📭 Henüz davet verisi bulunmuyor."
                );
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

                description +=
                    `**${i + 1}.** <@${userId}> — ` +
                    `✅ **${userData.valid}** davet\n`;
            }

            const embed =
                new EmbedBuilder()
                    .setTitle("🏆 Davet Sıralaması")
                    .setDescription(description)
                    .setColor("Gold")
                    .setFooter({
                        text:
                            `${message.guild.name} • İlk 10`
                    });

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // 🎁 ÖDÜL EKLE
        // =================================================

        if (
            command === "ödül" ||
            command === "odul"
        ) {

            if (
                !message.member.permissions.has(
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

            guildData.rewards[
                amount
            ] = role.id;

            saveData(data);

            return message.reply(
                `🎁 **${amount} davet** karşılığında ${role} rolü verilecek.`
            );
        }

        // =================================================
        // 🎁 ÖDÜLLER
        // =================================================

        if (
            command === "ödüller" ||
            command === "oduller"
        ) {

            const rewards =
                Object.entries(
                    guildData.rewards
                );

            if (!rewards.length) {

                return message.reply(
                    "📭 Henüz ödül ayarlanmamış."
                );
            }

            let text = "";

            for (
                const [amount, roleId]
                of rewards
            ) {

                text +=
                    `🎁 **${amount} davet** → <@&${roleId}>\n`;
            }

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🎁 Davet Ödülleri")
                        .setDescription(text)
                        .setColor("Green")
                ]
            });
        }

        // =================================================
        // ❌ ÖDÜL SİL
        // =================================================

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
                    "❌ Bu sayıda davet için ödül bulunamadı."
                );
            }

            delete guildData.rewards[
                amount
            ];

            saveData(data);

            return message.reply(
                `🗑️ **${amount} davet** ödülü silindi.`
            );
        }

        // =================================================
        // 📢 DAVET KANALI
        // =================================================

        if (command === "kanal") {

            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
                );
            }

            const channel =
                message.mentions.channels.first();

            if (!channel) {

                return message.reply(
                    "❌ Kullanım: `B!davet kanal #kanal`"
                );
            }

            guildData.channelId =
                channel.id;

            saveData(data);

            return message.reply(
                `📢 Davet bildirim kanalı ${channel} olarak ayarlandı.`
            );
        }

        // =================================================
        // 🔕 KANALI KAPAT
        // =================================================

        if (command === "kanalkapat") {

            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return message.reply(
                    "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
                );
            }

            guildData.channelId = null;

            saveData(data);

            return message.reply(
                "🔕 Davet bildirim kanalı kapatıldı."
            );
        }

        // =================================================
        // 🗑️ KULLANICI SIFIRLA
        // =================================================

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
                    "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
                );
            }

            const user =
                message.mentions.users.first();

            if (!user) {

                return message.reply(
                    "❌ Kullanıcı belirtmelisin.\n`B!davet sıfırla @Kullanıcı`"
                );
            }

            delete guildData.users[
                user.id
            ];

            for (
                const memberId
                of Object.keys(guildData.members)
            ) {

                if (
                    guildData.members[memberId]
                        .inviterId === user.id
                ) {

                    delete guildData.members[
                        memberId
                    ];
                }
            }

            saveData(data);

            return message.reply(
                `🗑️ ${user} kullanıcısının davet verileri sıfırlandı.`
            );
        }

        // =================================================
        // ❓ YARDIM
        // =================================================

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("📨 Davet Sistemi")
                    .setDescription(
                        `**B!davet** → Davet bilgilerin\n` +
                        `**B!davet @Üye** → Üyenin davetleri\n` +
                        `**B!davet sıralama** → Davet sıralaması\n\n` +
                        `**Yönetici:**\n` +
                        `B!davet ödül 10 @Rol\n` +
                        `B!davet ödüller\n` +
                        `B!davet ödülsil 10\n` +
                        `B!davet kanal #kanal\n` +
                        `B!davet kanalkapat\n` +
                        `B!davet sıfırla @Üye`
                    )
                    .setColor("Blue")
            ]
        });
    }
};

