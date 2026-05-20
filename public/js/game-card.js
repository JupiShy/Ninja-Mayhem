class GameCard {
    constructor(cardElement) {
        this.element = cardElement;
        this.isFlipped = false;
        this.init();
    }

    init() {
        this.element.addEventListener('click', () => this.toggle());
        this.element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        this.element.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        this.isFlipped ? this.showFront() : this.showBack();
    }

    showFront() {
        this.element.classList.remove('flipped');
        this.isFlipped = false;
        this.triggerAnimation('frontFlip');
    }

    showBack() {
        this.element.classList.add('flipped');
        this.isFlipped = true;
        this.triggerAnimation('backFlip');
    }

    flipTo(toBack) {
        if (toBack) {
            this.showBack();
        } else {
            this.showFront();
        }
    }

    getState() {
        return this.isFlipped;
    }

    triggerAnimation(animationName) {
        const inner = this.element.querySelector('.game-card-inner');
        
        inner.classList.remove('flip-animation');
        void inner.offsetWidth;
        inner.classList.add('flip-animation');
    }

    reset() {
        this.showFront();
    }
}

function initializeGameCards() {
    const cardContainers = document.querySelectorAll('.game-card-container');
    const gameCards = [];

    cardContainers.forEach(container => {
        const card = new GameCard(container);
        gameCards.push(card);
    });

    return gameCards;
}

function getCardById(cardId) {
    const element = document.querySelector(`[data-card-id="${cardId}"]`);
    if (element) {
        return new GameCard(element);
    }
    return null;
}

function flipAllCards(toBack = true) {
    const cards = document.querySelectorAll('.game-card-container');
    cards.forEach(cardEl => {
        const card = new GameCard(cardEl);
        card.flipTo(toBack);
    });
}

function resetAllCards() {
    flipAllCards(false);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGameCards);
} else {
    initializeGameCards();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameCard, initializeGameCards, getCardById, flipAllCards, resetAllCards };
}