const eval = require("./evaluator.js");

let PokerIO;

const BlindSizes = {
	2500: [10, 25],
	5000: [25, 50],
	10000: [50, 100]
};

function setPokerIO(IO) {
	PokerIO = IO;
}

function dealplayercards(room) {
	room.players.forEach((player) => {
		const cards = [room.deck.takenextcard(), room.deck.takenextcard()];
		player.poker_socket.emit("Player Cards", cards);
		player.cards = cards;
	});
}
function dealflop(room) {
	const communityCards = [
		room.deck.takenextcard(),
		room.deck.takenextcard(),
		room.deck.takenextcard()
	];
	PokerIO.to(room.roomID).emit("Flop cards", communityCards);
	room.communityCards = communityCards;
}
function dealturn(room) {
	const nextcard = room.deck.takenextcard();
	PokerIO.to(room.roomID).emit("Turn cards", nextcard);
	room.communityCards.push(nextcard);
}
function dealriver(room) {
	const nextcard = room.deck.takenextcard();
	PokerIO.to(room.roomID).emit("River cards", nextcard);
	room.communityCards.push(nextcard);
}

function blinds(room) {
	let SBindex = 0 + room.gamesplayed;
	while (SBindex > room.usernames.length) {
		SBindex -= room.usernames.length;
	}
	let BBindex = 1 + room.gamesplayed;
	while (BBindex > room.usernames.length) {
		BBindex -= room.usernames.length;
	}
	const SBname = room.usernames[SBindex];
	const BBname = room.usernames[BBindex];
	const SBplayer = room.players.get(SBname);
	const BBplayer = room.players.get(BBname);
	SBplayer.poker_socket.emit("smallblind", BlindSizes[room.stacksize][0]);
	BBplayer.poker_socket.emit("bigblind", BlindSizes[room.stacksize][1]);
	PokerIO.to(room.roomID).emit("blinds", [SBname, BBname]);
	SBplayer.stack -= BlindSizes[room.stacksize][0];
	BBplayer.stack -= BlindSizes[room.stacksize][1];
	room.players.forEach((player) => {
		player.socket.emit("stack", player.stack);
	});
}

function playertimedout(player) {
	player.poker_socket.emit("Timeout");
	//active disconnect
}

function betround(room) {}

function validateDecision(room, player, decision) {}

function getPlayerDecision(room, player) {
	return new Promise((resolve, reject) => {
		player.poker_socket.emit("Players Turn", [options], (decision) => {
			try {
				validateDecision(room, player, decision);
				clearTimeout(timeoutplayer);
				resolve(choice);
			} catch {
				player.poker_socket.emit("Invalid Choice");
			}
		});
		const timeoutplayer = setTimeout(() => {
			player.poker_socket.emit("timed out");
			playertimedout(player);
			reject("timed out");
		}, TIMEOUTLENGTH);
	});
}

function winner(room) {
	let minscore = 10000;
	let winners = [];
	for (const player of room.activeplayers) {
		player.score = eval.evaluate7cards(player.cards);
		if (player.score < minscore) {
			winners = [player.username];
			minscore = player.score;
		} else if (player.score === minscore) {
			winners.push(player);
		}
	}
	return winners;
}

module.exports = {
	setPokerIO,
	dealflop,
	dealturn,
	dealriver,
	blinds,
	betround,
	winner
};
