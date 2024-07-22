const db = require("../../management/dbmanager.js");
const rooms = require("./rooms.js");
const rounds = require("./rounds.js");
const RedisClient = require("redisjson-express-session-store");

let PokerIO;

function setPokerIO(IO) {
	PokerIO = IO;
	rooms.setPokerIO(IO);
	rounds.setPokerIO(IO);
}

function startgame(req, res) {
	const room = rooms.activerooms.get(req.session.PokerData?.roomID);
	if (
		!req.session.AccountInfo.Username ||
		!room ||
		req.session.AccountInfo.Username !== room.host.username ||
		room.round !== 0
	) {
		res.json({ success: false, message: "Invalid Credentials" });
	} else if (room.nplayers !== room.maxplayers) {
		res.json({ success: false, message: "The room is not full" });
	} else {
		res.json({ success: true });
		PokerIO.to(room.roomID).emit("gamestarting", room.usernames);
		setTimeout(async () => {
			await game(room);
		}, 1000);
	}
}

async function updateWinnings(room, winners) {
	const winnings = Math.floor(room.pot / winners.length / 5) * 5;
	console.log(winnings);
	for (const winner of winners) {
		const sessionID = room.players.get(winner).sessionID;
		const session = await RedisClient.getSession(sessionID);
		db.updatePokerEarnings(
			session.AccountInfo.AccountID,
			session.AccountInfo.Earnings.Poker + winnings //player.amount bet is subtracted later
		);
		await RedisClient.setSession(
			sessionID,
			"AccountInfo.Earnings.Poker",
			session.AccountInfo.Earnings.Poker + winnings
		);
	}
	for (const [uname, player] of room.players) {
		const session = await RedisClient.getSession(player.sessionID);
		db.updatePokerEarnings(
			session.AccountInfo.AccountID,
			session.AccountInfo.Earnings.Poker - player.amountbet
		);
		await RedisClient.setSession(
			player.sessionID,
			"AccountInfo.Earnings.Poker",
			session.AccountInfo.Earnings.Poker - player.amountbet
		);
	}
}

async function newgame(room) {
	return new Promise((resolve, reject) => {
		room.host.poker_socket.emit("rematch", (playagain) => {
			if (playagain) {
				const newroom = new rooms.Poker_Room(
					room.maxplayers,
					room.stacksize,
					room.visibility,
					room.gamesplayed
				);
				PokerIO.to(room.roomID).emit("New Room", newroom.roomID);
				//we need to make sure the gamestarts with the offset player and not just blinds
			} else {
				PokerIO.to(room.roomID).emit("homebtn");
			}
			resolve();
		});
	});
}

function getwinnercards(room, winners) {
	const cards = [];
	const indexs = [];
	winners.forEach((winner) => {
		indexs.push(room.usernames.indexOf(winner) + 1);
		cards.push(room.players.get(winner).cards);
	});
	return [indexs, cards];
}

async function game(room) {
	room.allinplayers = new Map();
	room.foldedplayers = new Map();
	room.round = 1;
	const shuffled = rounds.moveplayers(room);
	room.players = shuffled[0];
	room.usernames = shuffled[1];
	rounds.blinds(room);
	rounds.dealplayercards(room);
	await rounds.betround(room);
	room.round = 2;
	rounds.dealflop(room);
	await rounds.betround(room);
	room.round = 3;
	rounds.dealturn(room);
	await rounds.betround(room);
	room.round = 4;
	rounds.dealriver(room);
	await rounds.betround(room);
	room.round = 5;
	const winners = rounds.winner(room);
	const winnerinfo = getwinnercards(room, winners);
	PokerIO.to(room.roomID).emit(
		"winners",
		winners,
		winnerinfo[0],
		winnerinfo[1]
	);
	await updateWinnings(room, winners);
	room.gamesplayed += 1;
	await newgame(room);
	//could change this to a do while where stacks carry between games, need to kick empty stacks ect
}

module.exports = {
	setPokerIO,
	startgame
};
