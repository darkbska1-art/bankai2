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
    Routes
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


// 📖 Manga takip sistemi
try {
    const mangaTracker = require("./events/mangatakip.js");
    mangaTracker(client);

    console.log("📖 Manga takip sistemi yüklendi!");
} catch (error) {
    console.error("❌ Manga takip sistemi yüklenemedi:");
    console.error(error);
}




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