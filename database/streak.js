const {
    getUser,
    updateStreak
} = require("./database");


// Türkiye tarihini al
function getTodayTR() {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const data = {};

    for (const part of parts) {
        if (part.type !== "literal") {
            data[part.type] = part.value;
        }
    }

    return `${data.year}-${data.month}-${data.day}`;
}


// İki tarih arasındaki gün farkı
function getDayDifference(date1, date2) {
    const [y1, m1, d1] = date1.split("-").map(Number);
    const [y2, m2, d2] = date2.split("-").map(Number);

    const first = Date.UTC(y1, m1 - 1, d1);
    const second = Date.UTC(y2, m2 - 1, d2);

    return Math.round(
        (second - first) / 86400000
    );
}


// Kullanıcının serisini güncelle
function updateUserStreak(userId) {
    const today = getTodayTR();
    const user = getUser(userId);

    // Kullanıcı bugün zaten kullandıysa
    if (user.last_streak_date === today) {
        return {
            streak: user.streak,
            bestStreak: user.best_streak,
            increased: false,
            alreadyUsedToday: true
        };
    }


    // İlk kullanım
    if (!user.last_streak_date) {
        const streak = 1;

        updateStreak(
            userId,
            streak,
            Math.max(user.best_streak, streak),
            today
        );

        return {
            streak,
            bestStreak: Math.max(user.best_streak, streak),
            increased: true,
            alreadyUsedToday: false
        };
    }


    const difference = getDayDifference(
        user.last_streak_date,
        today
    );


    // Ertesi gün kullanmış
    if (difference === 1) {
        const streak = user.streak + 1;
        const bestStreak = Math.max(
            user.best_streak,
            streak
        );

        updateStreak(
            userId,
            streak,
            bestStreak,
            today
        );

        return {
            streak,
            bestStreak,
            increased: true,
            alreadyUsedToday: false
        };
    }


    // Bir veya daha fazla gün kaçırmış
    const streak = 1;
    const bestStreak = Math.max(
        user.best_streak,
        streak
    );

    updateStreak(
        userId,
        streak,
        bestStreak,
        today
    );

    return {
        streak,
        bestStreak,
        increased: true,
        alreadyUsedToday: false,
        reset: true
    };
}


module.exports = {
    getTodayTR,
    updateUserStreak
};