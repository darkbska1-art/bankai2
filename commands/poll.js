
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const activePolls = new Map();

function parseDuration(text) {
    if (!text) return null;

    const match = text.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    return amount * multipliers[unit];
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);

    if (seconds < 60) {
        return `${seconds} saniye`;
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} dakika`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} saat`;
    }

    return `${Math.floor(hours / 24)} gün`;
}

function createPollEmbed(poll, ended = false) {
    const totalVotes = poll.votes.length;

    let description = `> **${poll.question}**\n\n`;

    poll.options.forEach((option, index) => {
        const votes = poll.votes.filter(
            vote => vote.option === index
        ).length;

        const percentage =
            totalVotes === 0
                ? 0
                : Math.round((votes / totalVotes) * 100);

        description +=
            `**${index + 1}. ${option}**\n` +
            `> 🗳️ **${votes} oy** • **%${percentage}**\n\n`;
    });

    const embed = new EmbedBuilder()
        .setColor(ended ? 0xED4245 : 0x5865F2)
        .setTitle(ended ? "📊 Anket Sonuçlandı" : "📊 Anket")
        .setDescription(description)
        .addFields(
            {
                name: "👥 Toplam Oy",
                value: `**${totalVotes}**`,
                inline: true
            },
            {
                name: "👤 Oluşturan",
                value: `<@${poll.creatorId}>`,
                inline: true
            }
        )
        .setTimestamp();

    if (!ended) {
        const remaining = poll.endsAt - Date.now();

        embed.addFields({
            name: "⏱️ Kalan Süre",
            value:
                remaining > 0
                    ? `**${formatDuration(remaining)}**`
                    : "**Bitiyor...**",
            inline: true
        });
    }

    if (ended) {
        const highest = Math.max(
            ...poll.options.map((_, index) =>
                poll.votes.filter(
                    vote => vote.option === index
                ).length
            )
        );

        if (highest > 0) {
            const winners = poll.options
                .map((option, index) => ({
                    option,
                    index,
                    votes: poll.votes.filter(
                        vote => vote.option === index
                    ).length
                }))
                .filter(item => item.votes === highest);

            embed.addFields({
                name: "🏆 Kazanan",
                value: winners
                    .map(
                        winner =>
                            `**${winner.option}** — ${winner.votes} oy`
                    )
                    .join("\n"),
                inline: false
            });
        } else {
            embed.addFields({
                name: "🏆 Kazanan",
                value: "Henüz oy kullanılmadı.",
                inline: false
            });
        }
    }

    embed.setFooter({
        text: "DRAYS • Poll System"
    });

    return embed;
}

function createButtons(poll, disabled = false) {
    const rows = [];

    let row = new ActionRowBuilder();

    poll.options.forEach((option, index) => {
        const votes = poll.votes.filter(
            vote => vote.option === index
        ).length;

        const button = new ButtonBuilder()
            .setCustomId(`poll_vote_${poll.id}_${index}`)
            .setLabel(`${index + 1}. ${option} (${votes})`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled);

        row.addComponents(button);

        if (row.components.length === 5) {
            rows.push(row);
            row = new ActionRowBuilder();
        }
    });

    if (row.components.length > 0) {
        rows.push(row);
    }

    if (!disabled) {
        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`poll_end_${poll.id}`)
                .setLabel("Anketi Bitir")
                .setEmoji("🛑")
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId(`poll_info_${poll.id}`)
                .setLabel("Bilgi")
                .setEmoji("ℹ️")
                .setStyle(ButtonStyle.Secondary)
        );

        rows.push(controlRow);
    }

    return rows;
}

async function finishPoll(poll, message) {
    if (!poll || poll.ended) return;

    poll.ended = true;
    activePolls.delete(poll.id);

    await message.edit({
        embeds: [createPollEmbed(poll, true)],
        components: createButtons(poll, true)
    }).catch(() => {});
}

module.exports = {
    name: "poll",
    aliases: ["anket"],
    description: "Gelişmiş anket oluşturur.",

    async execute(message, args) {

        if (!message.guild) {
            return message.reply(
                "❌ Bu komut sadece sunucularda kullanılabilir."
            );
        }

        if (!args.length) {
            return message.reply(
                "❌ Kullanım:\n" +
                "`B!poll Soru | Seçenek 1 | Seçenek 2`\n\n" +
                "Süreli örnek:\n" +
                "`B!poll 10m En sevdiğin renk? | Kırmızı | Mavi | Yeşil`"
            );
        }

        let duration = 24 * 60 * 60 * 1000;

        const possibleDuration = parseDuration(args[0]);

        if (possibleDuration) {
            duration = possibleDuration;
            args.shift();
        }

        const text = args.join(" ");

        const parts = text
            .split("|")
            .map(x => x.trim())
            .filter(Boolean);

        if (parts.length < 3) {
            return message.reply(
                "❌ Bir soru ve en az **2 seçenek** yazmalısın.\n\n" +
                "Örnek:\n" +
                "`B!poll En sevdiğin oyun? | Minecraft | Roblox | Valorant`"
            );
        }

        const question = parts[0];
        const options = parts.slice(1);

        if (options.length > 10) {
            return message.reply(
                "❌ Bir ankette en fazla **10 seçenek** olabilir."
            );
        }

        if (question.length > 256) {
            return message.reply(
                "❌ Anket sorusu en fazla **256 karakter** olabilir."
            );
        }

        for (const option of options) {
            if (option.length > 80) {
                return message.reply(
                    "❌ Seçenekler en fazla **80 karakter** olabilir."
                );
            }
        }

        const id = `${message.id}_${Date.now()}`;

        const poll = {
            id,
            creatorId: message.author.id,
            question,
            options,
            votes: [],
            createdAt: Date.now(),
            endsAt: Date.now() + duration,
            ended: false
        };

        const pollMessage = await message.channel.send({
            embeds: [createPollEmbed(poll)],
            components: createButtons(poll)
        });

        poll.messageId = pollMessage.id;
        poll.channelId = message.channel.id;

        activePolls.set(id, poll);

        setTimeout(async () => {
            if (!activePolls.has(id)) return;

            const currentPoll = activePolls.get(id);

            await finishPoll(currentPoll, pollMessage);
        }, duration);

        await message.delete().catch(() => {});
    },

    activePolls,

    createPollEmbed,
    createButtons,
    finishPoll
};

