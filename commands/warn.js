
// =====================================================
// commands/warn.js
// =====================================================

const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const warnPath = path.join(
    __dirname,
    "..",
    "warns.json"
);

// =====================================================
// WARN VERİLERİNİ YÜKLE
// =====================================================

function loadWarns() {

    if (!fs.existsSync(warnPath)) {
        fs.writeFileSync(
            warnPath,
            "{}",
            "utf8"
        );
    }

    try {
        return JSON.parse(
            fs.readFileSync(warnPath, "utf8")
        );
    } catch {
        return {};
    }
}

// =====================================================
// WARN VERİLERİNİ KAYDET
// =====================================================

function saveWarns(data) {

    fs.writeFileSync(
        warnPath,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

// =====================================================
// KOMUT
// =====================================================

module.exports = {
    name: "warn",
    aliases: [
        "uyar",
        "uyarı",
        "warnsil",
        "uyarisil",
        "uyarısil"
    ],

    async execute(message, args) {

        // =================================================
        // YETKİ KONTROLÜ
        // =================================================

        if (
            !message.member.permissions.has(
                PermissionFlagsBits.ModerateMembers
            )
        ) {
            return message.reply(
                "❌ **Üyelere Zaman Aşımı Uygula** yetkin yok."
            );
        }

        // =================================================
        // KOMUTU ALGILA
        // =================================================

        const commandName =
            message.content
                .slice(1)
                .trim()
                .split(/\s+/)[0]
                .toLowerCase();

        const isDelete =
            commandName === "warnsil" ||
            commandName === "uyarisil" ||
            commandName === "uyarısil";

        // =================================================
        // ÜYE BUL
        // =================================================

        const member =
            message.mentions.members.first() ||
            await message.guild.members.fetch(
                args[0]
            ).catch(() => null);

        if (!member) {

            if (isDelete) {
                return message.reply(
                    "❌ Uyarısını silmek istediğin üyeyi belirtmelisin.\n" +
                    "Örnek: `B!warnsil @Ali`"
                );
            }

            return message.reply(
                "❌ Bir üye belirtmelisin.\n" +
                "Örnek: `B!warn @Ali spam`"
            );
        }

        // =================================================
        // KENDİSİNE İŞLEM
        // =================================================

        if (member.id === message.author.id) {
            return message.reply(
                isDelete
                    ? "❌ Kendi uyarını silemezsin."
                    : "❌ Kendini uyaramazsın."
            );
        }

        const data = loadWarns();

        // =================================================
        // SUNUCU / ÜYE KAYDI YOK
        // =================================================

        if (!data[message.guild.id]) {
            data[message.guild.id] = {};
        }

        if (!data[message.guild.id][member.id]) {
            data[message.guild.id][member.id] = [];
        }

        const warns =
            data[message.guild.id][member.id];

        // =================================================
        // WARN SİL
        // =================================================

        if (isDelete) {

            if (warns.length === 0) {
                return message.reply(
                    `❌ **${member.user.tag}** kullanıcısının hiç uyarısı yok.`
                );
            }

            const deleteArg =
                args
                    .slice(1)
                    .join(" ")
                    .toLowerCase();

            // ---------------------------------------------
            // TÜM UYARILARI SİL
            // ---------------------------------------------

            if (
                deleteArg === "hepsi" ||
                deleteArg === "tümü" ||
                deleteArg === "tum" ||
                deleteArg === "all"
            ) {

                const deletedCount =
                    warns.length;

                data[message.guild.id][member.id] = [];

                saveWarns(data);

                const embed = new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("🗑️ Uyarılar Silindi")
                    .setThumbnail(
                        member.user.displayAvatarURL()
                    )
                    .addFields(
                        {
                            name: "👤 Üye",
                            value: `${member.user.tag}`,
                            inline: true
                        },
                        {
                            name: "🗑️ Silinen Uyarı",
                            value: `\`${deletedCount}\``,
                            inline: true
                        },
                        {
                            name: "👮 Yetkili",
                            value: `${message.author}`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Tüm uyarı kayıtları silindi."
                    })
                    .setTimestamp();

                return message.reply({
                    embeds: [embed]
                });
            }

            // ---------------------------------------------
            // BELİRLİ UYARIYI SİL
            // ---------------------------------------------

            if (deleteArg) {

                const warnNumber =
                    parseInt(deleteArg);

                if (
                    isNaN(warnNumber) ||
                    warnNumber < 1 ||
                    warnNumber > warns.length
                ) {
                    return message.reply(
                        `❌ Geçersiz uyarı numarası.\n` +
                        `Bu kullanıcının **${warns.length}** uyarısı var.\n\n` +
                        `Örnek: \`B!warnsil @${member.user.username} 2\``
                    );
                }

                const deletedWarn =
                    warns.splice(
                        warnNumber - 1,
                        1
                    )[0];

                saveWarns(data);

                const embed = new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("🗑️ Uyarı Silindi")
                    .setThumbnail(
                        member.user.displayAvatarURL()
                    )
                    .addFields(
                        {
                            name: "👤 Üye",
                            value: `${member.user.tag}`,
                            inline: true
                        },
                        {
                            name: "🔢 Silinen Uyarı",
                            value: `\`#${warnNumber}\``,
                            inline: true
                        },
                        {
                            name: "📊 Kalan Uyarı",
                            value: `\`${warns.length}\``,
                            inline: true
                        },
                        {
                            name: "📝 Silinen Sebep",
                            value:
                                deletedWarn.reason ||
                                "Sebep belirtilmedi.",
                            inline: false
                        },
                        {
                            name: "👮 Silen Yetkili",
                            value: `${message.author}`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Uyarı kaydı silindi."
                    })
                    .setTimestamp();

                return message.reply({
                    embeds: [embed]
                });
            }

            // ---------------------------------------------
            // NUMARA VERİLMEZSE SON UYARIYI SİL
            // ---------------------------------------------

            const deletedWarn =
                warns.pop();

            saveWarns(data);

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🗑️ Son Uyarı Silindi")
                .setThumbnail(
                    member.user.displayAvatarURL()
                )
                .addFields(
                    {
                        name: "👤 Üye",
                        value: `${member.user.tag}`,
                        inline: true
                    },
                    {
                        name: "📊 Kalan Uyarı",
                        value: `\`${warns.length}\``,
                        inline: true
                    },
                    {
                        name: "👮 Silen Yetkili",
                        value: `${message.author}`,
                        inline: true
                    },
                    {
                        name: "📝 Silinen Sebep",
                        value:
                            deletedWarn.reason ||
                            "Sebep belirtilmedi.",
                        inline: false
                    }
                )
                .setFooter({
                    text: "Son uyarı kaydı silindi."
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // WARN VER
        // =================================================

        const reason =
            args.slice(1).join(" ") ||
            "Sebep belirtilmedi.";

        warns.push({
            reason,
            moderator: message.author.id,
            date: new Date().toISOString()
        });

        saveWarns(data);

        const total =
            warns.length;

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("⚠️ Üye Uyarıldı")
            .setThumbnail(
                member.user.displayAvatarURL()
            )
            .addFields(
                {
                    name: "👤 Üye",
                    value: `${member.user.tag}`,
                    inline: true
                },
                {
                    name: "🔢 Toplam Uyarı",
                    value: `\`${total}\``,
                    inline: true
                },
                {
                    name: "👮 Yetkili",
                    value: `${message.author}`,
                    inline: true
                },
                {
                    name: "📝 Sebep",
                    value: reason,
                    inline: false
                }
            )
            .setFooter({
                text: "Uyarı kaydı kalıcı olarak saklandı."
            })
            .setTimestamp();

        await message.reply({
            embeds: [embed]
        });
    }
};

