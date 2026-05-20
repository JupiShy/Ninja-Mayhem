const express = require('express');
const router = express.Router();
const authController = require('./controllers/authController')
const gameController = require('./controllers/gameController');
const multer = require('multer');
const path = require('path');

const isAuth = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/login');
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/assets/avatars/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/', isAuth, gameController.renderLobby);
router.get('/game', isAuth, gameController.renderGame);
router.get('/card-demo', isAuth, (req, res) => res.render('card-demo'));

router.get('/login', (req, res) => res.render('login'));
router.post('/login', authController.login);

router.get('/register', (req, res) => res.render('register'));
router.post('/register', upload.single('avatar'), authController.register);
router.post('/update-nickname', isAuth, authController.updateNickname);
router.post('/update-avatar', isAuth, upload.single('avatar'), authController.updateAvatar);
router.get('/logout', authController.logout);

module.exports = router;