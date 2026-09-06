const {
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");

module.exports = {
    name: "kanaloluştur",
    aliases: ["kanalolustur", "kanalac"],

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın."
                        )
                ]
            });
        }

        const name = args.join("-").toLowerCase();

        if (!name) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("📁 Kanal Oluştur")
                        .setDescription(
                            "**Kullanım:**\n" +
                            "`B!kanaloluştur kanal-ismi`\n\n" +
                            "**Örnek:**\n" +
                            "`B!kanaloluştur sohbet`\n" +
                            "`B!kanaloluştur anime-haberleri`"
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
                            "❌ Kanal adı en fazla **100 karakter** olabilir."
                        )
                ]
            });
        }

        try {
            const channel = await message.guild.channels.create({
                name: name,
                type: ChannelType.GuildText,
                reason: `${message.author.tag} tarafından oluşturuldu`
            });

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setTitle("✅ Kanal Oluşturuldu")
                        .setDescription(
                            `📁 **Kanal:** ${channel}\n` +
                            `📝 **İsim:** \`${channel.name}\`\n` +
                            `👮 **Oluşturan:** ${message.author}`
                        )
                        .setTimestamp()
                ]
            });

        } catch (error) {
            console.error("❌ Kanal oluşturma hatası:", error);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#000000")
                        .setDescription(
                            "❌ Kanal oluşturulurken bir hata oluştu."
                        )
                ]
            });
        }
    }
};