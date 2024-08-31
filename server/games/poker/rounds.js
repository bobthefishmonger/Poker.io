const eval = require("poker-eval");
const TIMEOUTLENGTH = 120_000;
const BlindSizes = {
	2500: [10, 25],
	5000: [25, 50],
	10000: [50, 100]
};

let PokerIO;

function setPokerIO(IO) {
	PokerIO = IO;
}

function dealplayercards(room) {
	let i = 1;
	room.players.forEach((player) => {
		const cards = [room.deck.takenextcard(), room.deck.takenextcard()];
		player.poker_socket.emit("Player Cards", cards, i);
		player.cards = cards;
		i++;
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
	PokerIO.to(room.roomID).emit("Turn card", nextcard);
	room.communityCards.push(nextcard);
}

function dealriver(room) {
	const nextcard = room.deck.takenextcard();
	PokerIO.to(room.roomID).emit("River card", nextcard);
	room.communityCards.push(nextcard);
}
function moveplayers(room) {
	let offset = room.gamesplayed;
	while (offset >= room.usernames.length) {
		offset -= room.usernames.length;
	}
	const newPlayers = new Map();
	const newusernames = [
		...room.usernames.slice(offset),
		...room.usernames.slice(0, offset)
	];
	newusernames.forEach((username) => {
		newPlayers.set(username, room.players.get(username));
	});
	return [newPlayers, newusernames];
}

function blinds(room) {
	const SBindex = 0;
	const BBindex = 1;
	const SBname = room.usernames[SBindex];
	const BBname = room.usernames[BBindex];
	const SBplayer = room.players.get(SBname);
	const BBplayer = room.players.get(BBname);
	SBplayer.poker_socket.emit("smallblind", BlindSizes[room.stacksize][0]);
	BBplayer.poker_socket.emit("bigblind", BlindSizes[room.stacksize][1]);
	room.Bigblind = BlindSizes[room.stacksize][1];
	PokerIO.to(room.roomID).emit("blinds", [SBname, BBname]);
	SBplayer.stack -= BlindSizes[room.stacksize][0];
	SBplayer.amountbet += BlindSizes[room.stacksize][0];
	BBplayer.stack -= BlindSizes[room.stacksize][1];
	BBplayer.amountbet += BlindSizes[room.stacksize][1];
	room.players.forEach((player) => {
		player.poker_socket.emit("stack", player.stack);
	});
	room.pot += BlindSizes[room.stacksize][0] + BlindSizes[room.stacksize][1];
}

async function betround(room) {
	room.callAmount = room.Bigblind;
	room.cancheck = true;
	room.roundover = false;
	room.firstbetplayer = true;
	room.playerbets = new Map();
	room.players.forEach((player, username) => {
		room.playerbets.set(username, 0);
	});
	if (
		room.foldedplayers.size + room.allinplayers.size + 1 ===
		room.players.size
	) {
		return;
	}
	while (!room.roundover) {
		for (const [username, player] of room.players) {
			const callAmount = room.callAmount - room.playerbets.get(username);
			if (
				room.foldedplayers.get(username) ||
				room.allinplayers.get(username)
			) {
				return;
			}
			if (room.foldedplayers.size === room.players.size - 1) {
				room.roundover = true;
				return;
			}
			if (callAmount <= 0) {
				if (islastplayer(room, player)) room.roundover = true;
				return;
			}
			room.playergo = username;

			const options = ["Fold", "All-in"];
			if (room.cancheck) {
				options.push("Check");
				if (callAmount < player.stack) {
					options.push("Raise");
				}
			} else if (callAmount < player.stack) {
				options.push("Call", "Raise");
			}
			let choice;
			try {
				choice = await getPlayerDecision(
					room,
					player,
					room.firstbetplayer,
					options,
					callAmount,
					player.stack
				);
			} catch (err) {
				choice = ["Fold"];
				player.poker_socket.emit("error", err.message || err);
			}
			PokerIO.to(room.roomID).emit(
				"Player Go",
				username,
				choice,
				room.firstbetplayer
			);
			room.lastgo = [username, choice, room.firstbetplayer];
			try {
				handlechoice(room, player, choice, callAmount);
			} catch (err) {
				console.error(err);
			}
			player.poker_socket.emit("Stack change", player.stack);
			room.playergo = null;
		}
	}
}

async function getPlayerDecision(
	room,
	player,
	firstbetplayer,
	options,
	callAmount,
	stacksize
) {
	return new Promise((resolve, reject) => {
		function playerDisconnect() {
			player.reconnection = [
				"Players Turn",
				options,
				firstbetplayer,
				callAmount,
				stacksize,
				decision
			];
		}
		function decision(decision) {
			{
				try {
					if (
						!decision ||
						!decision[0] ||
						!options.includes(decision[0]) ||
						(decision[0] === "Raise" &&
							(isNaN(decision[1]) ||
								Number(decision[1]) >= player.stack ||
								(Number(decision[1] <= callAmount) &&
									!firstbetplayer))) ||
						Number(decision[1] < callAmount)
					) {
						throw Error("Invalid Choice");
					}
					if (room.playergo !== player.username)
						throw Error("It is not your go");
					clearTimeout(timeoutplayer);
					resolve(decision);
					player.poker_socket.emit("finished go", null);
					player.poker_socket.off("disconnecting", playerDisconnect);
				} catch (err) {
					player.poker_socket.emit("finished go", err.message || err);
					getPlayerDecision(
						room,
						player,
						firstbetplayer,
						options,
						callAmount,
						stacksize
					)
						.then(resolve)
						.catch(reject);
				}
			}
		}
		player.poker_socket.emit(
			"Players Turn",
			options,
			firstbetplayer,
			callAmount,
			stacksize,
			decision
		);
		const timeoutplayer = setTimeout(() => {
			reject("timed out");
			player.poker_socket.off("disconnecting", playerDisconnect);
		}, TIMEOUTLENGTH);
		if (player.poker_socket.connected) {
			player.poker_socket.on("disconnecting", playerDisconnect);
		} else {
			playerDisconnect();
		}
	});
}

function handlechoice(room, player, choice, callAmount) {
	if (choice[0] === "Fold") {
		room.foldedplayers.set(player.username, player);
	} else if (choice[0] === "All-in") {
		room.allinplayers.set(player.username, player);
		room.cancheck = false;
		if (callAmount >= player.stack) {
			if (islastplayer(room, player)) {
				room.roundover = true;
			}
		} else {
			room.callAmount = Math.max(room.callAmount, player.stack);
		}
		room.pot += player.stack;
		player.amountbet += player.stack;
		player.stack = 0;
		room.playerbets.set(
			player.username,
			room.playerbets.get(player.username) + player.stack
		);
	} else if (choice[0] === "Call") {
		player.stack -= callAmount;
		room.pot += callAmount;
		player.amountbet += callAmount;
		room.playerbets.set(
			player.username,
			room.playerbets.get(player.username) + callAmount
		);
	} else if (choice[0] === "Raise") {
		choice[1] = Number(choice[1]);
		player.stack -= choice[1];
		room.pot += choice[1];
		room.callAmount = room.playerbets.get(player.username) + choice[1];
		room.cancheck = false;
		room.firstbetplayer = false;
		room.playerbets.set(
			player.username,
			room.playerbets.get(player.username) + choice[1]
		);
		player.amountbet += choice[1];
	} else {
		if (islastplayer(room, player)) {
			room.roundover = true;
		}
	}
}

function islastplayer(room, player) {
	const activeusernames = room.usernames.filter((username) => {
		return (
			!room.foldedplayers.get(username) ||
			!room.allinplayers.get(username)
		);
	});
	return player.username === activeusernames[activeusernames.length - 1];
}

function winner(room) {
	let minscore = Infinity;
	let winners = [];
	room.players.forEach((player, username) => {
		player.cards.push(...room.communityCards);
		if (room.foldedplayers.get(username)) return;
		player.score = eval.evaluate7cards(player.cards);
		if (player.score < minscore) {
			winners = [player.username];
			minscore = player.score;
		} else if (player.score === minscore) {
			winners.push(username);
		}
	});
	return winners;
}

module.exports = {
	setPokerIO,
	moveplayers,
	dealplayercards,
	dealflop,
	dealturn,
	dealriver,
	blinds,
	betround,
	winner
};
