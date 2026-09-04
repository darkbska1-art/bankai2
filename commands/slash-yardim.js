const {
    SlashCommandBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("yardım")
        .setDescription("Bankai yardım menüsünü gösterir."),

    async execute(interaction, client) {
        // Buraya mevcut yardım panelini açtıracağız.
    }
};