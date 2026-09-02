const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "kader",
    aliases: ["gelecek", "fortune"],

    async execute(message) {

        const kaderler = [
            "🔮 Bugün şans senden yana olacak.",
            "🍀 Bugün hiç beklemediğin bir anda şanslı olacaksın.",
            "😂 Bugün başına komik bir olay gelecek.",
            "💰 Para konusunda bugün dikkatli ol.",
            "🎮 Bugün oyunlarda şansın açık.",
            "📱 Telefonunu elinden bırakamayacağın bir gün.",
            "😴 Bugün biraz dinlenmeye ihtiyacın var.",
            "🗿 Bugün hiçbir şey anlamadan günü tamamlayacaksın.",
            "🚨 Bugün bir şeyleri yanlış anlama ihtimalin yüksek.",
            "👀 Birinin senden sakladığı bir şey ortaya çıkacak.",
            "🎁 Bugün güzel bir sürprizle karşılaşabilirsin.",
            "🧠 Bugün beklenmedik bir fikir aklına gelecek.",
            "🌧️ Planların son anda değişebilir.",
            "🔥 Bugün enerjin fazlasıyla yüksek olacak.",
            "💀 Bugün 'ben bunu neden yaptım?' diyeceğin bir an yaşayacaksın.",
            "🐸 Bugün kaderin seni anlamsız bir olaya sürükleyecek.",
            "🛌 Bugün yataktan çıkmamak en mantıklı karar olabilir.",
            "📚 Bugün öğrenmek istemediğin bir şeyi öğreneceksin.",
            "🎯 Bugün verdiğin bir karar beklediğinden daha önemli olacak.",
            "🤡 Bugün kendini küçük düşürmeden günü tamamlayabilirsen başarılısın."
        ];

        const kader =
            kaderler[
                Math.floor(Math.random() * kaderler.length)
            ];

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("🔮 Kader")
            .setDescription(
                `${message.author}, kaderin bugün şöyle diyor:\n\n` +
                `## ${kader}`
            )
            .setThumbnail(
                message.author.displayAvatarURL({
                    size: 256
                })
            )
            .setFooter({
                text: `${message.guild.name} • Kader Sistemi`
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};