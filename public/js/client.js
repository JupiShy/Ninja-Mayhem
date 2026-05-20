const socket = io();

let currentRoom = null;
let myId = null;
let playedCardTimeout = null;
let playedCardHideTimeout = null;

const urlParams = new URLSearchParams(window.location.search);
const selectedDeck = urlParams.get('deck');

if (!selectedDeck) {
    window.location.href = '/';
}

const userData = {
    login: document.getElementById('player-name').innerText,
    avatar: document.getElementById('player-avatar').src.split('/').pop(),
    deckType: selectedDeck
};

socket.emit('joinGame', userData);

socket.on('waiting', (msg) => {
    updateLog(msg);
});

socket.on('gameStart', (data) => {
    console.log("Data:", data);
    currentRoom = data.room;
    myId = data.yourId;

    updateLog("Fight!");

    if (meditationBtn) {
        meditationBtn.style.display = 'inline-block';
    }

    document.getElementById('opp-name').innerText = data.opponent.login;
    document.getElementById('opp-avatar').src = `/assets/avatars/${data.opponent.avatar}`;
    updateUI(data);
});

socket.on('timerUpdate', (data) => {
    const isMyTurn = data.turn === socket.id;
    if (isMyTurn) {
        document.getElementById('player-timer').innerText = `${data.timeLeft}s`;
        document.getElementById('opp-timer').innerText = '30s';
    } else {
        document.getElementById('opp-timer').innerText = `${data.timeLeft}s`;
        document.getElementById('player-timer').innerText = '30s';
    }
});

socket.on('updateState', (data) => {
    updateUI(data);

    if (data.gameOver) {
        document.getElementById('winner-name').innerText = data.winner;
        document.getElementById('victory-modal').style.display = 'flex';

        document.getElementById('return-lobby-btn').onclick = () => {
            window.location.href = '/';
        };
    }
});

const meditationBtn = document.getElementById('meditation-btn');

if (meditationBtn) {
    meditationBtn.onclick = () => {
        const playerZone = document.getElementById('player-zone');
        if (playerZone.classList.contains('active-turn')) {
            socket.emit('passTurn', { roomName: currentRoom });
        } else {
            updateLog("Wait for your turn!");
        }
    }
}

function updateUI(data) {
    const myHpEl = document.getElementById('player-hp');
    const oppHpEl = document.getElementById('opp-hp');
    const myStatsEl = myHpEl.closest('.avatar-container');
    const oppStatsEl = oppHpEl.closest('.avatar-container');

    const triggerHpDropAnimation = (hpEl, statsEl, nextHp) => {
        const previousHp = Number(hpEl.dataset.hp);

        hpEl.dataset.hp = String(nextHp);

        if (Number.isFinite(previousHp) && nextHp < previousHp) {
            statsEl.classList.remove('hp-hit');
            hpEl.classList.remove('hp-pop');

            void statsEl.offsetWidth;

            statsEl.classList.add('hp-hit');
            hpEl.classList.add('hp-pop');

            window.clearTimeout(hpEl._hpPopTimeout);
            hpEl._hpPopTimeout = window.setTimeout(() => {
                statsEl.classList.remove('hp-hit');
                hpEl.classList.remove('hp-pop');
            }, 420);
        }
    };

    triggerHpDropAnimation(myHpEl, myStatsEl, data.myHp);
    triggerHpDropAnimation(oppHpEl, oppStatsEl, data.oppHp);

    myHpEl.innerText = data.myHp;
    oppHpEl.innerText = data.oppHp;

    myHpEl.classList.toggle('low', data.myHp <= 5);
    oppHpEl.classList.toggle('low', data.oppHp <= 5);

    if (data.myChakra !== undefined) {
        document.getElementById('player-chakra').innerText = data.myChakra;
    }

    if (data.oppChakra !== undefined) {
        document.getElementById('opp-chakra').innerText = data.oppChakra;
    }

    const isMyTurn = data.turn === socket.id;

    if (meditationBtn) {
        meditationBtn.disabled = !isMyTurn;
        meditationBtn.classList.toggle('disabled-btn', !isMyTurn);
    }

    //updateLog(isMyTurn ? "YOUR TURN!" : "OPPONENT'S TURN...");
    document.getElementById('player-zone').classList.toggle('active-turn', isMyTurn);
    document.getElementById('opponent-zone').classList.toggle('active-turn', !isMyTurn);

    if (data.hand) {
        renderHand(data.hand);
    }
    renderTable('player-table', data.myTable || []);
    renderTable('opp-table', data.oppTable || []);

    const oppHandCount = data.oppHandSize !== undefined ? data.oppHandSize : (data.opponent ? data.opponent.handSize : 0);
    renderOpponentHand(oppHandCount);

    if (data.lastPlayedCard) {
        showPlayedCard(data.lastPlayedCard);
    }
}

function showPlayedCard(card) {
    const activeZone = document.getElementById('active-card-zone');
    const dimLayer = document.getElementById('played-card-dim');
    if (!activeZone) return;
    document.body.classList.add('showing-played-card');
    if (dimLayer) {
        dimLayer.hidden = false;
    }

    if (playedCardTimeout) {
        clearTimeout(playedCardTimeout);
        playedCardTimeout = null;
    }

    if (playedCardHideTimeout) {
        clearTimeout(playedCardHideTimeout);
        playedCardHideTimeout = null;
    }

    activeZone.innerHTML = '';

    const cardDiv = createCardElement(card, false);
    cardDiv.classList.add('played-card');
    activeZone.appendChild(cardDiv);

    requestAnimationFrame(() => {
        cardDiv.classList.add('is-visible');
    });

    playedCardTimeout = setTimeout(() => {
        cardDiv.classList.remove('is-visible');

        playedCardHideTimeout = setTimeout(() => {
            if (activeZone.contains(cardDiv)) {
                activeZone.innerHTML = '';
            }
            document.body.classList.remove('showing-played-card');
            if (dimLayer) {
                dimLayer.hidden = true;
            }
            playedCardTimeout = null;
            playedCardHideTimeout = null;
        }, 260);
    }, 1740);
}

function renderHand(hand) {
    const handContainer = document.getElementById('player-hand');
    const currentCardsMap = {};
    Array.from(handContainer.children).forEach(child => {
        const id = child.getAttribute('data-instance-id');
        if (id) currentCardsMap[id] = child;
    });

    const newChildren = [];

    hand.forEach(card => {
        let cardDiv = currentCardsMap[card.instanceId];

        if (!cardDiv) {
            cardDiv = createCardElement(card, true);
            cardDiv.onclick = () => {
                if (document.getElementById('player-zone').classList.contains('active-turn')) {
                    socket.emit('playCard', { roomName: currentRoom, cardInstanceId: card.instanceId });
                } else {
                    updateLog("Wait for your turn!");
                }
            };
        } else {
            delete currentCardsMap[card.instanceId];
        }
        newChildren.push(cardDiv);
    });

    Object.values(currentCardsMap).forEach(child => {
        child.remove();
    });

    newChildren.forEach((child, index) => {
        if (handContainer.children[index] !== child) {
            handContainer.insertBefore(child, handContainer.children[index] || null);
        }
    });
}

function renderTable(containerId, cards) {
    const container = document.getElementById(containerId);

    const currentCardsMap = {};
    Array.from(container.children).forEach(child => {
        const id = child.getAttribute('data-instance-id');
        if (id) currentCardsMap[id] = child;
    });

    const newChildren = [];

    cards.forEach(card => {
        let cardDiv = currentCardsMap[card.instanceId];

        if (!cardDiv) {
            cardDiv = createCardElement(card, false);
        } else {
            delete currentCardsMap[card.instanceId];
        }

        let shieldMarker = cardDiv.querySelector('.shield-marker');
        if (card.currentDefense !== undefined) {
            if (!shieldMarker) {
                shieldMarker = document.createElement('div');
                shieldMarker.className = 'shield-marker';
                cardDiv.appendChild(shieldMarker);
            }
            shieldMarker.innerText = card.currentDefense;
        } else if (shieldMarker) {
            shieldMarker.remove();
        }

        newChildren.push(cardDiv);
    });

    Object.values(currentCardsMap).forEach(child => child.remove());
    newChildren.forEach((child, index) => {
        if (container.children[index] !== child) {
            container.insertBefore(child, container.children[index] || null);
        }
    });
}

function renderOpponentHand(size) {
    const container = document.getElementById('opp-hand');
    if (container.children.length === size) return;

    container.innerHTML = '';
    for (let i = 0; i < size; i++) {
        const cardBack = document.createElement('div');
        cardBack.className = 'card back';
        const rotation = (i - (size - 1) / 2) * 10;
        cardBack.style.transform = `rotate(${rotation}deg) translateX(${i * 10}px)`;
        container.appendChild(cardBack);
    }
}

function createCardElement(card, isInteractive) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';

    if (card.instanceId) {
        cardDiv.setAttribute('data-instance-id', card.instanceId);
    }

    if (card.image) {
        cardDiv.style.backgroundImage = `url('/assets/cards/${card.image}')`;
    }

    let effectsHtml = '';

    if (card.attack) effectsHtml += `<span>⚔️${card.attack}</span>`;
    if (card.defense) effectsHtml += `<span>🛡️${card.defense}</span>`;
    if (card.heal) effectsHtml += `<span>❤️${card.heal}</span>`;
    if (card.play_extra) effectsHtml += `<span>⚡${card.play_extra}</span>`;
    if (card.draw_cards) effectsHtml += `<span>🎴${card.draw_cards}</span>`;

    if (card.fireball) effectsHtml += `<span title="Fireball">🔥</span>`;
    if (card.genjutsu) effectsHtml += `<span title="Genjutsu">👁️</span>`;
    if (card.swap_hp) effectsHtml += `<span title="Health Swap">🔄</span>`;
    if (card.discard_all) effectsHtml += `<span title="Discard All">🌪️</span>`;
    if (card.sun_rising) effectsHtml += `<span title="Sun Rising">🌅</span>`;
    if (card.green_eye) effectsHtml += `<span title="Green Eye (Immunity)">🟢</span>`;
    if (card.steal_card) effectsHtml += `<span title="Steal Card">🧤</span>`;

    if (card.destroy_shield === 'any') effectsHtml += `<span title="Destroy 1 Shield">🔨</span>`;
    if (card.destroy_shield === 'all') effectsHtml += `<span title="Destroy All Shields">💥</span>`;

    cardDiv.innerHTML = `
    <div class="card-overlay">
        <div class="card-top">
            ${card.cost !== undefined ? `<div class="chakra-cost">💠${card.cost}</div>` : ''}
        </div>

        <div class="card-bottom">
            <div class="card-name" title="${card.name}">
                ${card.name}
            </div>
            <div class="card-stats">${effectsHtml}</div>
        </div>
    </div>
`;

    return cardDiv;
}

function updateLog(text) {
    const log = document.getElementById('battle-log');
    const p = document.createElement('p');
    p.innerText = `> ${text}`;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;

    if (log.children.length > 10) {
        log.removeChild(log.firstChild);
    }
    if (typeof resizeBattleStageToLog === 'function') {
        resizeBattleStageToLog();
    }
}

socket.on('updateLog', (msg) => {
    updateLog(msg);
});

function debounce(fn, wait) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

function resizeBattleStageToLog() {
    const log = document.getElementById('battle-log');
    const stage = document.querySelector('.battle-stage');
    if (!log || !stage) return;

    const rect = log.getBoundingClientRect();
    const newWidth = Math.max(120, Math.round(rect.width * 1.1));
    const newHeight = Math.max(80, Math.round(rect.height * 1.1));

    stage.style.width = `${newWidth}px`;
    stage.style.height = `${newHeight}px`;
}

const debouncedResize = debounce(resizeBattleStageToLog, 120);

window.addEventListener('load', () => {
    resizeBattleStageToLog();
    window.addEventListener('resize', debouncedResize);

    const logEl = document.getElementById('battle-log');
    if (logEl && window.MutationObserver) {
        const mo = new MutationObserver(debouncedResize);
        mo.observe(logEl, { childList: true, subtree: true });
    }
});