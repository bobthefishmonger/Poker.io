const RedisClient = require("redisjson-express-session-store");
const poker_sockets = new Map();
const blackjack_sockets = new Map();
const roulette_sockets = new Map();
const globalsockets = new Map();

const sockets = [
	poker_sockets,
	blackjack_sockets,
	roulette_sockets,
	globalsockets
];

const types = ["poker_socket", "blackjack_socket", "roulette_socket", "socket"];

function getpath(socket) {
	try {
		let url = socket.request.headers.referer.split(
			socket.request.headers.host
		)[1];
		url = url.slice(0, -1);
		return url;
	} catch {
		let url = socket.request.headers.referer.split(
			socket.request.headers["x-forwarded-host"]
		)[1];
		url = url.slice(0, -1);
		return url;
	}
}

async function anysocketconnect(socket, type) {
	try {
		sockets[type].set(socket.id, socket);
		await RedisClient.setSession(
			socket.request.sessionID,
			`socketids.${types[type]}`,
			socket.id
		);
	} catch {
		socket.emit("refresh");
	}
	return socket.request.sessionID;
}

async function anysocketdisconnect(socket, type) {
	try {
		await RedisClient.setSession(
			socket.request.sessionID,
			`socketids.${types[type]}`,
			null
		);
		sockets[type].delete(socket.id);
	} catch (err) {
		console.error(err);
	}
}

async function emitnextsetup(socket) {
	return new Promise((resolve, reject) => {
		try {
			const x = setTimeout(() => {
				reject(`timed out ${socket.id}`);
			}, 2000);
			socket.emit("nextsetup", () => {
				clearTimeout(x);
				resolve();
			});
		} catch (err) {
			console.error(err.message);
			reject(err.message);
		}
	});
}

async function nextsetup(socket) {
	const path = getpath(socket);
	if (path.slice(0, 6) === "/games" && path !== "/games") {
		try {
			await emitnextsetup(socket);
		} catch {
			socket.emit("refresh");
		}
	}
}

function getpokersocket(socketID) {
	return poker_sockets.get(socketID);
}

module.exports = {
	getpath,
	nextsetup,
	anysocketconnect,
	anysocketdisconnect,
	getpokersocket
};
