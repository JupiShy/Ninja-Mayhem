const Card = require('../models/card');
const User = require('../models/user');

exports.renderLobby = async (req, res) => {
    try {
        const userData = await User.findById(req.session.userId);
        res.render('lobby', {
            user: userData || req.session.user
        });
    } catch (error) {
        console.error("Lobby Error:", error);
        res.status(500).send("Error loading lobby");
    }
};

exports.renderGame = (req, res) => {
    const selectedDeck = req.query.deck;

    if (!selectedDeck) {
        return res.redirect('/');
    }

    res.render('index', {
        user: req.session.user,
        deck: selectedDeck
    });
};