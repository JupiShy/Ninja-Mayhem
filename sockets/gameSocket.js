const Card = require('../models/card');
const User = require('../models/user');

module.exports = (io) => {
    let waitingPlayer = null;
    const rooms = {};

    function emitBattleLog(io, player, opponent, playerMsg, opponentMsg) {
        io.to(player.id).emit('updateLog', playerMsg);
        io.to(opponent.id).emit('updateLog', opponentMsg);
    }

    function dealDamage(target, amount) {
        let dmg = amount;
        let shieldDamage = 0;
        let shieldsDestroyed = 0;

        while (dmg > 0 && target.table.length > 0) {
            let shield = target.table[0];

            if (shield.currentDefense > dmg) {
                shield.currentDefense -= dmg;
                shieldDamage += dmg;
                dmg = 0;
            } else {
                dmg -= shield.currentDefense;
                shieldDamage += shield.currentDefense;
                shieldsDestroyed++;
                target.discard.push(target.table.shift());
            }
        }

        let hpDamage = 0;
        if (dmg > 0) {
            target.hp -= dmg;
            hpDamage = dmg;
        }

        return {
            initialDmg: amount,
            shieldDamage: shieldDamage,
            shieldsDestroyed: shieldsDestroyed,
            hpDamage: hpDamage
        };
    }

    function drawCards(player, count) {
        for (let i = 0; i < count; i++) {
            if (player.deck.length === 0) {
                if (player.discard.length === 0) break;
                player.deck = Card.shuffle([...player.discard]);
                player.discard = [];
            }
            player.hand.push(player.deck.shift());
        }
    }

    function executeCardEffects(card, player, opponent, io) {
        const isImune = opponent.greenEyeActive;

        if (card.play_extra > 0) {
            player.extraPlays += card.play_extra;
            emitBattleLog(io, player, opponent,
                `⚡ Gained +${card.play_extra} extra play!`,
                `⚡ ${player.login} gained +${card.play_extra} extra play!`
            );
        }

        if (card.attack > 0) {
            if (isImune) {
                emitBattleLog(io, player, opponent,
                    `🛡️ Opponent is immune! Attack blocked by Green Eye.`,
                    `🟢 Your Green Eye immunity completely blocked the attack!`
                );
            } else {
                const report = dealDamage(opponent, card.attack);

                let pMsg = `⚔️ Dealt ${report.initialDmg} damage.`;
                let oMsg = `⚔️ ${player.login} attacked you for ${report.initialDmg} damage.`;

                if (report.shieldDamage > 0) {
                    pMsg += ` (Shield absorbed ${report.shieldDamage}`;
                    oMsg += ` (Your shield absorbed ${report.shieldDamage}`;
                    if (report.shieldsDestroyed > 0) {
                        pMsg += `, destroyed ${report.shieldsDestroyed} shield(s)`;
                        oMsg += `, destroyed ${report.shieldsDestroyed} of your shield(s)`;
                    }
                    pMsg += `)`;
                    oMsg += `)`;
                }

                if (report.hpDamage > 0) {
                    pMsg += ` Hit enemy HP directly for ${report.hpDamage}!`;
                    oMsg += ` Hit your HP directly for ${report.hpDamage}!`;
                }

                emitBattleLog(io, player, opponent, pMsg, oMsg);
            }
        }

        if (card.heal > 0) {
            let oldHp = player.hp;
            player.hp = Math.min(10, player.hp + card.heal);
            let actualHeal = player.hp - oldHp;
            emitBattleLog(io, player, opponent,
                `❤️ Healed yourself for +${actualHeal} HP.`,
                `❤️ ${player.login} healed for +${actualHeal} HP.`
            );
        }

        if (card.draw_cards > 0) {
            drawCards(player, card.draw_cards);
            emitBattleLog(io, player, opponent,
                `🎴 Drew ${card.draw_cards} card(s).`,
                `🎴 ${player.login} drew ${card.draw_cards} card(s).`
            );
        }

        if (card.discard_all) {
            player.discard.push(...player.hand); player.hand = [];
            opponent.discard.push(...opponent.hand); opponent.hand = [];
            drawCards(player, 3);
            drawCards(opponent, 3);
            emitBattleLog(io, player, opponent,
                `🌪️ Discard All! Both hands cleared. You drew 3 new cards!`,
                `🌪️ Discard All! Both hands cleared. You drew 3 new cards!`
            );
        }

        if (card.destroy_shield === 'any') {
            if (isImune) {
                emitBattleLog(io, player, opponent, `Shield destruction blocked by enemy Green Eye!`, `Your Green Eye blocked shield destruction!`);
            } else if (opponent.table.length > 0) {
                const destroyed = opponent.table.shift();
                opponent.discard.push(destroyed);
                emitBattleLog(io, player, opponent,
                    `🔨 Destroyed 1 enemy shield: [${destroyed.name}].`,
                    `🔨 Your shield [${destroyed.name}] was forcefully destroyed!`
                );
            } else {
                emitBattleLog(io, player, opponent, `Tried to destroy a shield, but opponent has none.`, `${player.login} tried to destroy a shield, but you have none.`);
            }
        }

        if (card.destroy_shield === 'all') {
            player.discard.push(...player.table); player.table = [];
            let pMsg = `💥 Destroyed all of your own shields!`;
            let oMsg = `💥 ${player.login} destroyed all of their own shields!`;

            if (isImune) {
                pMsg += ` Enemy shields were protected by Green Eye.`;
                oMsg += ` Your shields were protected by Green Eye.`;
            } else if (opponent.table.length > 0) {
                opponent.discard.push(...opponent.table); opponent.table = [];
                pMsg += ` Also destroyed all enemy shields!`;
                oMsg += ` Also destroyed all of your shields!`;
            }
            emitBattleLog(io, player, opponent, pMsg, oMsg);
        }

        if (card.fireball) {
            const reportSelf = dealDamage(player, 3);
            emitBattleLog(io, player, opponent,
                `🔥 Fireball backfired! You took ${reportSelf.hpDamage} HP damage (Shield absorbed ${reportSelf.shieldDamage}).`,
                `🔥 ${player.login}'s Fireball hit themselves for ${reportSelf.hpDamage} HP damage.`
            );

            if (isImune) {
                emitBattleLog(io, player, opponent, `Fireball attack blocked by enemy Green Eye!`, `Your Green Eye blocked the Fireball attack!`);
            } else {
                const reportOpp = dealDamage(opponent, 3);
                emitBattleLog(io, player, opponent,
                    `🔥 Fireball blasted enemy for ${reportOpp.hpDamage} HP damage!`,
                    `🔥 Fireball blasted you for ${reportOpp.hpDamage} HP damage (Shield absorbed ${reportOpp.shieldDamage}).`
                );
            }
        }

        if (card.genjutsu) {
            if (isImune) {
                emitBattleLog(io, player, opponent, `👁️ Genjutsu failed due to enemy Green Eye!`, `👁️ Your Green Eye saw through their Genjutsu!`);
            } else if (opponent.table.length > 0) {
                const count = opponent.table.length;
                const stolenShields = opponent.table.map(shield => ({ ...shield }));
                player.table.push(...stolenShields);
                opponent.table = [];
                emitBattleLog(io, player, opponent,
                    `👁️ Genjutsu! You stole all (${count}) enemy shields!`,
                    `👁️ Genjutsu! ${player.login} hypnotized your defenses and STOLE all your shields!`
                );
            } else {
                emitBattleLog(io, player, opponent, `Cast Genjutsu, but opponent had no shields to steal.`, `${player.login} cast Genjutsu, but you have no shields.`);
            }
        }

        if (card.swap_hp) {
            if (isImune) {
                emitBattleLog(io, player, opponent, `🔄 Health Swap blocked by Green Eye!`, `🟢 Your Green Eye prevented your health from being swapped!`);
            } else {
                let tmp = player.hp;
                player.hp = opponent.hp;
                opponent.hp = tmp;
                emitBattleLog(io, player, opponent,
                    `🔄 HP SWAPPED! You now have ${player.hp} HP, enemy has ${opponent.hp} HP!`,
                    `🔄 HP SWAPPED! You now have ${opponent.hp} HP, enemy has ${player.hp} HP!`
                );
            }
        }

        if (card.green_eye) {
            player.greenEyeActive = true;
            emitBattleLog(io, player, opponent,
                `🟢 Green Eye activated! You are immune to enemy attacks until your next turn.`,
                `🟢 ${player.login} activated Green Eye and became immune to attacks!`
            );
        }

        if (card.sun_rising) {
            if (player.discard.length > 0) {
                const randomIndex = Math.floor(Math.random() * player.discard.length);
                const randomCard = player.discard.splice(randomIndex, 1)[0];
                player.hand.push(randomCard);
                emitBattleLog(io, player, opponent,
                    `🌅 Sun Rising! Recovered [${randomCard.name}] from discard pile to hand.`,
                    `🌅 Sun Rising! ${player.login} resurrected a card from their discard pile.`
                );
            } else {
                emitBattleLog(io, player, opponent, `Sun Rising cast, but your discard pile was empty.`, `${player.login} cast Sun Rising, but their discard pile was empty.`);
            }
        }

        if (card.steal_card) {
            if (isImune) {
                emitBattleLog(io, player, opponent, `🧤 Steal Card failed due to Green Eye!`, `🧤 Your Green Eye blocked their steal attempt.`);
            } else {
                if (opponent.deck.length === 0 && opponent.discard.length > 0) {
                    opponent.deck = Card.shuffle([...opponent.discard]);
                    opponent.discard = [];
                    emitBattleLog(io, player, opponent, `Opponent's deck was empty. Shuffled their discard pile into deck.`, `Your deck was empty. Discard pile shuffled into deck.`);
                }

                if (opponent.deck.length > 0) {
                    let stolenCard = opponent.deck.shift();
                    emitBattleLog(io, player, opponent,
                        `🧤 Stole a card from enemy's deck: [${stolenCard.name}]!`,
                        `🧤 ${player.login} stole a card directly from your deck!`
                    );

                    if (stolenCard.defense > 0) {
                        player.table.push({ ...stolenCard, currentDefense: stolenCard.defense });
                    } else {
                        player.discard.push(stolenCard);
                    }

                    executeCardEffects(stolenCard, player, opponent, io);
                } else {
                    emitBattleLog(io, player, opponent, `Tried to steal a card, but enemy's deck and discard are completely empty!`, `${player.login} tried to steal from your deck, but you have no cards left.`);
                }
            }
        }
    }

    io.on('connection', (socket) => {
        socket.on('joinGame', async (data) => {
            const fullDeck = await Card.createDeck(data.deckType);

            let startChakra = 120;
            if (data.deckType === 'paladin_ninja') startChakra = 100;
            if (data.deckType === 'rogue_ninja') startChakra = 150;

            const player = {
                id: socket.id,
                userId: socket.handshake.session ? socket.handshake.session.userId : null,
                login: data.login,
                avatar: data.avatar,
                deckType: data.deckType,
                hp: 10,
                chakra: startChakra,
                deck: fullDeck,
                hand: [],
                table: [],
                discard: [],
                extraPlays: 0
            };

            if (waitingPlayer && waitingPlayer.id !== socket.id) {
                const roomName = `room_${waitingPlayer.id}_${socket.id}`;
                socket.join(roomName);
                waitingPlayer.socket.join(roomName);
                rooms[roomName] = {
                    players: {
                        [waitingPlayer.id]: waitingPlayer,
                        [socket.id]: player
                    },
                    turn: waitingPlayer.id,
                    timeLeft: 30,
                    timer: null
                };

                Object.values(rooms[roomName].players).forEach(p => {
                    p.hand = p.deck.splice(0, 3);
                });

                Object.keys(rooms[roomName].players).forEach(pId => {
                    const currPlayer = rooms[roomName].players[pId];
                    const opponentId = Object.keys(rooms[roomName].players).find(id => id !== pId);
                    const opponent = rooms[roomName].players[opponentId];

                    io.to(pId).emit('gameStart', {
                        room: roomName,
                        hand: currPlayer.hand,
                        myHp: currPlayer.hp,
                        myChakra: currPlayer.chakra,
                        oppHp: opponent.hp,
                        oppChakra: opponent.chakra,
                        opponent: { login: opponent.login, avatar: opponent.avatar, handSize: opponent.hand.length },
                        turn: rooms[roomName].turn
                    });
                });

                startTurnTimer(roomName);
                waitingPlayer = null;
            } else {
                waitingPlayer = { ...player, socket };
                socket.emit('waiting', 'Searching for an opponent...');
            }
        });

        function startTurnTimer(roomName) {
            const room = rooms[roomName];
            if (!room) return;

            if (room.timer) clearInterval(room.timer);
            room.timeLeft = 30;

            room.timer = setInterval(() => {
                room.timeLeft--;
                io.to(roomName).emit('timerUpdate', { timeLeft: room.timeLeft, turn: room.turn });

                if (room.timeLeft <= 0) {
                    switchTurn(roomName);
                }
            }, 1000);
        }

        function switchTurn(roomName) {
            const room = rooms[roomName];
            if (!room) return;

            const playerIds = Object.keys(room.players);
            room.turn = playerIds.find(id => id !== room.turn);
            const nextPlayer = room.players[room.turn];
            nextPlayer.greenEyeActive = false;
            nextPlayer.extraPlays = 0;

            if (nextPlayer.deckType === 'paladin_ninja') {
                nextPlayer.chakra += 20;
            } else if (nextPlayer.deckType === 'rogue_ninja') {
                nextPlayer.chakra += 5;
            } else {
                nextPlayer.chakra += 10;
            }

            startTurnTimer(roomName);

            playerIds.forEach(pId => {
                if (pId === room.turn) {
                    io.to(pId).emit('updateLog', "YOUR TURN!");
                } else {
                    io.to(pId).emit('updateLog', "OPPONENT'S TURN...");
                }
            });

            playerIds.forEach(pId => {
                const currPlayer = room.players[pId];
                const oppId = playerIds.find(id => id !== pId);
                const opp = room.players[oppId];

                io.to(pId).emit('updateState', {
                    myHp: currPlayer.hp,
                    myChakra: currPlayer.chakra,
                    oppHp: opp.hp,
                    oppChakra: opp.chakra,
                    hand: currPlayer.hand,
                    myTable: currPlayer.table,
                    oppTable: opp.table,
                    oppHandSize: opp.hand.length,
                    turn: room.turn
                });
            });
        }

        socket.on('playCard', async (data) => {
            const { roomName, cardInstanceId } = data;
            const room = rooms[roomName];

            if (!room || room.turn !== socket.id) return;

            const player = room.players[socket.id];
            const opponentId = Object.keys(room.players).find(id => id !== socket.id);
            const opponent = room.players[opponentId];

            const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId);
            if (cardIndex === -1) return;

            const card = player.hand[cardIndex];

            const isFreePlay = player.extraPlays > 0;
            const actualCost = isFreePlay ? 0 : card.cost;

            if (actualCost > player.chakra) {
                socket.emit('updateLog', `Not enough chakra to play this card! You need: 💠${actualCost}, you have: 💠${player.chakra}`);
                return;
            }

            player.hand.splice(cardIndex, 1);
            player.chakra -= actualCost;

            emitBattleLog(io, player, opponent,
                `🃏 You played [${card.name}] (💠Cost: ${actualCost})`,
                `🃏 ${player.login} played [${card.name}]`
            );

            if (card.defense > 0) {
                player.table.push({ ...card, currentDefense: card.defense });
                emitBattleLog(io, player, opponent,
                    `🛡️ Deployed shield [${card.name}] with ${card.defense} defense.`,
                    `🛡️ ${player.login} deployed a shield [${card.name}] (${card.defense} defense).`
                );
            } else {
                player.discard.push(card);
            }

            executeCardEffects(card, player, opponent, io);

            if (player.hand.length === 0) {
                drawCards(player, 2);
                emitBattleLog(io, player, opponent, `🎴 Hand empty! Drew 2 bonus cards.`, `🎴 ${player.login}'s hand was empty; they drew 2 bonus cards.`);
            }

            if (isFreePlay) {
                player.extraPlays--;
            }

            if (player.extraPlays > 0) {
                room.timeLeft = 30;
                socket.emit('updateLog', `⚡ Extra play active! Remaining: ${player.extraPlays}`);
            } else {
                room.turn = opponentId;
                opponent.greenEyeActive = false;

                if (opponent.deckType === 'paladin_ninja') {
                    opponent.chakra += 20;
                } else if (opponent.deckType === 'rogue_ninja') {
                    opponent.chakra += 5;
                } else {
                    opponent.chakra += 10;
                }

                startTurnTimer(roomName);
            }

            let gameOver = false;
            let winner = null;
            if (player.hp <= 0 && opponent.hp <= 0) {
                gameOver = true; winner = 'draw';
            } else if (player.hp <= 0) {
                gameOver = true; winner = opponent.login;
            } else if (opponent.hp <= 0) {
                gameOver = true; winner = player.login;
            }

            Object.keys(room.players).forEach(pId => {
                const currPlayer = room.players[pId];
                const oppId = Object.keys(room.players).find(id => id !== pId);
                const opp = room.players[oppId];

                io.to(pId).emit('updateState', {
                    myHp: currPlayer.hp,
                    myChakra: currPlayer.chakra,
                    oppHp: opp.hp,
                    oppChakra: opp.chakra,
                    hand: currPlayer.hand,
                    myTable: currPlayer.table,
                    oppTable: opp.table,
                    oppHandSize: opp.hand.length,
                    turn: room.turn,
                    lastPlayedCard: card,
                    gameOver: gameOver,
                    winner: winner
                });
            });

            if (gameOver) {
                if (room.timer) clearInterval(room.timer);
                for (const pId in room.players) {
                    const p = room.players[pId];
                    if (p.userId) {
                        const isWin = (winner === p.login);
                        await User.updateStats(p.userId, isWin);
                    }
                }
                delete rooms[roomName];
            }
        });

        socket.on('passTurn', (data) => {
            const { roomName } = data;
            const room = rooms[roomName];
            if (!room || room.turn !== socket.id) return;

            const player = room.players[socket.id];
            player.extraPlays = 0;

            const meditateBonus = 20;
            player.chakra += meditateBonus;

            socket.emit('updateLog', `🧘 You meditate and gain +${meditateBonus} chakra for your next turn!`);

            const opponentId = Object.keys(room.players).find(id => id !== socket.id);
            io.to(opponentId).emit('updateLog', `🧘 ${player.login} meditates and gathers power...`);
            switchTurn(roomName);
        });

        socket.on('disconnect', () => {
            if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
            for (const roomName in rooms) {
                if (rooms[roomName].players[socket.id]) {
                    if (rooms[roomName].timer) clearInterval(rooms[roomName].timer);
                    io.to(roomName).emit('updateLog', 'Opponent disconnected.');
                    delete rooms[roomName];
                }
            }
        });

    });
};