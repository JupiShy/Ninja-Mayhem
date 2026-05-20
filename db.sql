CREATE DATABASE IF NOT EXISTS great_battle;
USE great_battle;

DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'default_user.png',
    wins INT DEFAULT 0,
    losses INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deck_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    cost INT DEFAULT 0,
    image VARCHAR(255),
    attack INT DEFAULT 0,
    defense INT DEFAULT 0,
    heal INT DEFAULT 0,
    draw_cards INT DEFAULT 0,
    play_extra INT DEFAULT 0,

    destroy_shield VARCHAR(10) DEFAULT NULL,
    discard_all BOOLEAN DEFAULT FALSE,
    fireball BOOLEAN DEFAULT FALSE,
    genjutsu BOOLEAN DEFAULT FALSE,
    swap_hp BOOLEAN DEFAULT FALSE,
    sun_rising BOOLEAN DEFAULT FALSE,
    green_eye BOOLEAN DEFAULT FALSE,
    steal_card BOOLEAN DEFAULT FALSE,

    count_in_deck INT DEFAULT 1
);

-- Fourth Raikage (Barbarian)
INSERT INTO cards (deck_type, name, cost, image, attack, defense, heal, draw_cards, play_extra, destroy_shield, discard_all, count_in_deck) VALUES
('barbarian_ninja', 'Lightning Release Armor', 25, 'raikage_armor.png', 0, 3, 0, 0, 0, NULL, FALSE, 2),
('barbarian_ninja', 'Liger Bomb', 40, 'raikage_bomb.png', 4, 0, 0, 0, 0, NULL, FALSE, 2),
('barbarian_ninja', 'Lightning Oppression', 35, 'raikage_oppression.png', 0, 0, 0, 0, 1, NULL, TRUE, 2),
('barbarian_ninja', 'Elbow Bolt', 15, 'raikage_elbow.png', 1, 0, 0, 0, 1, NULL, FALSE, 2),
('barbarian_ninja', 'Iron Claw', 20, 'raikage_claw.png', 2, 0, 0, 0, 0, NULL, FALSE, 2),
('barbarian_ninja', 'Chakra Recharge', 0, 'raikage_recharge.png', 0, 0, 1, 1, 0, NULL, FALSE, 2),
('barbarian_ninja', 'Guillotine Drop', 30, 'raikage_drop.png', 0, 0, 0, 1, 0, 'any', FALSE, 2),
('barbarian_ninja', 'Body Flicker Speed', 25, 'raikage_flicker.png', 0, 0, 0, 0, 2, NULL, FALSE, 2),
('barbarian_ninja', 'Lariat', 30, 'raikage_lariat.png', 3, 0, 0, 0, 0, NULL, FALSE, 5),
('barbarian_ninja', 'Warrior Spirit', 15, 'raikage_spirit.png', 1, 0, 1, 0, 0, NULL, FALSE, 2),
('barbarian_ninja', 'Lightning Reflex', 10, 'raikage_reflex.png', 0, 1, 0, 1, 0, NULL, FALSE, 1),
('barbarian_ninja', 'Tactical Insight', 20, 'raikage_insight.png', 0, 0, 0, 2, 0, NULL, FALSE, 2),
('barbarian_ninja', 'Thunder Shield', 20, 'raikage_shield.png', 0, 2, 0, 0, 0, NULL, FALSE, 1),
('barbarian_ninja', 'Cloud Village Resolve', 15, 'raikage_resolve.png', 0, 0, 1, 2, 0, NULL, FALSE, 1);

-- Orochimaru (Mage)
INSERT INTO cards (deck_type, name, cost, image, attack, defense, draw_cards, play_extra, fireball, swap_hp, genjutsu, heal, count_in_deck) VALUES
('mage_ninja', 'Mystic Shield', 15, 'orochimaru_shield.png', 0, 1, 1, 0, FALSE, FALSE, FALSE, 0, 2),
('mage_ninja', 'Striking Shadow Snakes', 30, 'orochimaru_snakes.png', 3, 0, 0, 0, FALSE, FALSE, FALSE, 0, 4),
('mage_ninja', 'Cursed Seal Release', 20, 'orochimaru_seal.png', 1, 0, 0, 1, FALSE, FALSE, FALSE, 0, 3),
('mage_ninja', 'Great Fire Breath', 40, 'orochimaru_fire.png', 0, 0, 0, 0, TRUE, FALSE, FALSE, 0, 2),
('mage_ninja', 'Living Corpse Reincarnation', 60, 'orochimaru_corpse.png', 0, 0, 0, 0, FALSE, TRUE, FALSE, 0, 2),
('mage_ninja', 'Eight-Headed Serpent', 45, 'orochimaru_serpent.png', 0, 0, 0, 2, FALSE, FALSE, FALSE, 0, 3),
('mage_ninja', 'Snake Binding Spell', 35, 'orochimaru_binding.png', 0, 0, 0, 0, FALSE, FALSE, TRUE, 0, 2),
('mage_ninja', 'Kusanagi Sword', 25, 'orochimaru_sword.png', 2, 0, 0, 0, FALSE, FALSE, FALSE, 0, 3),
('mage_ninja', 'Research & Sabotage', 20, 'orochimaru_research.png', 0, 0, 3, 0, FALSE, FALSE, FALSE, 0, 3),
('mage_ninja', 'Mud Body Skin', 15, 'orochimaru_mud.png', 0, 2, 0, 0, FALSE, FALSE, FALSE, 0, 1),
('mage_ninja', 'Snake Molting', 20, 'orochimaru_molting.png', 0, 0, 0, 1, FALSE, FALSE, FALSE, 1, 2),
('mage_ninja', 'Triple Rashomon', 35, 'orochimaru_rashomon.png', 0, 3, 0, 0, FALSE, FALSE, FALSE, 0, 1);

-- Sakura Haruno (Paladin)
INSERT INTO cards (deck_type, name, cost, image, attack, heal, draw_cards, play_extra, defense, sun_rising, destroy_shield, count_in_deck) VALUES
('paladin_ninja', 'Focused Chakra Fist', 15, 'sakura_fist.png', 1, 0, 0, 1, 0, FALSE, NULL, 3),
('paladin_ninja', 'Mystical Palm Strike', 30, 'sakura_palm.png', 3, 1, 0, 0, 0, FALSE, NULL, 3),
('paladin_ninja', 'Heavenly Foot of Pain', 35, 'sakura_kick.png', 3, 0, 0, 0, 0, FALSE, NULL, 2),
('paladin_ninja', 'Cherry Blossom Impact', 20, 'sakura_impact.png', 2, 0, 0, 0, 0, FALSE, NULL, 4),
('paladin_ninja', 'Hundred Healings Mark', 25, 'sakura_mark.png', 0, 2, 0, 0, 0, TRUE, NULL, 2),
('paladin_ninja', 'Chakra Scalpel', 20, 'sakura_scalpel.png', 2, 1, 0, 0, 0, FALSE, NULL, 3),
('paladin_ninja', 'Analytical Mind', 10, 'sakura_mind.png', 0, 0, 2, 0, 0, FALSE, NULL, 2),
('paladin_ninja', 'Adrenaline Rush', 15, 'sakura_rush.png', 0, 0, 0, 2, 0, FALSE, NULL, 2),
('paladin_ninja', 'Team Coordination', 10, 'sakura_team.png', 0, 0, 1, 0, 1, FALSE, NULL, 2),
('paladin_ninja', 'Slug Summon: Katsuyu', 25, 'sakura_slug.png', 0, 0, 0, 0, 3, FALSE, NULL, 2),
('paladin_ninja', 'Ground Shatter', 30, 'sakura_shatter.png', 0, 0, 0, 1, 0, FALSE, 'all', 1),
('paladin_ninja', 'Healing Barrier', 15, 'sakura_barrier.png', 0, 0, 0, 0, 2, FALSE, NULL, 1),
('paladin_ninja', 'Mitotic Regeneration', 20, 'sakura_regen.png', 0, 1, 2, 0, 0, FALSE, NULL, 1);

-- Naruto Uzumaki (Rogue)
INSERT INTO cards (deck_type, name, cost, image, defense, attack, green_eye, play_extra, steal_card, draw_cards, heal, destroy_shield, count_in_deck) VALUES
('rogue_ninja', 'Multi Shadow Clone Wall', 30, 'naruto_clones.png', 2, 0, FALSE, 0, FALSE, 0, 0, NULL, 2),
('rogue_ninja', 'Rasengan', 40, 'naruto_rasengan.png', 0, 2, FALSE, 0, FALSE, 0, 0, NULL, 4),
('rogue_ninja', 'Odama Rasengan', 55, 'naruto_rasengan_big.png', 0, 3, FALSE, 0, FALSE, 0, 0, NULL, 3),
('rogue_ninja', 'Sage Art: Six Paths', 50, 'naruto_sage.png', 0, 0, TRUE, 0, FALSE, 0, 0, NULL, 2),
('rogue_ninja', 'Uzumaki Barrage', 25, 'naruto_barrage.png', 0, 1, FALSE, 1, FALSE, 0, 0, NULL, 5),
('rogue_ninja', 'Harem Jutsu', 30, 'naruto_harem.png', 0, 0, FALSE, 0, TRUE, 0, 0, NULL, 2),
('rogue_ninja', 'Ichiraku Ramen', 15, 'naruto_ramen.png', 0, 0, FALSE, 0, FALSE, 2, 1, NULL, 1),
('rogue_ninja', 'Flying Raijin Step', 35, 'naruto_step.png', 0, 0, FALSE, 2, FALSE, 0, 0, NULL, 2),
('rogue_ninja', 'Body Replacement', 20, 'naruto_replacement.png', 0, 0, FALSE, 0, FALSE, 1, 0, NULL, 2),
('rogue_ninja', 'Nine-Tails Chakra Cloak', 45, 'naruto_cloak.png', 3, 0, FALSE, 0, FALSE, 0, 0, NULL, 1),
('rogue_ninja', 'Rasenshuriken', 60, 'naruto_shuriken.png', 0, 0, FALSE, 1, FALSE, 0, 0, 'any', 2),
('rogue_ninja', 'Guts of a Shinobi', 25, 'naruto_guts.png', 0, 0, FALSE, 1, FALSE, 0, 1, NULL, 2);