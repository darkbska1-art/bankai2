const Database = require("better-sqlite3");

const db = new Database("./database/bankai.sqlite");

// Tabloyu oluştur
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,

        streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        last_streak_date TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`).run();


// Kullanıcı yoksa oluştur
function createUser(userId) {
    db.prepare(`
        INSERT OR IGNORE INTO users (user_id)
        VALUES (?)
    `).run(userId);
}


// Kullanıcının bilgilerini getir
function getUser(userId) {
    createUser(userId);

    return db.prepare(`
        SELECT *
        FROM users
        WHERE user_id = ?
    `).get(userId);
}


// Seri bilgilerini güncelle
function updateStreak(userId, streak, bestStreak, date) {
    createUser(userId);

    db.prepare(`
        UPDATE users
        SET
            streak = ?,
            best_streak = ?,
            last_streak_date = ?
        WHERE user_id = ?
    `).run(
        streak,
        bestStreak,
        date,
        userId
    );
}


// Global seri sıralaması
function getStreakLeaderboard(limit = 10) {
    return db.prepare(`
        SELECT *
        FROM users
        WHERE best_streak > 0
        ORDER BY best_streak DESC
        LIMIT ?
    `).all(limit);
}


module.exports = {
    db,
    createUser,
    getUser,
    updateStreak,
    getStreakLeaderboard
};