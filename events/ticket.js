
const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(
    __dirname,
    "..",
    "ticket.json"
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

module.exports = client => {

    client.on(
        "interactionCreate",
        async interaction => {

            if (!interaction.isButton()) return;

            const button = interaction.customId;

            const ticketButtons = [
                "ticket_destek",
                "ticket_sikayet",
                "ticket_basvuru",
                "ticket_close"
            ];

            if (!ticketButtons.includes(button)) {
                return;
            }

            // =========================================
            // 🔒 TICKET KAPAT
            // =========================================

            if (button === "ticket_close") {

                await interaction.reply({
                    content:
                        "🔒 Ticket **5 saniye** içinde kapatılacak.",
                    ephemeral: true
                });

                setTimeout(async () => {

                    try {
                        await interaction.channel.delete();
                    } catch (error) {
                        console.error(
                            "❌ Ticket silinemedi:",
                            error
                        );
                    }

                }, 5000);

                return;
            }

            // =========================================
            // ⚙️ AYARLAR
            // =========================================

            const data = load();

            const settings =
                data[interaction.guild.id];

            if (!settings?.categoryId) {
                return interaction.reply({
                    content:
                        "❌ Ticket sistemi ayarlanmamış.",
                    ephemeral: true
                });
            }

            const staffRole =
                interaction.guild.roles.cache.get(
                    settings.staffRoleId
                );

            if (!staffRole) {
                return interaction.reply({
                    content:
                        "❌ Ayarlanan yetkili rolü bulunamadı.",
                    ephemeral: true
                });
            }

            // =========================================
            // 🔍 ZATEN AÇIK TICKET VAR MI?
            // =========================================

            const existing =
                interaction.guild.channels.cache.find(
                    channel =>
                        channel.parentId ===
                            settings.categoryId &&
                        channel.topic ===
                            `ticket:${interaction.user.id}`
                );

            if (existing) {
                return interaction.reply({
                    content:
                        `❌ Zaten açık bir ticketın var: ${existing}`,
                    ephemeral: true
                });
            }

            // =========================================
            // 🎫 TICKET TÜRÜ
            // =========================================

            let type = "Destek";
            let emoji = "🎫";

            if (button === "ticket_sikayet") {
                type = "Şikayet";
                emoji = "🚨";
            }

            if (button === "ticket_basvuru") {
                type = "Yetkili Başvurusu";
                emoji = "👮";
            }

            // =========================================
            // 📝 KANAL İSMİ
            // =========================================

            const username =
                interaction.user.username
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "")
                    .slice(0, 20) ||
                "kullanici";

            const ticketChannel =
                await interaction.guild.channels.create({

                    name:
                        `ticket-${username}`,

                    type:
                        ChannelType.GuildText,

                    parent:
                        settings.categoryId,

                    topic:
                        `ticket:${interaction.user.id}`,

                    permissionOverwrites: [

                        // Herkes göremez
                        {
                            id:
                                interaction.guild.roles
                                    .everyone.id,

                            deny: [
                                PermissionFlagsBits.ViewChannel
                            ]
                        },

                        // Ticket sahibi
                        {
                            id:
                                interaction.user.id,

                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.AttachFiles
                            ]
                        },

                        // Yetkili rolü
                        {
                            id:
                                staffRole.id,

                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.AttachFiles
                            ]
                        },

                        // Bot
                        {
                            id:
                                client.user.id,

                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.ManageChannels,
                                PermissionFlagsBits.ManageMessages
                            ]
                        }
                    ]
                });

            // =========================================
            // 🎀 TICKET EMBED
            // =========================================

            const embed =
                new EmbedBuilder()
                    .setColor(0xFF69B4)
                    .setTitle(
                        `${emoji} ${type} Ticket`
                    )
                    .setDescription(
                        `Hoş geldin ${interaction.user}!\n\n` +
                        `📌 **Ticket Türü:** ${type}\n\n` +
                        `🛡️ Yetkili ekibi birazdan seninle ilgilenecektir.\n` +
                        `Sorununu veya talebini detaylı şekilde açıklayabilirsin.\n\n` +
                        `🔒 Ticketı kapatmak için aşağıdaki butonu kullanabilirsin.`
                    )
                    .addFields(
                        {
                            name: "👤 Ticket Sahibi",
                            value:
                                `${interaction.user}`,
                            inline: true
                        },
                        {
                            name: "📂 Kategori",
                            value:
                                type,
                            inline: true
                        }
                    )
                    .setThumbnail(
                        interaction.user.displayAvatarURL({
                            extension: "png",
                            size: 256
                        })
                    )
                    .setFooter({
                        text:
                            "🏦 Bankai • Ticket Sistemi"
                    })
                    .setTimestamp();

            // =========================================
            // 🔒 KAPAT BUTONU
            // =========================================

            const closeRow =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId(
                                "ticket_close"
                            )
                            .setLabel(
                                "Ticketı Kapat"
                            )
                            .setEmoji("🔒")
                            .setStyle(
                                ButtonStyle.Danger
                            )
                    );

            // =========================================
            // 📩 TICKET MESAJI
            // =========================================

            await ticketChannel.send({

                content:
                    `${staffRole} ${interaction.user}`,

                embeds: [
                    embed
                ],

                components: [
                    closeRow
                ]
            });

            // =========================================
            // ✅ KULLANICIYA BİLGİ
            // =========================================

            await interaction.reply({
                content:
                    `✅ Ticketın oluşturuldu: ${ticketChannel}`,
                ephemeral: true
            });

            console.log(
                `🎫 Ticket açıldı | ${interaction.user.tag} | ${type}`
            );
        }
    );
};

