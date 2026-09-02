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
    Collection
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const config = require("./config.js");


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

// =====================================================
// 🟢 BOT HAZIR
// =====================================================

client.once("clientReady", async () => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
        `✅ ${client.user.tag} olarak giriş yapıldı!`
    );
    console.log("🏦 Bankai aktif!");
    console.log(
        `🌐 ${client.guilds.cache.size} sunucuda bulunuyor.`
    );
    console.log(
        `📦 ${client.commands.size} komut/alias yüklendi.`
    );

   

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