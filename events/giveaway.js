
const {
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(
    __dirname,
    "..",
    "cekilis.json"
);

function load() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    try {
        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch {
        return {};
    }
}

function save(data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}

module.exports = client => {

    client.on("interactionCreate", async interaction => {

        if (!interaction.isButton()) return;

        if (!interaction.customId.startsWith("giveaway_")) {
            return;
        }

        const parts = interaction.customId.split("_");

        const action = parts[1];

        const id = parts.slice(2).join("_");

        const data = load();

        const giveaway = data[id];

        if (!giveaway) {
            return interaction.reply({
                content: "❌ Bu çekiliş bulunamadı.",
                ephemeral: true
            });
        }

        // =========================================
        // 🎟️ KATIL
        // =========================================

        if (action === "join") {

            if (giveaway.ended) {
                return interaction.reply({
                    content: "❌ Bu çekiliş sona erdi.",
                    ephemeral: true
                });
            }

            if (Date.now() >= giveaway.endTime) {
                return interaction.reply({
                    content: "❌ Bu çekilişin süresi doldu.",
                    ephemeral: true
                });
            }

            if (
                giveaway.participants.includes(
                    interaction.user.id
                )
            ) {
                return interaction.reply({
                    content:
                        "❌ Zaten bu çekilişe katıldın!",
                    ephemeral: true
                });
            }

            giveaway.participants.push(
                interaction.user.id
            );

            save(data);

            try {
                const embed =
                    interaction.message.embeds[0];

                const updated =
                    embed.toJSON();

                const description =
                    updated.description.replace(
                        /👥 \*\*Katılımcılar:\*\* \d+ kişi/,
                        `👥 **Katılımcılar:** ${giveaway.participants.length} kişi`
                    );

                updated.description = description;

                await interaction.message.edit({
                    embeds: [updated]
                });

            } catch {}

            return interaction.reply({
                content:
                    "🎟️ Çekilişe katıldın!",
                ephemeral: true
            });
        }

        // =========================================
        // 🚪 AYRIL
        // =========================================

        if (action === "leave") {

            if (giveaway.ended) {
                return interaction.reply({
                    content:
                        "❌ Bu çekiliş sona erdi.",
                    ephemeral: true
                });
            }

            const index =
                giveaway.participants.indexOf(
                    interaction.user.id
                );

            if (index === -1) {
                return interaction.reply({
                    content:
                        "❌ Bu çekilişe zaten katılmıyorsun.",
                    ephemeral: true
                });
            }

            giveaway.participants.splice(
                index,
                1
            );

            save(data);

            try {
                const embed =
                    interaction.message.embeds[0];

                const updated =
                    embed.toJSON();

                const description =
                    updated.description.replace(
                        /👥 \*\*Katılımcılar:\*\* \d+ kişi/,
                        `👥 **Katılımcılar:** ${giveaway.participants.length} kişi`
                    );

                updated.description = description;

                await interaction.message.edit({
                    embeds: [updated]
                });

            } catch {}

            return interaction.reply({
                content:
                    "🚪 Çekilişten ayrıldın.",
                ephemeral: true
            });
        }

        // =========================================
        // 🗑️ İPTAL
        // =========================================

        if (action === "cancel") {

            if (!interaction.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            )) {
                return interaction.reply({
                    content:
                        "❌ Çekilişi iptal etmek için **Sunucuyu Yönet** yetkisi gerekiyor.",
                    ephemeral: true
                });
            }

            giveaway.ended = true;

            save(data);

            try {
                await interaction.message.edit({
                    components: []
                });
            } catch {}

            return interaction.reply(
                "🗑️ Çekiliş iptal edildi."
            );
        }
    });

    console.log(
        "🎉  çekiliş sistemi aktif!"
    );
};

