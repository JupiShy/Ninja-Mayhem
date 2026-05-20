const db = require('../db');

class Card {
    static async getByDeckType(deckType) {
        const [cards] = await db.execute('SELECT * FROM cards WHERE deck_type = ?', [deckType]);
        return cards;
    }

    static async createDeck(deckType) {
        const cardsFromDb = await this.getByDeckType(deckType);
        let fullDeck = [];

        cardsFromDb.forEach(card => {
            for (let i = 0; i < card.count_in_deck; i++) {
                fullDeck.push({
                    ...card,
                    instanceId: Math.random().toString(36).substr(2, 9)
                });
            }
        });
        return this.shuffle(fullDeck);
    }

    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

module.exports = Card;