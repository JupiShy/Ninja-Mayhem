const db = require('../db');

class User {
    static async findById(id) {
        const [rows] = await db.execute('SELECT id, login, nickname, avatar, wins, losses FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async updateNickname(userId, newNickname) {
        await db.execute('UPDATE users SET nickname = ? WHERE id = ?', [newNickname, userId]);
    }

    static async updateAvatar(userId, newAvatar) {
        await db.execute('UPDATE users SET avatar = ? WHERE id = ?', [newAvatar, userId]);
    }

    static async updateStats(userId, isWinner) {
        if (isWinner === 'draw') return;
        const column = isWinner ? 'wins' : 'losses';
        const sql = `UPDATE users SET ${column} = ${column} + 1 WHERE id = ?`;
        await db.execute(sql, [userId]);
    }
}

module.exports = User;