const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "rolsil",
    aliases: ["rolsil", "roledelete", "rolkaldır", "rolkaldir"],

    async execute(message) {
        if (!message.guild) return;

        // Yetki kontrolü
        if (
            !message.member.permissions.has(
                PermissionFlagsBits.ManageRoles
            )
        ) {
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

        // Rol etiketlenmiş mi?
        const role = message.mentions.roles.first();

        if (!role) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("🗑️ Rol Sil")
                        .setDescription(
                            "**Kullanım:**\n" +
                            "`B!rolsil @rol`\n\n" +
                            "**Örnek:**\n" +
                            "`B!rolsil @VIP`"
                        )
                ]
            });
        }

        // Entegrasyon rolü kontrolü
        if (role.managed) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Entegrasyon tarafından yönetilen bir rolü silemem."
                        )
                ]
            });
        }

        const botMember = message.guild.members.me;

        // Botun Manage Roles yetkisi
        if (
            !botMember.permissions.has(
                PermissionFlagsBits.ManageRoles
            )
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Benim **Rolleri Yönet** yetkim yok."
                        )
                ]
            });
        }

        // Rol hiyerarşisi
        if (
            role.position >=
            botMember.roles.highest.position
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bu rol benim en yüksek rolümün üstünde veya aynı seviyede."
                        )
                ]
            });
        }

        // @everyone kontrolü
        if (role.id === message.guild.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ `@everyone` rolü silinemez."
                        )
                ]
            });
        }

        try {
            const roleName = role.name;

            await role.delete(
                `${message.author.tag} tarafından rol silindi`
            );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("🗑️ Rol Silindi")
                        .setDescription(
                            `🎭 **Rol:** \`${roleName}\`\n` +
                            `👮 **Silen:** ${message.author}`
                        )
                        .setTimestamp()
                ]
            });

        } catch (error) {
            console.error(
                "❌ Rol silme hatası:",
                error
            );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Rol silinirken bir hata oluştu."
                        )
                ]
            });
        }
    }
};