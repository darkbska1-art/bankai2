const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "rolver",
    aliases: ["give-role", "rolever"],

    async execute(message, args) {

        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription("❌ Bu komutu kullanmak için **Rolleri Yönet** yetkisine sahip olmalısın.")
                ]
            });
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription("❌ Rol vermek istediğin kişiyi etiketle.\n\n**Kullanım:** `B!rolver @kullanıcı @rol`")
                ]
            });
        }

        const role =
            message.mentions.roles.first();

        if (!role) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription("❌ Vermek istediğin rolü etiketle.\n\n**Kullanım:** `B!rolver @kullanıcı @rol`")
                ]
            });
        }

        if (role.managed) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription("❌ Entegrasyon tarafından yönetilen bir rolü veremem.")
                ]
            });
        }

        if (
            role.position >= message.guild.members.me.roles.highest.position
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription("❌ Bu rol benim en yüksek rolümün üstünde veya aynı seviyede.")
                ]
            });
        }

        if (member.roles.cache.has(role.id)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            `❌ ${member} zaten ${role} rolüne sahip.`
                        )
                ]
            });
        }

        try {
            await member.roles.add(
                role,
                `${message.author.tag} tarafından rol verildi`
            );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("✅ Rol Verildi")
                        .setDescription(
                            `👤 **Kullanıcı:** ${member}\n` +
                            `🎭 **Rol:** ${role}\n` +
                            `👮 **Yetkili:** ${message.author}`
                        )
                ]
            });

        } catch (error) {
            console.error("Rol verme hatası:", error);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription("❌ Rol verilirken bir hata oluştu.")
                ]
            });
        }
    }
};