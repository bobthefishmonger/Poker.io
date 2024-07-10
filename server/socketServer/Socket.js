const socketutils = require("./socketutils.js");
const poker_rooms = require("../games/poker/rooms.js");
const RedisClient = require("../expressServer/redis.js");
const PokerGame = require("../games/poker/game.js");

async function poker_socket_setup(poker_socket) {
	const sessionID = await socketutils.anysocketconnect(poker_socket, 0);
	poker_socket.on("disconnecting", async () => {
		await poker_rooms.pokerDisconnect(
			sessionID,
			socketutils.getpath(poker_socket)
		);
		await socketutils.anysocketdisconnect(poker_socket, 0);
	});
}

async function blackjack_socket_setup(blackjack_socket) {
	const sessionID = await socketutils.anysocketconnect(blackjack_socket, 1);
	blackjack_socket.on("disconnecting", async () => {
		await socketutils.anysocketdisconnect(blackjack_socket, 1);
	});
}

async function roulette_socket_setup(roulette_socket) {
	const sessionID = await socketutils.anysocketconnect(roulette_socket, 2);
	roulette_socket.on("disconnecting", async () => {
		await socketutils.anysocketdisconnect(roulette_socket, 2);
	});
}

async function socket_setup(socket) {
	const sessionID = await socketutils.anysocketconnect(socket, 3);
	if (socket.request.session.redirectNote) {
		socket.emit("Redirect Note", socket.request.session.redirectNote);
		await RedisClient.setSession(sessionID, "redirectNote", null);
	}
	await socketutils.nextsetup(socket);
	socket.on("disconnecting", async () => {
		await socketutils.anysocketdisconnect(socket, 3);
		await RedisClient.setSession(sessionID, "isOnline", false);
	});
}

function socketsetup(io) {
	const PokerIO = io.of("/poker");
	const BlackjackIO = io.of("/blackjack");
	const RouletteIO = io.of("/roulette");
	PokerGame.setPokerIO(PokerIO);
	PokerIO.on("connection", (poker_socket) => {
		poker_socket_setup(poker_socket);
	});

	BlackjackIO.on("connection", (blackjack_socket) => {
		blackjack_socket_setup(blackjack_socket);
	});

	RouletteIO.on("connection", (roulette_socket) => {
		roulette_socket_setup(roulette_socket);
	});

	io.on("connection", async (socket) => {
		socket_setup(socket);
	});
}
module.exports = {
	socketsetup
};
