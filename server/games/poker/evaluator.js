const lookup = require("./lookuptable.js");
const suitsval = {
    Clubs: 0x8000,
    Diamonds: 0x4000,
    Hearts: 0x2000,
    Spades: 0x1000
}

const rankval = {
    "2": 0,
    "3": 0x100,
    "4": 0x200,
    "5": 0x300,
    "6": 0x400,
    "7": 0x500,
    "8": 0x600,
    "9": 0x700,
    "10": 0x800,
    "J": 0x900,
    "Q": 0xA00,
    "K": 0xB00,
    "A": 0xC00
}

const bitindicatorrankval = {
    "2": 0x10000,
    "3": 0x20000,
    "4": 0x40000,
    "5": 0x80000,
    "6": 0x100000,
    "7": 0x200000,
    "8": 0x400000,
    "9": 0x800000,
    "10": 0x1000000,
    "J": 0x2000000,
    "Q": 0x4000000,
    "K": 0x8000000,
    "A": 0x10000000
}

const primerankval = {
    "2": 2,
    "3": 3,
    "4": 5,
    "5": 7,
    "6": 11,
    "7": 13,
    "8": 17,
    "9": 19,
    "10": 23,
    "J": 29,
    "Q": 31,
    "K": 37,
    "A": 41
}

function gethash(u){
    let a, b, r;
    u += 0xe91aaa35;
    u ^= u >>> 16;
    u += u << 8;
    u ^= u >>> 4;
    b  = (u >>> 8) & 0x1ff;
    a  = (u + (u << 2)) >>> 19;
    r  = a ^ lookup.HASHAJUST[b];
    return r
}

function exchangecard(card){
    return (bitindicatorrankval[card[0]] | suitsval[card[1]] | rankval[card[0]] | primerankval[card[0]]);
}

function evaluate5cards(c1, c2, c3, c4, c5){
    let i = (c1 | c2 | c3 | c4 | c5) >>> 16;
    if (c1 & c2 & c3 & c4 & c5 & 0xF000){
        return lookup.FLUSHHANDS[i];
    }
    let handval = lookup.NONFLUSHHANDS[i]
    if (handval) return handval;
    i = (c1 & 0xFF) * (c2 & 0xFF) * (c3 & 0xFF) * (c4 & 0xFF) * (c5 & 0xFF);
    return lookup.HASHVALUES[gethash(i)]
}

function cardhandtype(val){
        if (val > 6185) return "High card";
        if (val > 3325) return "One pair";
        if (val > 2467) return "Two pair";
        if (val > 1609) return "Three of a kind";
        if (val > 1599) return "Straight";
        if (val > 322)  return "Flush";
        if (val > 166)  return "Full house";
        if (val > 10)   return "Four of a kind";
        if (val === 1) return "Royal Flush";
        else return "Straight flush";
}

function evaluate7cards(cards){
    cards = cards.map(exchangecard);
    const perms = [
        [ 0, 1, 2, 3, 4 ],
        [ 0, 1, 2, 3, 5 ],
        [ 0, 1, 2, 3, 6 ],
        [ 0, 1, 2, 4, 5 ],
        [ 0, 1, 2, 4, 6 ],
        [ 0, 1, 2, 5, 6 ],
        [ 0, 1, 3, 4, 5 ],
        [ 0, 1, 3, 4, 6 ],
        [ 0, 1, 3, 5, 6 ],
        [ 0, 1, 4, 5, 6 ],
        [ 0, 2, 3, 4, 5 ],
        [ 0, 2, 3, 4, 6 ],
        [ 0, 2, 3, 5, 6 ],
        [ 0, 2, 4, 5, 6 ],
        [ 0, 3, 4, 5, 6 ],
        [ 1, 2, 3, 4, 5 ],
        [ 1, 2, 3, 4, 6 ],
        [ 1, 2, 3, 5, 6 ],
        [ 1, 2, 4, 5, 6 ],
        [ 1, 3, 4, 5, 6 ],
        [ 2, 3, 4, 5, 6 ]
    ]
    let bestscore = evaluate5cards(cards[0], cards[1], cards[2], cards[3], cards[4]);
    perms.forEach((perm) => {
        let score = evaluate5cards(cards[perm[0]], cards[perm[1]], cards[perm[2]], cards[perm[3]], cards[perm[4]]);
        bestscore = Math.min(bestscore, score);
    });
    const type = cardhandtype(bestscore);
    return [bestscore, type];
}
function findwinner(players){ //[{username: String, cards: Array}]
    let minscore = 10000;
    let winners = []
    for (const player of players){
        player.score = evaluate7cards(player.cards);
        if (player.score < minscore){
            winners = [player.username];
            minscore = player.score;
        }else if (player.score === minscore){
            winners.push(player.username);
        }
    }
    return winners;
}

module.exports = {
    findwinner
}