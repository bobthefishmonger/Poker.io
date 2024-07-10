const RedisClient = require("../../expressServer/redis.js");
const db = require("../../management/dbmanager.js");
const rooms = require("./rooms.js");
const rounds = require("./rounds.js");

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
		PokerIO.to(room.roomID).emit("gamestarting");
		setTimeout(async () => {
			await game(room);
		}, 1000);
	}
}

function updateWinnings(room, winners) {
	const winnings = Math.floor(room.pot / winners.length);
	winners.forEach(async (winner) => {
		const session = await RedisClient.getSession(winner.sessionID);
		db.updatePokerEarnings(
			session.AccountInfo.AccountID,
			session.AccountInfo.Earnings.Poker + winnings
		);
	});
}

async function game(room) {
	rounds.blinds(room);
	rounds.betround(room);
	rounds.dealflop(room);
	rounds.betround(room);
	rounds.dealturn(room);
	rounds.betround(room);
	rounds.dealriver(room);
	rounds.betround(room);
	const winners = rounds.winner(room);
	updateWinnings(room, winners);
}

module.exports = {
	setPokerIO,
	startgame
};
