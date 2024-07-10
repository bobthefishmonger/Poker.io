const socketutils = require("../../socketServer/socketutils.js");
const RedisClient = require("../../expressServer/redis.js");
const players = require("./players.js");
const activerooms = new Map();
let PokerIO;

const RANKS = [
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"J",
	"Q",
	"K",
	"A"
];
const SUITS = ["Clubs", "Diamonds", "Hearts", "Spades"];

class Deck {
	constructor() {
		this.cards = [];
		for (const rank of RANKS) {
			for (const suit of SUITS) {
				this.cards.push([rank, suit]);
			}
		}
		this.shuffledeck();
	}

	shuffledeck() {
		for (let i = 0; i < this.cards.length - 1; i++) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
		}
	}

	takenextcard() {
		return this.cards.pop();
	}
}

function setPokerIO(IO) {
	PokerIO = IO;
}

class Poker_Room {
	constructor(maxplayers, stacksize, visibility) {
		this.players = new Map();
		this.activeplayers = null;
		this.bettingplayers = null;
		this.usernames = [];
		this.nplayers = 0;
		this.maxplayers = Number(maxplayers);
		this.host = null;
		this.pot = 0;
		this.stacksize = stacksize;
		this.round = 0;
		this.gamesplayed = 0;
		this.visibility = visibility;
		this.deck = new Deck();
		this.communityCards = [];
		this.removedplayers = new Map();
		this.deletetimer = setTimeout(() => {
			room.deletethis();
		}, 5 * 60 * 1000);
		do {
			this.roomID = Math.trunc(100000 + Math.random() * 900000);
		} while (activerooms.has(this.roomID));
		activerooms.set(this.roomID, this);
	}
	deletethis() {
		activerooms.delete(this.roomID);
	}
}

function createRoom(req, res) {
	let { visibility, maxplayers, stacksize } = req.body;
	if (visibility !== "public" && visibility !== "private") {
		res.json({
			success: false,
			errormessage: "Invalid visibility choice",
			redirect: "/games/poker"
		});
	} else if (
		isNaN(maxplayers) ||
		Number(maxplayers) < 2 ||
		Number(maxplayers) > 12
	) {
		res.json({
			success: false,
			errormessage: "Invalid number of max players",
			redirect: "/games/poker"
		});
	} else if (
		isNaN(stacksize) ||
		(stacksize !== "2500" && stacksize !== "5000" && stacksize !== "10000")
	) {
		res.json({
			success: false,
			errormessage: "Invalid stack size choice",
			redirect: "/games/poker"
		});
	} else {
		const room = new Poker_Room(maxplayers, stacksize, visibility);
		res.json({
			success: true,
			redirect: `/games/poker/${room.roomID}`
		});
	}
}

async function checkroomID(req, res, roomID) {
	if (!roomID || isNaN(roomID) || !(roomID.toString().length === 6)) {
		res.json({ success: false, message: "Invalid roomID" });
	} else {
		roomID = Number(roomID);
		if (!activerooms.has(roomID)) {
			res.json({ success: false, message: "Not an active room" });
		} else {
			const room = activerooms.get(roomID);
			let removedreason = room.removedplayers.get(req.sessionID);
			if (removedreason === "Banned") {
				res.json({
					success: false,
					message: `You have been banned. You can no longer join this room.`
				});
			} else if (removedreason === "Kicked") {
				res.json({
					success: false,
					message: `You have been kicked from this room. You cannot join for 1 minute after being kicked`
				});
			} else {
				clearTimeout(room.deletetimer);
				room.deletetimer = null;
				if (!room.round) {
					if (room.nplayers < room.maxplayers) {
						await joinroom(req, res, roomID, room);
					} else {
						res.json({
							success: false,
							message: `${room.roomID} is already full. Please join another room, or contact the host`
						});
					}
				} else {
					res.json({
						success: false,
						messsage: `This game has already begun. Please join another room, or contact the host`
					});
				}
			}
		}
	}
}

async function joinroom(req, res, roomID, room) {
	const socket = socketutils.getpokersocket(
		(await RedisClient.getSession(req.sessionID)).socketids.poker_socket
	);
	await RedisClient.setSessiondouble(
		req.sessionID,
		["PokerData", "ingame"],
		[
			{
				roomID: room.roomID,
				maxplayers: room.maxplayers,
				gameactive: false
			},
			true
		]
	);
	room.nplayers += 1;
	room.players.set(
		req.session.AccountInfo.Username,
		new players.Player(
			req.sessionID,
			socket,
			req.session.AccountInfo.Username,
			room.stacksize,
			room.nplayers === 1,
			req.session.AccountInfo.Visuals.AccountImage,
			req.session.AccountInfo.Earnings.Poker
		)
	);
	room.usernames.push(req.session.AccountInfo.Username);
	res.json({
		success: true,
		message: `${roomID} \n This room has ${
			room.nplayers
		} players in out of ${room.maxplayers}
        You are host: ${
			room.players.get(req.session.AccountInfo.Username).host
		}`
	});
	if (room.nplayers === 1) {
		room.host = room.players.get(req.session.AccountInfo.Username);
		room.host.poker_socket.emit("updatehost");
	}
	socket.join(roomID);
	const playerInfo = Array.from(room.players.values()).map((player) => ({
		icon: player.icon,
		username: player.username,
		earnings: player.earnings,
		host: player.host
	}));
	PokerIO.to(roomID).emit("playerjoin", playerInfo);
}

async function removeplayer(req, res, username, type) {
	const room = activerooms.get(req.session.PokerData?.roomID);
	const player = room?.players.get(username);
	if (
		!req.session.AccountInfo.Username ||
		req.session.AccountInfo.Username !== room.host.username ||
		room.round !== 0 ||
		!player ||
		player.username === room.host.username
	) {
		res.json({ success: false });
	} else {
		forceddisconnect(room, username);
		player.poker_socket.leave(room.roomID);
		player.poker_socket.emit(`Removed: ${type}`);
		await RedisClient.setSessiondouble(
			player.sessionID,
			["PokerData", "ingame"],
			[null, false]
		);
		room.removedplayers.set(player.sessionID, type);
		if (type === "Kicked") {
			setTimeout(() => {
				room.removedplayers.delete(player.sessionID);
			}, 60_000);
		}
		res.json({ success: true });
	}
}

function forceddisconnect(room, username) {
	room.nplayers -= 1;
	room.players.delete(username);
	room.usernames = room.usernames.filter((Username) => Username !== username);
	const playerInfo = Array.from(room.players.values()).map((player) => ({
		icon: player.icon,
		username: player.username,
		earnings: player.earnings,
		host: player.host
	}));
	PokerIO.to(room.roomID).emit("playerwaitingleave", playerInfo);
}

async function pokerDisconnect(sessionID, path) {
	const session = await RedisClient.getSession(sessionID);
	if (session.PokerData && activerooms.get(Number(path.slice(-6)))) {
		if (session.PokerData.gameactive) {
			await activeDisconnect(sessionID, session);
		} else {
			await waitingDisconnect(sessionID, session);
		}
	}
}

async function waitingDisconnect(sessionID, session) {
	const room = activerooms.get(session.PokerData.roomID);
	room.nplayers -= 1;
	room.players.delete(session.AccountInfo.Username);
	room.usernames = room.usernames.filter(
		(username) => username !== session.AccountInfo.Username
	);
	if (room.usernames[0]) {
		if (room.host.username === session.AccountInfo.Username) {
			const newhost = room.players.get(room.usernames[0]);
			newhost.host = true;
			room.host = newhost;
			room.host.poker_socket.emit("updatehost");
		}
	} else {
		room.deletetimer = setTimeout(() => {
			room.deletethis();
		}, 5 * 60 * 1000);
	}
	await RedisClient.setSessiondouble(
		sessionID,
		["PokerData", "ingame"],
		[null, false]
	);
	const playerInfo = Array.from(room.players.values()).map((player) => ({
		icon: player.icon,
		username: player.username,
		earnings: player.earnings,
		host: player.host
	}));
	PokerIO.to(room.roomID).emit("playerwaitingleave", playerInfo);
}

async function activeDisconnect(sessionID, session) {
	//to be added
	await RedisClient.setSession(sessionID, "ingame", false);
}

function showpublicrooms(req, res) {
	const publicRooms = Array.from(activerooms.values())
		.filter(
			(room) =>
				room.visibility === "public" &&
				room.round === 0 &&
				room.nplayers < room.maxplayers
		)
		.map((room) => ({
			RoomID: room.roomID,
			nplayers: room.nplayers,
			maxplayers: room.maxplayers,
			stacksize: room.stacksize
		}));
	res.json({ rooms: JSON.stringify(publicRooms) });
}

module.exports = {
	activerooms,
	checkroomID,
	createRoom,
	pokerDisconnect,
	showpublicrooms,
	setPokerIO,
	removeplayer
};
