const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "butonrol",
    aliases: ["selectrol", "rolpanel"],

    async execute(message, args) {
        if (!message.guild) return;

        // Yetki
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bu komutu kullanmak için **Rolleri Yönet** yetkisine sahip olmalısın."
                        )
                ]
            });
        }

        const roles = [...message.mentions.roles.values()];

        if (!roles.length) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("🎭 Rol Paneli")
                        .setDescription(
                            "**Kullanım:**\n" +
                            "`B!butonrol @Rol 🎭`\n\n" +
                            "**Birden fazla rol:**\n" +
                            "`B!butonrol @Anime 🎌 @Manga 📖 @Bleach ⚔️`\n\n" +
                            "📌 En fazla **25 rol** ekleyebilirsin."
                        )
                ]
            });
        }

        if (roles.length > 25) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bir panelde en fazla **25 rol** olabilir."
                        )
                ]
            });
        }

        const botMember = message.guild.members.me;

        if (!botMember) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bot üyesi bulunamadı."
                        )
                ]
            });
        }

        // Emojileri bul
        const emojis = args.filter(arg => {
            return (
                !arg.startsWith("<@&") &&
                !arg.startsWith("<@") &&
                !arg.startsWith("<#")
            );
        });

        if (emojis.length !== roles.length) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Emoji Eksik")
                        .setDescription(
                            `**${roles.length} rol** ekledin fakat **${emojis.length} emoji** bulundu.\n\n` +
                            "**Doğru kullanım:**\n" +
                            "`B!butonrol @Anime 🎌 @Manga 📖 @Bleach ⚔️`"
                        )
                ]
            });
        }

        // Roller kontrol ediliyor
        const invalidRoles = roles.filter(role =>
            role.managed ||
            role.position >= botMember.roles.highest.position
        );

        if (invalidRoles.length) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("❌ Roller Kullanılamıyor")
                        .setDescription(
                            invalidRoles
                                .map(role =>
                                    `${role} — Bot bu rolü yönetemiyor.`
                                )
                                .join("\n")
                        )
                ]
            });
        }

        // Select Menu seçenekleri
        const options = roles.map((role, index) => {
            let emoji = emojis[index];

            const customEmojiMatch =
                emoji.match(/^<a?:([a-zA-Z0-9_]+):(\d+)>$/);

            if (customEmojiMatch) {
                emoji = {
                    name: customEmojiMatch[1],
                    id: customEmojiMatch[2],
                    animated: emoji.startsWith("<a:")
                };
            }

            return {
                label: role.name.slice(0, 100),
                description: "Rolü almak veya çıkarmak için seç.",
                value: role.id,
                emoji
            };
        });

        const menu = new StringSelectMenuBuilder()
            .setCustomId(
                `rolpanel_${message.guild.id}_${message.channel.id}`
            )
            .setPlaceholder("🎭 Rol almak/çıkarmak için seçim yap...")
            .setMinValues(1)
            .setMaxValues(Math.min(25, roles.length))
            .addOptions(options);

        const row = new ActionRowBuilder()
            .addComponents(menu);

        // Rol kullanım sayılarını hesapla
        const roleList = roles
            .map((role, index) => {
                const memberCount = role.members.size;

                return `${emojis[index]} ${role} — **${memberCount} kişi**`;
            })
            .join("\n");

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🎭 Rol Seçim Paneli")
            .setDescription(
                "Aşağıdaki menüden almak veya çıkarmak istediğin rolleri seç.\n\n" +
                "**Mevcut Roller:**\n" +
                roleList +
                "\n\n" +
                "➕ Rolün yoksa **verilir**.\n" +
                "➖ Rolün varsa **çıkarılır**.\n" +
                "🎭 Aynı anda birden fazla rol seçebilirsin."
            )
            .setFooter({
                text: `${message.guild.name} • Rol Sistemi`
            });

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setDescription(
                        `✅ Rol paneli oluşturuldu!\n\n` +
                        `🎭 **${roles.length} rol** eklendi.\n` +
                        `✨ Her role özel emoji ayarlandı.\n` +
                        `📊 Rol kullanım sayıları gösteriliyor.`
                    )
            ]
        });
    }
};