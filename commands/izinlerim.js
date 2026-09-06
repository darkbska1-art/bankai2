const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "izinlerim",
    aliases: ["izinler", "permissions"],

    async execute(message) {
        const member = message.member;

        const permissions = [
            [PermissionFlagsBits.Administrator, "Yönetici"],
            [PermissionFlagsBits.ManageGuild, "Sunucuyu Yönet"],
            [PermissionFlagsBits.ManageChannels, "Kanalları Yönet"],
            [PermissionFlagsBits.ManageRoles, "Rolleri Yönet"],
            [PermissionFlagsBits.ManageMessages, "Mesajları Yönet"],
            [PermissionFlagsBits.ManageMembers, "Üyeleri Yönet"],
            [PermissionFlagsBits.KickMembers, "Üyeleri At"],
            [PermissionFlagsBits.BanMembers, "Üyeleri Yasakla"],
            [PermissionFlagsBits.ModerateMembers, "Üyeleri Sustur"],
            [PermissionFlagsBits.ManageNicknames, "Takma Adları Yönet"],
            [PermissionFlagsBits.ManageWebhooks, "Webhookları Yönet"],
            [PermissionFlagsBits.ManageEmojisAndStickers, "Emoji ve Çıkartmaları Yönet"],
            [PermissionFlagsBits.ViewAuditLog, "Denetim Kaydını Görüntüle"],
            [PermissionFlagsBits.MentionEveryone, "@everyone Etiketle"],
            [PermissionFlagsBits.SendMessages, "Mesaj Gönder"],
            [PermissionFlagsBits.EmbedLinks, "Bağlantıları Göm"],
            [PermissionFlagsBits.AttachFiles, "Dosya Ekle"],
            [PermissionFlagsBits.Connect, "Ses Kanalına Bağlan"],
            [PermissionFlagsBits.Speak, "Konuş"]
        ];

        const sahipOlduklari = permissions
            .filter(([permission]) => member.permissions.has(permission))
            .map(([, name]) => `✅ ${name}`);

        const sahipOlmadiklari = permissions
            .filter(([permission]) => !member.permissions.has(permission))
            .map(([, name]) => `❌ ${name}`);

        const embed = new EmbedBuilder()
            .setColor("#000000")
            .setTitle("🔐 İzinlerim")
            .setDescription(
                `👤 **Kullanıcı:** ${message.author}\n\n` +
                `**Sahip Olduğun İzinler**\n${sahipOlduklari.join("\n") || "Yok"}\n\n` +
                `**Sahip Olmadığın İzinler**\n${sahipOlmadiklari.join("\n") || "Yok"}`
            )
            .setFooter({
                text: `Bankai • ${message.guild.name}`
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};