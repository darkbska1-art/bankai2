
const {
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "ticket.json");

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

module.exports = {
    name: "ticketayar",
    aliases: ["ticketayarla"],

    async execute(message, args) {

        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply(
                "❌ Bu komut için **Sunucuyu Yönet** yetkisi gerekiyor."
            );
        }

        const category =
            message.mentions.channels.first();

        const role =
            message.mentions.roles.first();

        if (!category || category.type !== ChannelType.GuildCategory) {
            return message.reply(
                "❌ Bir **kategori** etiketlemelisin.\n\n" +
                "Örnek:\n" +
                "`B!ticketayar #Ticket @Yetkili`"
            );
        }

        if (!role) {
            return message.reply(
                "❌ Ticket açıldığında etiketlenecek **yetkili rolünü** etiketlemelisin.\n\n" +
                "Örnek:\n" +
                "`B!ticketayar #Ticket @Yetkili`"
            );
        }

        const data = load();

        data[message.guild.id] = {
            categoryId: category.id,
            staffRoleId: role.id
        };

        save(data);

        const embed = {
            color: 0x000000,
            title: "🎫 Ticket Sistemi Ayarlandı",
            description:
                "Ticket sistemi başarıyla ayarlandı.",
            fields: [
                {
                    name: "📁 Kategori",
                    value: `${category}`,
                    inline: true
                },
                {
                    name: "🛡️ Yetkili Rolü",
                    value: `${role}`,
                    inline: true
                }
            ]
        };

        return message.reply({
            embeds: [embed]
        });
    }
};

