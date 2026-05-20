const db = require('../db');
const bcrypt = require('bcrypt');
const User = require('../models/user');

const authController = {
    register: async (req, res) => {
        const { login, password } = req.body;

        try {
            const [existingUser] = await db.execute('SELECT * FROM users WHERE login = ?', [login]);
            if (existingUser.length > 0) {
                return res.redirect('/register?error=' + encodeURIComponent('This login is already taken. Try another!'));
            }

            if (!password || password.length < 4) {
                return res.redirect('/register?error=' + encodeURIComponent('Password must be at least 4 characters!'));
            }

            const hashPass = await bcrypt.hash(password, 10);

            const avatar = req.file ? req.file.filename : 'default_user.png';

            const [result] = await db.execute(
                'INSERT INTO users (login, nickname, password, avatar) VALUES (?, ?, ?, ?)',
                [login, login, hashPass, avatar]
            );

            req.session.userId = result.insertId;
            req.session.user = {
                id: result.insertId,
                login,
                nickname: login,
                avatar
            };

            req.session.save(() => {
                res.redirect('/');
            });
        } catch (error) {
            console.error(error);
            res.redirect('/register?error=' + encodeURIComponent('Error during registration. Please try again!'));
        }
    },

    login: async (req, res) => {
        const { login, password } = req.body;

        try {
            const [users] = await db.execute('SELECT * FROM users WHERE login = ?', [login]);
            const user = users[0];

            if (!user) {
                return res.redirect('/login?error=' + encodeURIComponent('Ninja not found! Join the battle first.'));
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.redirect('/login?error=' + encodeURIComponent('Wrong chakra key! Try again.'));
            }

            req.session.userId = user.id;
            req.session.user = {
                id: user.id,
                login: user.login,
                nickname: user.nickname,
                avatar: user.avatar
            };
            res.redirect('/');
        } catch (error) {
            console.error(error);
            res.redirect('/login?error=' + encodeURIComponent('Login failed. Please try again!'));
        }
    },

    logout: (req, res) => {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    },

    updateNickname: async (req, res) => {
        const { nickname } = req.body;
        const userId = req.session.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!nickname) return res.status(400).json({ error: 'Nickname is required' });

        try {
            await User.updateNickname(userId, nickname);
            req.session.user.nickname = nickname;
            res.json({ success: true, nickname });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update nickname' });
        }
    },

    updateAvatar: async (req, res) => {
        const userId = req.session.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!req.file) return res.status(400).json({ error: 'No avatar file uploaded' });

        try {
            const avatarFilename = req.file.filename;
            await User.updateAvatar(userId, avatarFilename);
            req.session.user.avatar = avatarFilename;
            res.json({ success: true, avatar: avatarFilename });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update avatar' });
        }
    }
};

module.exports = authController;