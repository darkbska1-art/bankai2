
const {
    SlashCommandBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("yardım")
        .setDescription("Bankai yardım menüsünü gösterir."),

    async execute(interaction, client) {
        const yardımCommand = client.commands.get("yardım");

        if (!yardımCommand) {
            return interaction.reply({
                content: "❌ Yardım komutu bulunamadı.",
                ephemeral: true
            });
        }

        const fakeMessage = {
            author: interaction.user,
            guild: interaction.guild,
            channel: interaction.channel,

            reply: async (data) => {
                return interaction.reply(data);
            }
        };

        await yardımCommand.execute(
            fakeMessage,
            [],
            client
        );
    }
};
