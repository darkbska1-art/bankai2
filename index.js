const http = require("http");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Discord bot is running!");
}).listen(PORT, () => {
    console.log(`🌐 Web server ${PORT} portunda çalışıyor.`);
});


const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    REST,
    Routes,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");



const fs = require("fs");
const path = require("path");
const config = require("./config.js");
const { updateUserStreak } = require("./database/streak");
const sureliRol = require("./commands/sürelirol.js");


// =====================================================
// 🤖 CLIENT
// =====================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],

    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
    ]
});

global.client = client;

// =====================================================
// 📦 KOMUT SİSTEMİ
// =====================================================

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
}

const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    try {
        const command = require(
            path.join(commandsPath, file)
        );

        if (
            !command.name ||
            typeof command.execute !== "function"
        ) {
            console.log(`⚠️ ${file} geçersiz komut.`);
            continue;
        }

        client.commands.set(
            command.name.toLowerCase(),
            command
        );

        if (Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
                client.commands.set(
                    alias.toLowerCase(),
                    command
                );
            }
        }

        console.log(
            `✅ Komut yüklendi: ${command.name}`
        );

    } catch (error) {
        console.error(
            `❌ ${file} yüklenemedi:`
        );
        console.error(error);
    }
}
// =====================================================
// 💬 MESAJ KOMUTLARI
// =====================================================

client.on("messageCreate", async message => {
    try {
        if (message.author.bot) return;

        let prefixes = [];

        if (Array.isArray(config.prefixes)) {
            prefixes = config.prefixes;
        } else if (typeof config.prefix === "string") {
            prefixes = [config.prefix];
        } else {
            prefixes = ["B!"];
        }

        const prefix = prefixes.find(p =>
            message.content.startsWith(p)
        );

        if (!prefix) return;

        const content = message.content
            .slice(prefix.length)
            .trim();

        if (!content) return;

        const args = content.split(/\s+/);

        const commandName = args
            .shift()
            ?.toLowerCase();

        if (!commandName) return;

        const command =
            client.commands.get(commandName);

        if (!command) return;

        console.log(
            `📥 Komut: ${prefix}${commandName} | ${message.author.tag}`
        );

 
        // =====================================================
        // 🔥 GLOBAL SERİ
        // =====================================================

        updateUserStreak(message.author.id);

        // =====================================================
        // ▶️ KOMUTU ÇALIŞTIR
        // =====================================================

        await command.execute(
            message,
            args,
            client
        );

    } catch (error) {
        console.error(
            "❌ Komut hatası:",
            error
        );
    }
});
client.on("guildMemberAdd", async member => {
    try {
        const fs = require("fs");
        const path = require("path");

        const filePath = path.join(
            __dirname,
            "autorole.json"
        );

        if (!fs.existsSync(filePath)) return;

        const data = JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

        const settings = data[member.guild.id];

        if (!settings) return;

        const roleId = member.user.bot
            ? settings.botRole
            : settings.memberRole;

        if (!roleId) return;

        const role = member.guild.roles.cache.get(roleId);

        if (!role) return;

        if (role.position >= member.guild.members.me.roles.highest.position) {
            console.log(
                `❌ ${member.guild.name}: ${role.name} rolü verilemiyor.`
            );
            return;
        }

        await member.roles.add(role);

        console.log(
            `✅ ${member.user.tag} kullanıcısına ${role.name} verildi.`
        );

    } catch (error) {
        console.error(
            "❌ Otorol hatası:",
            error
        );
    }
});
// =====================================================
// 🔗 SLASH KOMUTLARINI DISCORD'A KAYDET
// =====================================================

const rest = new REST({ version: "10" })
    .setToken(config.token);

async function registerSlashCommands() {

    try {

        const slashCommands = [];
        const addedCommands = new Set();

        for (const command of client.commands.values()) {

            if (!command.data) continue;

            const commandName = command.data.name;

            if (addedCommands.has(commandName)) continue;

            addedCommands.add(commandName);

            slashCommands.push(
                command.data.toJSON()
            );
        }

        console.log("🔄 Slash komutları yükleniyor...");

        await rest.put(
            Routes.applicationCommands(client.user.id),
            {
                body: slashCommands
            }
        );

        console.log(
            `✅ ${slashCommands.length} slash komut yüklendi!`
        );

    } catch (error) {
        console.error("❌ Slash komutları yüklenemedi:");
        console.error(error);
    }
}




// =====================================================
// 🟢 BOT HAZIR
// =====================================================


client.once("clientReady", async () => {

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log(
        `✅ ${client.user.tag} olarak giriş yapıldı!`
    );

    await registerSlashCommands();

    console.log("🏦 Bankai aktif!");

    console.log(
        `🌐 ${client.guilds.cache.size} sunucuda bulunuyor.`
    );

    console.log(
        `📦 ${client.commands.size} komut/alias yüklendi.`
    );

    client.user.setActivity("B!seri Globalde farkını göster!", {
        type: 2
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

    // Süreli roller
    sureliRol.checkExpiredRoles(client);

    setInterval(() => {
        sureliRol.checkExpiredRoles(client);
    }, 10 * 1000);


try {
    const boostEvent = require("./events/boost");

    client.once("clientReady", () => {
        boostEvent(client);
        console.log("🚀 Boost sistemi aktif!");
    });

} catch (error) {
    console.error("❌ Boost sistemi başlatılamadı:");
    console.error(error);
}
// =====================================================
// 🎉 ÇEKİLİŞ EVENT
// =====================================================

try {
    const giveawayEvent =
        require("./events/giveaway.js");

    giveawayEvent(client);

} catch (error) {
    console.error(
        "❌ Çekiliş eventi yüklenemedi:"
    );

    console.error(error);
}
// =====================================================
// 🎫 TICKET EVENT
// =====================================================

try {
    const ticketEvent = require("./events/ticket.js");

    ticketEvent(client);

    console.log("🎫 Ticket event yüklendi!");

} catch (error) {
    console.error("❌ Ticket event yüklenemedi:");
    console.error(error);
}
// =====================================================
// 📰 ANİME HABER
// =====================================================

try {
    const {
        startAnimeNews
    } = require("./events/animeNews");

    client.once("clientReady", () => {
        try {
            startAnimeNews(client);
            console.log(
                "📰 Anime haber sistemi aktif!"
            );
        } catch (error) {
            console.error(
                "❌ Anime haber sistemi başlatılamadı:",
                error
            );
        }
    });

} catch {
    console.log(
        "⚠️ Anime haber eventi bulunamadı."
    );
}

const pollCommand = require("./commands/poll");

client.on("interactionCreate", async interaction => {

    if (!interaction.isButton()) return;

    const id = interaction.customId;

    if (!id.startsWith("poll_")) return;

    const parts = id.split("_");

    const action = parts[1];
    const pollId = parts.slice(2, -1).join("_");
    const lastPart = parts[parts.length - 1];

    const poll = pollCommand.activePolls.get(
        action === "vote" ? parts.slice(2, -1).join("_") : parts.slice(2).join("_")
    );

    if (!poll) {
        return interaction.reply({
            content: "❌ Bu anket artık aktif değil.",
            ephemeral: true
        });
    }

    // =========================
    // OY VER
    // =========================

    if (action === "vote") {

        const optionIndex = Number(lastPart);

        if (
            Number.isNaN(optionIndex) ||
            optionIndex < 0 ||
            optionIndex >= poll.options.length
        ) {
            return interaction.reply({
                content: "❌ Geçersiz seçenek.",
                ephemeral: true
            });
        }

        const existingVote = poll.votes.find(
            vote => vote.userId === interaction.user.id
        );

        if (existingVote) {
            existingVote.option = optionIndex;
        } else {
            poll.votes.push({
                userId: interaction.user.id,
                option: optionIndex
            });
        }

        await interaction.update({
            embeds: [pollCommand.createPollEmbed(poll)],
            components: pollCommand.createButtons(poll)
        });

        return;
    }

    // =========================
    // ANKETİ BİTİR
    // =========================

    if (action === "end") {

        if (interaction.user.id !== poll.creatorId) {
            return interaction.reply({
                content: "❌ Bu anketi sadece oluşturan kişi bitirebilir.",
                ephemeral: true
            });
        }

        await interaction.deferUpdate();

        await pollCommand.finishPoll(
            poll,
            interaction.message
        );

        return;
    }

    // =========================
    // BİLGİ
    // =========================

    if (action === "info") {

        return interaction.reply({
            content:
                `📊 **Anket Bilgileri**\n\n` +
                `👤 Oluşturan: <@${poll.creatorId}>\n` +
                `🗳️ Toplam oy: **${poll.votes.length}**\n` +
                `⏱️ Kalan: **${formatPollTime(poll.endsAt - Date.now())}**`,
            ephemeral: true
        });
    }
});

function formatPollTime(ms) {

    if (ms <= 0) return "Bitti";

    const seconds = Math.floor(ms / 1000);

    if (seconds < 60) {
        return `${seconds} saniye`;
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} dakika`;
    }

    const hours = Math.floor(minutes / 60);

    return `${hours} saat`;
}
const haber = require("./commands/haber.js");

client.on("interactionCreate", async interaction => {
    try {
        if (!interaction.isButton()) return;

        const id = interaction.customId;

        // ==============================
        // HABER KATEGORİLERİ
        // ==============================

        if (id.startsWith("haber_category_")) {
            const category = id.replace(
                "haber_category_",
                ""
            );

            await haber.showNews(
                interaction,
                category,
                0
            );

            return;
        }

        // ==============================
        // HABER SAYFALAMA
        // ==============================

        if (id.startsWith("haber_prev_")) {
            const parts = id.split("_");

            const category = parts[2];
            const page = Number(parts[3]);

            await haber.showNews(
                interaction,
                category,
                page - 1
            );

            return;
        }

        if (id.startsWith("haber_next_")) {
            const parts = id.split("_");

            const category = parts[2];
            const page = Number(parts[3]);

            await haber.showNews(
                interaction,
                category,
                page + 1
            );

            return;
        }

        // ==============================
        // HABER YENİLE
        // ==============================

        if (id.startsWith("haber_refresh_")) {
            const parts = id.split("_");

            const category = parts[2];
            const page = Number(parts[3]);

            await haber.showNews(
                interaction,
                category,
                page
            );

            return;
        }

    } catch (error) {
        console.error(
            "❌ Buton hatası:",
            error
        );

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ İşlem sırasında bir hata oluştu.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});
const emojiler = require("./commands/emojiler.js");

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    try {
        if (interaction.customId.startsWith("emojiler_prev_")) {
            const page = Number(
                interaction.customId.split("_")[2]
            );

            const emojis = [...interaction.guild.emojis.cache.values()]
                .sort((a, b) => a.name.localeCompare(b.name));

            const totalPages = Math.max(
                1,
                Math.ceil(emojis.length / 20)
            );

            const newPage = Math.max(0, page - 1);

            await interaction.update({
                embeds: [
                    emojiler.createEmbed(
                        interaction.guild,
                        emojis,
                        newPage
                    )
                ],
                components: totalPages > 1
                    ? [emojiler.createButtons(newPage, totalPages)]
                    : []
            });

            return;
        }

        if (interaction.customId.startsWith("emojiler_next_")) {
            const page = Number(
                interaction.customId.split("_")[2]
            );

            const emojis = [...interaction.guild.emojis.cache.values()]
                .sort((a, b) => a.name.localeCompare(b.name));

            const totalPages = Math.max(
                1,
                Math.ceil(emojis.length / 20)
            );

            const newPage = Math.min(
                totalPages - 1,
                page + 1
            );

            await interaction.update({
                embeds: [
                    emojiler.createEmbed(
                        interaction.guild,
                        emojis,
                        newPage
                    )
                ],
                components: totalPages > 1
                    ? [emojiler.createButtons(newPage, totalPages)]
                    : []
            });

            return;
        }

    } catch (error) {
        console.error("❌ Emoji buton hatası:", error);
    }
});
// =====================================================
// ⚡ SLASH KOMUTLARI
// =====================================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command =
        client.commands.get(interaction.commandName);

    if (!command || !command.data) return;

    try {


const fakeMessage = {
    author: interaction.user,
    guild: interaction.guild,
    channel: interaction.channel,

    reply: async data => {
        await interaction.reply(data);
        return await interaction.fetchReply();
    }
};



        await command.execute(
            fakeMessage,
            [],
            client
        );

    } catch (error) {

        console.error(
            "❌ Slash komut hatası:",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            await interaction.followUp({
                content:
                    "❌ Komut çalıştırılırken bir hata oluştu.",
                ephemeral: true
            }).catch(() => {});

        } else {

            await interaction.reply({
                content:
                    "❌ Komut çalıştırılırken bir hata oluştu.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});


// =====================================================
// 📨 DAVET TAKİP
// =====================================================

try {
    const inviteEvent = require("./events/davet.js");
    inviteEvent(client);
    console.log("📨 Davet takip sistemi yüklendi!");
} catch (error) {
    console.error("❌ Davet sistemi yüklenemedi:");
    console.error(error);
}
// =====================================================
// 🎭 BUTON ROL PANELİ
// =====================================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isStringSelectMenu()) return;

    if (!interaction.customId.startsWith("rolpanel_")) {
        return;
    }

    try {
        const parts = interaction.customId.split("_");

        const guildId = parts[1];
        const channelId = parts[2];

        // Panelin doğru sunucuda olup olmadığını kontrol et
        if (interaction.guildId !== guildId) {
            return interaction.reply({
                content: "❌ Bu rol paneli bu sunucuya ait değil.",
                ephemeral: true
            });
        }

        const guild = interaction.guild;
        const member = interaction.member;
        const botMember = guild.members.me;

        if (!botMember) {
            return interaction.reply({
                content: "❌ Bot üyesi bulunamadı.",
                ephemeral: true
            });
        }

        const addedRoles = [];
        const removedRoles = [];
        const failedRoles = [];

        // =====================================================
        // ROLLERİ VER / ÇIKAR
        // =====================================================

        for (const roleId of interaction.values) {

            const role = guild.roles.cache.get(roleId);

            if (!role) {
                failedRoles.push("Bilinmeyen rol");
                continue;
            }

            // Bot bu rolü yönetebilir mi?
            if (
                role.managed ||
                role.position >= botMember.roles.highest.position
            ) {
                failedRoles.push(role.name);
                continue;
            }

            try {

                if (member.roles.cache.has(role.id)) {

                    // Rol varsa çıkar
                    await member.roles.remove(
                        role,
                        "Rol seçim paneli"
                    );

                    removedRoles.push(role);

                } else {

                    // Rol yoksa ver
                    await member.roles.add(
                        role,
                        "Rol seçim paneli"
                    );

                    addedRoles.push(role);
                }

            } catch (error) {

                console.error(
                    `❌ ${role.name} rolünde hata:`,
                    error
                );

                failedRoles.push(role.name);
            }
        }

        // =====================================================
        // 📊 PANELDEKİ ROL SAYILARINI GÜNCELLE
        // =====================================================

        const embed = interaction.message.embeds[0];

        if (embed) {

            const oldDescription = embed.description || "";

            // Mevcut rollerin ID'lerini select menu'den al
            const menu = interaction.message.components
                .flatMap(row => row.components)
                .find(component =>
                    component.type === 3 &&
                    component.customId?.startsWith("rolpanel_")
                );

            let panelRoles = [];

            if (menu && menu.options) {
                panelRoles = menu.options.map(option => option.value);
            }

            // Rol listesini yeniden oluştur
            if (panelRoles.length) {

                const roleLines = panelRoles
                    .map(roleId => {

                        const role =
                            guild.roles.cache.get(roleId);

                        if (!role) return null;

                        const count = role.members.size;

                        // Eski embedden emoji bulmaya çalış
                        let emoji = "";

                        const oldLine = oldDescription
                            .split("\n")
                            .find(line =>
                                line.includes(`<@&${role.id}>`)
                            );

                        if (oldLine) {

                            const match =
                                oldLine.match(
                                    /^(.+?)\s*<@&/
                                );

                            if (match) {
                                emoji = match[1].trim();
                            }
                        }

                        return `${emoji} ${role} — **${count} kişi**`;
                    })
                    .filter(Boolean)
                    .join("\n");

                // Açıklamadaki eski rol listesini güncelle
                const roleSectionStart =
                    oldDescription.indexOf("**Mevcut Roller:**");

                const roleSectionEnd =
                    oldDescription.indexOf(
                        "\n\n➕",
                        roleSectionStart
                    );

                let newDescription;

                if (
                    roleSectionStart !== -1 &&
                    roleSectionEnd !== -1
                ) {

                    const before =
                        oldDescription.slice(
                            0,
                            roleSectionStart
                        );

                    const after =
                        oldDescription.slice(
                            roleSectionEnd
                        );

                    newDescription =
                        before +
                        "**Mevcut Roller:**\n" +
                        roleLines +
                        after;

                } else {

                    newDescription = oldDescription;
                }

                // Embed'i güncelle
                const updatedEmbed =
                    EmbedBuilder.from(embed)
                        .setDescription(newDescription);

                await interaction.message.edit({
                    embeds: [updatedEmbed]
                });
            }
        }

        // =====================================================
        // 📋 KULLANICIYA SONUÇ
        // =====================================================

        let description = "";

        if (addedRoles.length) {

            description +=
                "➕ **Alınan Roller:**\n" +
                addedRoles
                    .map(role => `• ${role}`)
                    .join("\n") +
                "\n\n";
        }

        if (removedRoles.length) {

            description +=
                "➖ **Çıkarılan Roller:**\n" +
                removedRoles
                    .map(role => `• ${role}`)
                    .join("\n") +
                "\n\n";
        }

        if (failedRoles.length) {

            description +=
                "⚠️ **İşlem yapılamayan roller:**\n" +
                failedRoles
                    .map(role => `• ${role}`)
                    .join("\n") +
                "\n\n";
        }

        if (!description) {

            description =
                "❌ Herhangi bir rol değişikliği yapılamadı.";
        }

        // =====================================================
        // 📊 SAYILAR GÜNCELLENDİ MESAJI
        // =====================================================

        description +=
            "📊 Rol kullanım sayıları güncellendi.";

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#000000")
                    .setTitle("🎭 Rol İşlemi")
                    .setDescription(description)
            ],
            ephemeral: true
        });

    } catch (error) {

        console.error(
            "❌ Emoji rol paneli hatası:",
            error
        );

        if (
            !interaction.replied &&
            !interaction.deferred
        ) {
            await interaction.reply({
                content:
                    "❌ Rol işlemi sırasında bir hata oluştu.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});
// =====================================================
// ⚠️ HATALAR
// =====================================================

client.on("error", error => {
    console.error(
        "❌ Discord Client Hatası:",
        error
    );
});

process.on("unhandledRejection", error => {
    console.error(
        "❌ Yakalanmamış Promise:",
        error
    );
});

process.on("uncaughtException", error => {
    console.error(
        "❌ Yakalanmamış Exception:",
        error
    );
});
const startLevelSystem = require("./events/levelSystem");
startLevelSystem(client);

// =====================================================
// 🔑 GİRİŞ
// =====================================================

client.login(config.token)
    .then(() => {
        console.log("🔑 Discord'a bağlanılıyor...");
    })
    .catch(error => {
        console.error(
            "❌ Discord'a giriş yapılamadı:",
            error
        );
    });