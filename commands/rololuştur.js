const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "rololuştur",
    aliases: ["rololustur", "rolecreate"],

    async execute(message, args) {
        if (!message.guild) return;

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

        const name = args.join(" ");

        if (!name) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("🎭 Rol Oluştur")
                        .setDescription(
                            "**Kullanım:**\n" +
                            "`B!rololuştur rol-ismi`\n\n" +
                            "**Örnek:**\n" +
                            "`B!rololuştur VIP`\n" +
                            "`B!rololuştur Anime İzleyicisi`"
                        )
                ]
            });
        }

        if (name.length > 100) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Rol adı en fazla **100 karakter** olabilir."
                        )
                ]
            });
        }

        const botMember = message.guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
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

        try {
            const role = await message.guild.roles.create({
                name: name,
                reason: `${message.author.tag} tarafından oluşturuldu`
            });

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("✅ Rol Oluşturuldu")
                        .setDescription(
                            `🎭 **Rol:** ${role}\n` +
                            `📝 **İsim:** \`${role.name}\`\n` +
                            `🆔 **ID:** \`${role.id}\`\n` +
                            `👮 **Oluşturan:** ${message.author}`
                        )
                        .setTimestamp()
                ]
            });

        } catch (error) {
            console.error("❌ Rol oluşturma hatası:", error);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Rol oluşturulurken bir hata oluştu."
                        )
                ]
            });
        }
    }
};